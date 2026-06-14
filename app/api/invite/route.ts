// THE PRIVATE INVITE — a one-time gift pipeline, off the paid path entirely.
// A door was opened for one friend: a single OTP, a chart, a reading drawn by
// the same engine the paywall uses (Opus 4.8 at max effort → antithesis lint →
// judge → one corrective regen), and a keepable PDF. Nothing is persisted; the
// reading lives only in the response. Generation runs minutes, not seconds.
import { NextResponse } from "next/server";
import { ascendant, equalHouses, houseOf, midheaven } from "@/lib/ascendant";
import { archetypeForStar } from "@/lib/archetypes";
import { displaySky, signOf, SIGN_NAME } from "@/lib/chart";
import { getProvider } from "@/lib/llm";
import type { LLMProvider } from "@/lib/llm/types";
import { READ_METHOD, READ_METHOD_FR } from "@/lib/read-method";
import { lintField } from "@/lib/antithesis";
import { judge, regenSection } from "@/lib/read-judge";
import { makeStar } from "@/lib/star";
import { buildPlate } from "@/lib/atlas/plate";
import { computeYearAhead, tightestNatalAspects } from "@/lib/transits";
import { rateLimit, clientKey } from "@/lib/ratelimit";
import type { Profile } from "@/lib/storage";

export const runtime = "nodejs";
// Same headroom as the paid read — L1 + lint + judge + regen is minutes-long.
export const maxDuration = 800;

const KEYS = ["signature", "chart", "pattern", "star", "yearAhead", "counsel"] as const;
type ReadKey = (typeof KEYS)[number];
type Read = Record<ReadKey, string>;

const otp = () => process.env.INVITE_OTP || "0001";

function parseRead(raw: string): Read | null {
  let t = raw.trim();
  if (t.startsWith("```")) t = t.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  try {
    const obj = JSON.parse(t) as Record<string, unknown>;
    const out = {} as Read;
    for (const k of KEYS) {
      if (typeof obj[k] !== "string" || !obj[k]) return null;
      out[k] = obj[k] as string;
    }
    return out;
  } catch { return null; }
}

// Lint every field through the antithesis gate (FR carries its own lexicon gate).
async function lintAll(provider: LLMProvider, read: Read, language: "en" | "fr"): Promise<Read> {
  const out = { ...read };
  for (const k of KEYS) {
    const r = await lintField(provider, out[k], { protect: null, language });
    out[k] = r.text;
  }
  return out;
}

interface InviteBody {
  otp?: string;
  probe?: boolean;
  name?: string;
  language?: "en" | "fr";
  birthISO?: string;
  place?: string;
  lat?: number | null;
  lon?: number | null;
  timeUnknown?: boolean;
  questions?: { question: string; answer: string }[];
}

export async function POST(req: Request) {
  // an invite is an expensive call — cap hard per IP
  const rl = rateLimit(`invite:${clientKey(req)}`, 8, 60 * 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: "rate_limited", retryAfter: rl.retryAfter }, { status: 429, headers: { "retry-after": String(rl.retryAfter) } });

  let body: InviteBody;
  try { body = (await req.json()) as InviteBody; }
  catch { return NextResponse.json({ error: "bad_request" }, { status: 400 }); }

  // the one key. probe = the gate's check, no generation.
  if (!body.otp || body.otp.trim() !== otp()) return NextResponse.json({ error: "denied" }, { status: 401 });
  if (body.probe) return NextResponse.json({ ok: true });

  const provider = getProvider();
  if (!provider) return NextResponse.json({ error: "dormant" }, { status: 503 });

  const language: "en" | "fr" = body.language === "fr" ? "fr" : "en";
  const name = (body.name || "").trim().slice(0, 80) || "friend";
  const qs = Array.isArray(body.questions) ? body.questions.filter((q) => q && typeof q.answer === "string" && q.answer.trim()).slice(0, 3) : [];
  if (!body.birthISO || qs.length < 1) return NextResponse.json({ error: "incomplete" }, { status: 400 });

  // chart — a real horizon needs real coordinates AND a real hour; never fabricate noon
  const timeUnknown = Boolean(body.timeUnknown);
  const birth = new Date(body.birthISO);
  if (Number.isNaN(birth.getTime())) return NextResponse.json({ error: "bad_birth" }, { status: 400 });

  const lonMap = displaySky(birth);
  const profile: Profile = {
    birthISO: body.birthISO,
    place: (body.place ?? "").trim(),
    // buildPlate recomputes the chart from birthISO+coords; this only satisfies the type
    natal: { positions: lonMap, birthISO: body.birthISO } as unknown as Profile["natal"],
    createdAt: new Date().toISOString(),
    ...(typeof body.lat === "number" ? { lat: body.lat } : {}),
    ...(typeof body.lon === "number" ? { lon: body.lon } : {}),
    timeUnknown,
  };
  let asc: number | null = null, mc: number | null = null, houses: number[] | null = null;
  if (profile.lat != null && profile.lon != null && !timeUnknown) {
    asc = ascendant(birth, profile.lat, profile.lon);
    mc = midheaven(birth, profile.lon);
    houses = equalHouses(asc);
  }

  // the three chosen questions become the intake; their own words feed the engine
  const intake = {
    season: qs[0] ? `${qs[0].question} — ${qs[0].answer.trim()}` : "",
    repeating: qs[1] ? `${qs[1].question} — ${qs[1].answer.trim()}` : "",
    afraid: qs[2] ? `${qs[2].question} — ${qs[2].answer.trim()}` : "",
  };
  // the star is drawn for the first thing they named
  const star = makeStar(qs[0].answer.trim().slice(0, 160), name);
  const arch = archetypeForStar(star);

  const payload = {
    birth: profile.birthISO,
    place: profile.place,
    natal: Object.fromEntries(Object.entries(lonMap).map(([k, v]) => [k, {
      lon: v, sign: SIGN_NAME[signOf(v as number)],
      ...(asc != null ? { house: houseOf(v as number, asc) } : {}),
    }])),
    hasHouses: asc != null,
    asc: asc != null ? { lon: asc, sign: SIGN_NAME[signOf(asc)] } : null,
    mc: mc != null ? { lon: mc, sign: SIGN_NAME[signOf(mc)] } : null,
    houses,
    natalAspects: tightestNatalAspects(lonMap, asc, mc, 3),
    transits: computeYearAhead(lonMap, asc, mc, new Date()),
    intake,
    sealedStar: {
      name: star.name, must: star.must, lon: star.lon, sign: SIGN_NAME[signOf(star.lon)],
      house: asc != null ? houseOf(star.lon, asc) : null, resonance: star.resonance, sealedAt: star.sealedAt,
    },
    archetype: { name: arch.name, essence: arch.essence },
  };

  try {
    // L1 — the raw voice. Opus 4.8 at max effort, adaptive thinking (Opus omits it by default).
    const raw = await provider.complete({
      model: "claude-opus-4-8",
      // high effort + adaptive thinking; budget holds the reasoning AND the JSON.
      // (max effort overthinks and truncates the JSON inside a tight cap — high is the sweet spot.)
      maxTokens: language === "fr" ? 24000 : 16000,
      thinking: true,
      effort: "high",
      system: language === "fr" ? READ_METHOD_FR : READ_METHOD,
      messages: [{ role: "user", content: JSON.stringify(payload) }],
    });
    let read = parseRead(raw);
    if (!read) return NextResponse.json({ error: "draw_failed" }, { status: 502 });

    // L2/L3 — antithesis lint over every section
    read = await lintAll(provider, read, language);

    // L4 — judge once; regen only the sections that fail, then ship. A gift never
    // hard-fails to the friend: best verdict wins, the reading is always returned.
    const verdict = await judge(provider, read, language);
    if (verdict && !verdict.pass) {
      for (const sv of verdict.sections) {
        if (sv.pass || !KEYS.includes(sv.section as ReadKey)) continue;
        const fixed = await regenSection(provider, payload, sv.section, read[sv.section as ReadKey], sv.failures, language);
        if (fixed) {
          const r = await lintField(provider, fixed, { protect: null, language });
          read[sv.section as ReadKey] = r.text;
        }
      }
    }

    // the geometry plate for the PDF wheel — same chart math
    const plate = buildPlate(profile, star.name);
    const question = qs.map((q) => q.question).join("  ·  ");

    return NextResponse.json({ read, plate, question, name, language, star: { glyph: star.glyph, name: star.name } });
  } catch (e) {
    console.error("[invite] generation failed:", e);
    return NextResponse.json({ error: "draw_failed" }, { status: 500 });
  }
}
