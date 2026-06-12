import { NextResponse } from "next/server";
import { getProvider } from "@/lib/llm";
import { getProduct } from "@/lib/products/registry";
import { durableLimit, clientKey } from "@/lib/ratelimit";
import { detect, splitSentences } from "@/lib/read-lint";

export const runtime = "nodejs";

// The desire moment — a LIVE micro-analysis at the end of the questionnaire.
// Haiku reads the three answers and the real signs, writes 2–3 sentences in the
// house voice quoting the person's own words, and stops mid-sentence. Cheap
// (~$0.002), fast (fits inside the sphere's resolve), hard-limited, and the
// client falls back to the config template if anything here fails — the funnel
// never blocks on this call.

interface Body {
  product_type?: string;
  answers?: Record<string, string>;
  signs?: { sunSign?: string; venusSign?: string; saturnSign?: string };
}

export async function POST(req: Request) {
  const rl = await durableLimit(`doorprev:${clientKey(req)}`, 6, 60 * 60 * 1000);
  if (!rl.ok) return NextResponse.json({ preview: null }, { status: 429, headers: { "retry-after": String(rl.retryAfter) } });

  const provider = getProvider();
  if (!provider) return NextResponse.json({ preview: null });

  let body: Body;
  try { body = await req.json(); } catch { return NextResponse.json({ preview: null }); }
  const cfg = getProduct(body.product_type);
  if (!cfg?.door || !cfg.live) return NextResponse.json({ preview: null });

  const answers = Object.entries(body.answers ?? {})
    .filter(([k, v]) => typeof v === "string" && v.trim() && cfg.funnelQuestions.some((q) => q.key === k))
    .map(([k, v]) => {
      const q = cfg.funnelQuestions.find((x) => x.key === k)!;
      return `Q: ${q.q}\nA: ${String(v).slice(0, 240)}`;
    })
    .join("\n");
  if (!answers) return NextResponse.json({ preview: null });

  const signs = body.signs ?? {};
  const SYSTEM = `You write the FIRST LINES of a ${cfg.displayName} reading for The AstroLab — the taste before the purchase, never the meal.
Voice: warm observation, then cool precision. Observable claims only. Never comfort, never predict, no exclamation marks, no emoji, and NEVER the "not X, it's Y" contrast construction in any form. ${cfg.tone}.
This reading's lens: ${cfg.lens.themes.join("; ")}.
You receive the person's three answers (their exact words) and their real placements. Write 2–3 sentences, second person:
1. Recognize the precise pattern in THEIR OWN WORDS — quote one short phrase of theirs exactly, in single quotes.
2. Tie it to ONE placement you were given (e.g. Venus in ${signs.venusSign ?? "their sign"}) — the placement carries the claim, never decorates it.
3. Begin a final sentence that opens the deeper claim and STOP mid-sentence with an em dash followed by nothing: "because—" or "and that is where—"
Output the text only. No title, no preamble, under 80 words.`;

  try {
    const raw = (await provider.complete({
      // Sonnet, deliberately: the sharpest model that still WINS the resolve race
      // (Opus would mostly lose to the timeout and never be seen). ~$0.004/call.
      model: "claude-sonnet-4-6",
      maxTokens: 180,
      system: SYSTEM,
      messages: [{ role: "user", content: `Placements: Sun in ${signs.sunSign ?? "?"}, Venus in ${signs.venusSign ?? "?"}, Saturn in ${signs.saturnSign ?? "?"}.\n\n${answers}` }],
    })).trim();
    if (!raw) return NextResponse.json({ preview: null });

    // the same law as everywhere: a sentence carrying the tic is dropped, never shipped
    let clean = raw;
    const det = detect(clean);
    if (det.flags.length) {
      const bad = new Set(det.flags.map((f) => f.sentence.trim()));
      clean = splitSentences(clean).filter((s) => !bad.has(s.trim())).join(" ").trim();
    }
    return NextResponse.json({ preview: clean || null });
  } catch {
    return NextResponse.json({ preview: null });
  }
}
