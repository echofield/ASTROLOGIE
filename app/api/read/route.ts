import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ascendant, equalHouses, houseOf, midheaven } from "@/lib/ascendant";
import { archetypeForStar } from "@/lib/archetypes";
import { ACCESS_COOKIE, readOpen, verifyAccess } from "@/lib/access";
import { displaySky, signOf, SIGN_NAME } from "@/lib/chart";
import { getProvider } from "@/lib/llm";
import type { LLMProvider } from "@/lib/llm/types";
import { READ_METHOD, STANDING_SPINE_METHOD, STANDING_MONTH_METHOD } from "@/lib/read-method";
import { lintField } from "@/lib/antithesis";
import { detect, PIVOT_PATTERNS } from "@/lib/read-lint";
import { judge, regenSection } from "@/lib/read-judge";
import { rateLimit, clientKey } from "@/lib/ratelimit";
import type { Profile } from "@/lib/storage";
import type { SealedStar } from "@/lib/star";
import { computeYearAhead, tightestNatalAspects } from "@/lib/transits";

export const runtime = "nodejs";

function hasAccess(cookieVal: string | undefined): boolean {
  if (readOpen()) return true;
  if (!cookieVal) return false;
  return verifyAccess(cookieVal).ok;
}

function parseReadJson(raw: string): Record<string, string> | null {
  let text = raw.trim();
  if (text.startsWith("```")) {
    text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  }
  try {
    const obj = JSON.parse(text) as Record<string, unknown>;
    const keys = ["signature", "chart", "pattern", "star", "yearAhead", "counsel"] as const;
    const out: Record<string, string> = {};
    for (const k of keys) {
      if (typeof obj[k] !== "string" || !obj[k]) return null;
      out[k] = obj[k];
    }
    return out;
  } catch {
    return null;
  }
}

// Pick the one earned pivot the artifact may keep: the first clean-pivot flag,
// never in the counsel (the bible bans a pivot there). All other flags rewrite.
function pickProtected(obj: Record<string, unknown>): string | null {
  for (const [field, val] of Object.entries(obj)) {
    if (field === "counsel" || typeof val !== "string") continue;
    const piv = detect(val).flags.find((f) => PIVOT_PATTERNS.has(f.pattern));
    if (piv) return piv.sentence;
  }
  return null;
}

// Enforce the antithesis gate over every string field of an artifact (including
// nested chapter strings for the Standing). Rewrites every flag except the one
// budgeted pivot; the route refuses to return anything with violations > 0.
async function enforce<T extends Record<string, unknown>>(
  provider: LLMProvider,
  obj: T,
): Promise<{ artifact: T; before: number; after: number; passes: number; kept: number }> {
  const protect = pickProtected(obj);
  const out: Record<string, unknown> = { ...obj };
  let before = 0, after = 0, passes = 0;
  for (const [field, val] of Object.entries(obj)) {
    if (typeof val === "string") {
      const r = await lintField(provider, val, { protect });
      out[field] = r.text; before += r.before; after += r.after; passes = Math.max(passes, r.passes);
    } else if (Array.isArray(val)) {
      const arr = val.map((x) => (x && typeof x === "object" ? { ...(x as Record<string, unknown>) } : x));
      for (const item of arr) {
        if (!item || typeof item !== "object") continue;
        const rec = item as Record<string, unknown>;
        for (const [k, v] of Object.entries(rec)) {
          if (typeof v !== "string") continue;
          const r = await lintField(provider, v, { protect });
          rec[k] = r.text; before += r.before; after += r.after; passes = Math.max(passes, r.passes);
        }
      }
      out[field] = arr;
    }
  }
  // `after` still counts the budgeted pivot if one was kept; violations excludes it.
  return { artifact: out as T, before, after, passes, kept: protect ? 1 : 0 };
}

export async function POST(req: Request) {
  // Cost guard — a read is an expensive Sonnet call. Cap per IP. Skipped in
  // READ_OPEN test mode (the paywall is already bypassed there).
  if (!readOpen()) {
    const rl = rateLimit(`read:${clientKey(req)}`, 6, 60 * 60 * 1000);
    if (!rl.ok) {
      return NextResponse.json({ error: "rate_limited", retryAfter: rl.retryAfter },
        { status: 429, headers: { "retry-after": String(rl.retryAfter) } });
    }
  }

  const jar = await cookies();
  const cookieVal = jar.get(ACCESS_COOKIE)?.value;
  if (!hasAccess(cookieVal)) {
    return NextResponse.json({ error: "payment_required" }, { status: 402 });
  }

  const provider = getProvider();
  if (!provider) {
    return NextResponse.json({ error: "dormant" }, { status: 503 });
  }

  try {
    const body = await req.json();
    const span: "moment" | "spine" | "month" = body.span ?? "moment";

    // The Standing — same engine, longer span. The client assembles `context`
    // (chart + sealed year-questions + spine chapter + Day's Record/aura history).
    if (span === "spine" || span === "month") {
      const raw = await provider.complete({
        model: "claude-sonnet-4-6",
        maxTokens: span === "spine" ? 4000 : 3500,
        temperature: 0.85,
        system: span === "spine" ? STANDING_SPINE_METHOD : STANDING_MONTH_METHOD,
        messages: [{ role: "user", content: JSON.stringify(body.context ?? {}) }],
      });
      let text = raw.trim();
      if (text.startsWith("```")) text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
      let draft: Record<string, unknown>;
      try { draft = JSON.parse(text) as Record<string, unknown>; }
      catch { return NextResponse.json({ error: "parse_failed" }, { status: 500 }); }
      const { artifact, before, after, passes, kept } = await enforce(provider, draft);
      if (after - kept > 0) return NextResponse.json({ error: "antithesis_unconverged", residual: after - kept }, { status: 502 });
      return NextResponse.json({ ...artifact, span, generatedAt: new Date().toISOString(), _lint: { before, after, kept, passes } });
    }

    const { profile, intake, star } = body as {
      profile: Profile;
      intake: { season: string; repeating: string; afraid: string };
      star: SealedStar;
    };

    const birth = new Date(profile.birthISO);
    const natal = displaySky(birth);
    let asc: number | null = null;
    let mc: number | null = null;
    let houses: number[] | null = null;

    if (profile.lat != null && profile.lon != null) {
      asc = ascendant(birth, profile.lat, profile.lon);
      mc = midheaven(birth, profile.lon);
      houses = equalHouses(asc);
    }

    const natalAspects = tightestNatalAspects(natal, asc, mc, 3);
    const transits = computeYearAhead(natal, asc, mc, new Date());
    const arch = archetypeForStar(star);

    const payload = {
      birth: profile.birthISO,
      place: profile.place,
      natal: Object.fromEntries(
        Object.entries(natal).map(([k, v]) => [k, {
          lon: v, sign: SIGN_NAME[signOf(v)],
          ...(asc != null ? { house: houseOf(v, asc) } : {}),
        }]),
      ),
      // houses only exist when we have a real Ascendant — never fabricate one
      hasHouses: asc != null,
      asc: asc != null ? { lon: asc, sign: SIGN_NAME[signOf(asc)] } : null,
      mc: mc != null ? { lon: mc, sign: SIGN_NAME[signOf(mc)] } : null,
      houses,
      natalAspects,
      transits,
      intake,
      sealedStar: {
        name: star.name,
        must: star.must,
        lon: star.lon,
        sign: SIGN_NAME[signOf(star.lon)],
        // real house from the real Ascendant, or null — no fabricated house
        house: asc != null ? houseOf(star.lon, asc) : null,
        resonance: star.resonance,
        sealedAt: star.sealedAt,
      },
      archetype: { name: arch.name, essence: arch.essence },
    };

    const raw = await provider.complete({
      model: "claude-sonnet-4-6",
      maxTokens: 5000,
      temperature: 0.85,
      system: READ_METHOD,
      messages: [{ role: "user", content: JSON.stringify(payload) }],
    });

    const parsed = parseReadJson(raw);
    if (!parsed) return NextResponse.json({ error: "parse_failed" }, { status: 500 });

    const generatedAt = new Date().toISOString();
    // one immutable subject for the whole lifecycle (reads overwrite in astrolabe_reads;
    // the event trail keeps them plural). Client writes these under its own session.
    const evt = (event_type: string, payload: Record<string, unknown>) => ({
      subject_type: "read" as const, subject_id: generatedAt, event_type, payload,
      idempotency_key: `${generatedAt}:${event_type}`,
    });
    const lifecycle: ReturnType<typeof evt>[] = [];

    // L2/L3 — deterministic lint gate (detect → rewrite loop → pivot budget)
    let lint = await enforce(provider, parsed);
    if (lint.after - lint.kept > 0) return NextResponse.json({ error: "antithesis_unconverged", residual: lint.after - lint.kept }, { status: 502 });
    let current = lint.artifact;
    lifecycle.push(evt("read_generated", { span: "moment", model: "claude-sonnet-4-6" }));
    lifecycle.push(evt("read_lint_passed", { before: lint.before, after: lint.after, kept: lint.kept, passes: lint.passes }));

    // L4 — judge the clean artifact; on a section-level fail, regenerate ONLY those
    // sections, re-run the FULL L2/L3 lint on the result (never skip the tic-check),
    // then re-judge. Hard cap: at most 2 retries, then stop.
    let verdict = await judge(provider, current);
    let regenLintFailed = false;
    for (let attempt = 0; verdict && !verdict.pass && attempt < 2; attempt++) {
      for (const s of verdict.sections.filter((x) => !x.pass)) {
        const fresh = await regenSection(provider, payload, s.section, current[s.section] ?? "", s.failures);
        if (fresh) current = { ...current, [s.section]: fresh };
      }
      lint = await enforce(provider, current); // re-lint the whole artifact
      if (lint.after - lint.kept > 0) { regenLintFailed = true; break; }
      current = lint.artifact;
      verdict = await judge(provider, current);
    }
    const lintPayload = { before: lint.before, after: lint.after, kept: lint.kept, passes: lint.passes };

    if (regenLintFailed) {
      lifecycle.push(evt("read_judged_failed", { reason: "antithesis_unconverged_on_regen", residual: lint.after - lint.kept }));
      return NextResponse.json({ error: "judge_failed", _lifecycle: lifecycle }, { status: 422 });
    }
    if (verdict === null) {
      // judge unavailable (infra/parse) — ship the lint-clean read, but record the skip so it's visible
      lifecycle.push(evt("read_judged_skipped", { reason: "judge_unavailable" }));
      return NextResponse.json({ ...current, generatedAt, _lint: lintPayload, _lifecycle: lifecycle });
    }
    if (!verdict.pass) {
      // failed after the 2-retry cap — ship NOTHING; record the failure for the operator
      lifecycle.push(evt("read_judged_failed", { failedSections: verdict.sections.filter((s) => !s.pass) }));
      return NextResponse.json({ error: "judge_failed", _lifecycle: lifecycle }, { status: 422 });
    }
    lifecycle.push(evt("read_judged_passed", { pivotCount: verdict.pivotCount, sections: verdict.sections.map((s) => ({ section: s.section, pass: s.pass })) }));
    return NextResponse.json({ ...current, generatedAt, _lint: lintPayload, _lifecycle: lifecycle });
  } catch (e) {
    console.error("[read] failed:", e);
    return NextResponse.json({ error: "generation_failed" }, { status: 500 });
  }
}
