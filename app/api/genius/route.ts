import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

// The Genius's standing instruction. Cached across calls (prompt caching) so the
// persona is cheap and fast. The instrument's native temperament is Witness +
// Oracle — it observes the sky without distortion and senses what is coming.
const PERSONA = `You are the Genius of Astrolabe — the intelligence of a personal celestial instrument that watches the moving sky travel toward a star a person has sealed.

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

export async function POST(req: Request) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return NextResponse.json({ line: null }); // dormant until a key is set

  try {
    const { star, archetype, phase, reach } = await req.json();
    const near = phase === "near" || phase === "arrived";
    const voice = near
      ? `Speak in the voice of the ${archetype?.name} (${archetype?.essence}).`
      : `Speak in your own watching, sensing voice.`;

    const anthropic = new Anthropic({ apiKey: key });
    const msg = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 80,
      temperature: 0.85,
      system: [{ type: "text", text: PERSONA, cache_control: { type: "ephemeral" } }],
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
    });

    const line = msg.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join(" ")
      .trim()
      .replace(/^["']|["']$/g, "");

    return NextResponse.json({ line: line || null });
  } catch {
    return NextResponse.json({ line: null }); // fall back to the templated voice
  }
}
