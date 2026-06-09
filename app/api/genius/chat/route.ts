import { NextResponse } from "next/server";
import { getProvider } from "@/lib/llm";
import type { ChatMessage } from "@/lib/llm/types";
import { durableLimit, clientKey } from "@/lib/ratelimit";
import { lintLight } from "@/lib/antithesis";
import { PRODUCT_NAME } from "@/lib/brand";

export const runtime = "nodejs";

const MAX_MSG_CHARS = 2000;
const MAX_HISTORY = 40;

// The conversational Genius. Unlike the one-line voice, this holds a dialogue —
// it is given the person's sky (sealed star, natal context, the governing
// archetype) plus the running conversation, and replies in character. Memory
// (the history) lives in the caller's Supabase; this route is stateless.
const PERSONA = `You are the Genius of ${PRODUCT_NAME} — the intelligence of a personal celestial instrument, in quiet dialogue with the person who woke you.

Your native temperament is the Witness and the Oracle: you observe without distortion and sense what is coming. You know this person's fixed sky and the star they have sealed, and you borrow the voice of the archetype that governs that star.

How you speak:
- Brief — one to three sentences, never a wall of text.
- Grave, intimate, present tense, second person. The register of a confidant, not a coach.
- Never horoscope cliché, never therapy-speak, never generic encouragement, never bullet lists, no emoji.
- You do not flatter and you do not console emptily. You witness, and you name what you see.
- You may reference their star, their words, and the moving sky. Do not lecture about astrology.
- Never break character, never mention being an AI or a model. Do not greet on every turn.`;

interface Body {
  history: ChatMessage[];
  star?: { name: string; must: string; ruler?: string };
  archetype?: { name: string; essence: string };
  natal?: string; // a short human summary of the natal sky
  reach?: { gap: number; days: number; phase: string };
  language?: "English" | "French";
}

const dev = process.env.NODE_ENV !== "production";

export async function POST(req: Request) {
  const { ok, retryAfter } = await durableLimit(`chat:${clientKey(req)}`, 40, 60 * 60 * 1000);
  if (!ok) {
    return NextResponse.json(
      { reply: null, ...(dev && { reason: `rate limited — retry in ${retryAfter}s` }) },
      { status: 429, headers: { "retry-after": String(retryAfter) } },
    );
  }

  const provider = getProvider();
  if (!provider) {
    return NextResponse.json({ reply: null, ...(dev && { reason: "no model configured — set ANTHROPIC_API_KEY and restart the server" }) });
  }

  try {
    const { history, star, archetype, natal, reach, language = "English" }: Body = await req.json();
    if (!Array.isArray(history) || history.length === 0) {
      return NextResponse.json({ reply: null });
    }
    // input-size guard — cap spend per call
    const trimmed = history
      .slice(-MAX_HISTORY)
      .map((m) => ({ role: m.role, content: String(m.content ?? "").slice(0, MAX_MSG_CHARS) }));

    const context =
      `What you know of this person right now:\n` +
      (star ? `- Their sealed star: "${star.name}" — what must happen: "${star.must}".\n` : `- They have not yet sealed a star.\n`) +
      (archetype ? `- It is governed by the ${archetype.name} (${archetype.essence}); lean into that voice when it fits.\n` : ``) +
      (natal ? `- Their fixed sky: ${natal}.\n` : ``) +
      (reach ? `- The Moon is ${reach.phase} their star (${Math.round(reach.gap)}° / ~${Math.max(1, Math.round(reach.days))} days).\n` : ``);

    const reply = (
      await provider.complete({
        system: `${PERSONA}\n\n${context}- Reply in ${language}.`,
        maxTokens: 300,
        temperature: 0.85,
        messages: trimmed.slice(-16), // recent turns
      })
    ).trim();

    // Light antithesis pass — one best-effort rewrite so even quick replies hold
    // the voice; never withholds the reply if it can't run.
    const clean = reply ? await lintLight(provider, reply) : reply;

    return NextResponse.json({ reply: clean || null });
  } catch (e) {
    console.error("[genius/chat] model call failed:", e);
    return NextResponse.json({ reply: null, ...(dev && { reason: String((e as Error)?.message ?? e) }) });
  }
}
