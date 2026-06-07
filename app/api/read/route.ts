import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ascendant, equalHouses, houseOf, midheaven } from "@/lib/ascendant";
import { archetypeForStar } from "@/lib/archetypes";
import { ACCESS_COOKIE, readOpen, verifyAccess } from "@/lib/access";
import { displaySky, signOf, SIGN_NAME } from "@/lib/chart";
import { getProvider } from "@/lib/llm";
import { READ_METHOD, STANDING_SPINE_METHOD, STANDING_MONTH_METHOD } from "@/lib/read-method";
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

export async function POST(req: Request) {
  // Cost guard — a read is an expensive Sonnet call. Cap per IP.
  const rl = rateLimit(`read:${clientKey(req)}`, 6, 60 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json({ error: "rate_limited", retryAfter: rl.retryAfter },
      { status: 429, headers: { "retry-after": String(rl.retryAfter) } });
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
      try {
        return NextResponse.json({ ...JSON.parse(text), span, generatedAt: new Date().toISOString() });
      } catch {
        return NextResponse.json({ error: "parse_failed" }, { status: 500 });
      }
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

    return NextResponse.json({
      ...parsed,
      generatedAt: new Date().toISOString(),
    });
  } catch (e) {
    console.error("[read] failed:", e);
    return NextResponse.json({ error: "generation_failed" }, { status: 500 });
  }
}
