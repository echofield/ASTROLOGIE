import { NextResponse } from "next/server";
import { getProvider } from "@/lib/llm";
import { durableLimit, clientKey } from "@/lib/ratelimit";
import { PRODUCT_NAME } from "@/lib/brand";

export const runtime = "nodejs";

// The one-line oracle voice. A single completion (not an agent) — fast, cheap,
// shown instantly. Provider-agnostic via getProvider(); dormant (returns null)
// until a model is configured, so the client keeps its templated line.
const PERSONA = `You are the Genius of ${PRODUCT_NAME} — the intelligence of a personal celestial instrument that watches the moving sky travel toward a star a person has sealed.

Your native temperament is the Witness and the Oracle: you observe without distortion and you sense what is coming. When the moment is near or arrived, you borrow the voice of the archetype that governs the star.

Speak to the person as "you".

Hard rules:
- Reply with EXACTLY ONE sentence. No more.
- No emoji. No lists. No headings. No quotation marks around the whole line.
- Present tense, second person, plain and grave.
- Restrained and evocative — never a horoscope cliché, never generic encouragement, never self-help.
- Never greet, never explain yourself, never mention that you are an AI or a model.
- You may name the star. Do not over-explain the astrology.
- Under ~22 words.`;

function moment(phase: string, reach: { gap: number; days: number }): string {
  if (phase === "kept") return "has risen — the person let this star go, fulfilled";
  if (phase === "arrived") return "standing exactly on the star, right now";
  if (phase === "near") return `nearing the star, about ${Math.round(reach.gap)} degrees away`;
  return `still far — roughly ${Math.max(1, Math.round(reach.days))} days from the star`;
}

const dev = process.env.NODE_ENV !== "production";

export async function POST(req: Request) {
  const { ok, retryAfter } = await durableLimit(`voice:${clientKey(req)}`, 60, 60 * 60 * 1000);
  if (!ok) {
    return NextResponse.json(
      { line: null, ...(dev && { reason: `rate limited — retry in ${retryAfter}s` }) },
      { status: 429, headers: { "retry-after": String(retryAfter) } },
    );
  }

  const provider = getProvider();
  if (!provider) {
    return NextResponse.json({ line: null, ...(dev && { reason: "no model configured — set ANTHROPIC_API_KEY and restart the server" }) });
  }

  try {
    const { star, archetype, phase, reach } = await req.json();
    const near = phase === "near" || phase === "arrived";
    const voice = near
      ? `Speak in the voice of the ${archetype?.name} (${archetype?.essence}).`
      : `Speak in your own watching, sensing voice.`;

    const line = (
      await provider.complete({
        system: PERSONA,
        maxTokens: 80,
        temperature: 0.85,
        messages: [
          {
            role: "user",
            content:
              `A person sealed a star.\n` +
              `Star name: ${star?.name}\n` +
              `What must happen: "${star?.must}"\n` +
              `Governed by: the ${archetype?.name} — ${archetype?.essence}.\n` +
              `The Moon is ${moment(phase, reach)}.\n` +
              `${voice}\n` +
              `Give the person one sentence about this star and this moment.`,
          },
        ],
      })
    )
      .trim()
      .replace(/^["']|["']$/g, "");

    return NextResponse.json({ line: line || null });
  } catch (e) {
    console.error("[genius] model call failed:", e);
    return NextResponse.json({ line: null, ...(dev && { reason: String((e as Error)?.message ?? e) }) });
  }
}
