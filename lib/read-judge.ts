// L4 — the Judge. Scores a lint-clean Read against the bible's §6 checklist, per
// section, and (on a section-level fail) regenerates only that section. Opus —
// taste call — with no temperature (4.8 deprecates the param). The judge is
// authoritative server-side; the route records its verdict as ledger events.
import type { LLMProvider } from "./llm/types";
import { VOICE } from "./read-method";

const MODEL = "claude-opus-4-8";

export const JUDGE_METHOD = `You are the editor-in-chief of The AstroLab, judging a finished reading against a fixed checklist before it can be kept. You are strict, specific, and you are NOT rewriting — you are scoring.

You receive a JSON object: the reading (keys: signature, chart, pattern, star, yearAhead, counsel). Judge EACH section against §6:
- OBSERVABLE: every paragraph contains an observable, falsifiable claim the reader could agree or dispute. Horoscope vagueness ("a season of transformation awaits") fails.
- NO_COMFORT_CLOSE: the section does not resolve into comfort, reassurance, or uplift; it names the structure and leaves. A redemption arc or a soft landing fails.
- NO_PREDICTION: it never claims what the person will choose or what will happen — only retrospective inevitability / what is already set in motion. yearAhead MAY name real transits by date (astronomy), but must not forecast the person's choices or outcomes.
- WARM_THEN_COOL: recognition before the cut; not cold judgment, not therapy-speak.
- PIVOT_BUDGET: at most ONE "not X, it's Y" / "never X, it's Y" antithesis pivot in the WHOLE reading, and NONE in counsel.

A section passes only if it clears every applicable test. For each failure, name the test and quote the exact offending phrase. Be exact; do not invent failures, and do not pass a section that genuinely breaks a rule.

Return ONLY this JSON, no prose, no code fence:
{ "pivotCount": <int across the whole reading>, "sections": [ { "section": "<name>", "pass": <bool>, "failures": [ { "test": "OBSERVABLE|NO_COMFORT_CLOSE|NO_PREDICTION|WARM_THEN_COOL|PIVOT_BUDGET", "quote": "<offending phrase>", "why": "<one line>" } ] } ], "pass": <bool overall> }`;

export const SECTION_REGEN_METHOD = `${VOICE}

— SECTION REGEN —
You are regenerating ONE section of a reading that failed the editor's check. You are given the full chart payload, the section name, the current text of that section, and the specific failures to fix. Rewrite ONLY that section — same length, same depth, same voice — fixing every named failure while keeping every legitimate claim and the real astronomy. Obey every voice rule above. Return ONLY a JSON object { "<section>": "<new markdown text>" }, no prose, no code fence.`;

export interface SectionFailure { test: string; quote: string; why: string }
export interface SectionVerdict { section: string; pass: boolean; failures: SectionFailure[] }
export interface JudgeResult { pivotCount: number; sections: SectionVerdict[]; pass: boolean }

function stripFence(t: string): string {
  let s = t.trim();
  if (s.startsWith("```")) s = s.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  return s;
}

/** Score a clean reading. Returns null on infra/parse failure (caller records a skip, never ships blind). */
export async function judge(provider: LLMProvider, reading: Record<string, string>): Promise<JudgeResult | null> {
  try {
    const raw = await provider.complete({
      model: MODEL,
      maxTokens: 2000,
      system: JUDGE_METHOD,
      messages: [{ role: "user", content: JSON.stringify(reading) }],
    });
    const parsed = JSON.parse(stripFence(raw)) as JudgeResult;
    if (!parsed || !Array.isArray(parsed.sections)) return null;
    // recompute overall pass — never trust the model's own `pass`
    const pass = parsed.sections.every((s) => s.pass) && (parsed.pivotCount ?? 0) <= 1;
    return { pivotCount: parsed.pivotCount ?? 0, sections: parsed.sections, pass };
  } catch { return null; }
}

/** Regenerate one failing section. Returns the new section text, or null on failure. */
export async function regenSection(
  provider: LLMProvider,
  chart: unknown,
  section: string,
  currentText: string,
  failures: SectionFailure[],
): Promise<string | null> {
  try {
    const raw = await provider.complete({
      model: MODEL,
      maxTokens: 1500,
      system: SECTION_REGEN_METHOD,
      messages: [{ role: "user", content: JSON.stringify({ chart, section, currentText, failures }) }],
    });
    const obj = JSON.parse(stripFence(raw)) as Record<string, unknown>;
    const text = obj[section];
    return typeof text === "string" && text.trim() ? text.trim() : null;
  } catch { return null; }
}
