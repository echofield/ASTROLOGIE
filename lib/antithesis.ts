// L3 — the antithesis rewrite primitives, shared by the heavy Read/Standing
// pipeline (looping, gated on residual === 0) and the light conversational
// follow-up (one best-effort pass). Detection (L2) is in read-lint.ts; the
// rewrite sees ONLY flagged sentences, and code applies them by string match.
import type { LLMProvider } from "./llm/types";
import { ANTITHESIS_REWRITE_METHOD } from "./read-method";
import { detect, type AntithesisFlag } from "./read-lint";

const REWRITE_MODEL = "claude-opus-4-8"; // taste matters on the rewrite; use the strongest

/** One focused rewrite call. Returns index → rewrite for each flagged sentence. */
export async function rewriteFlagged(provider: LLMProvider, flags: AntithesisFlag[]): Promise<Map<number, string>> {
  const list = flags.map((f) => ({ index: f.index, sentence: f.sentence }));
  const raw = await provider.complete({
    model: REWRITE_MODEL,
    maxTokens: 2000,
    // no temperature — Opus 4.8 deprecates the param; determinism comes from the
    // narrow task (rewrite only the flagged sentences)
    system: ANTITHESIS_REWRITE_METHOD,
    messages: [{ role: "user", content: "Rewrite each flagged sentence. Return the JSON array only.\n\n" + JSON.stringify(list, null, 2) }],
  });
  let text = raw.trim();
  if (text.startsWith("```")) text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  const arr = JSON.parse(text) as { index: number; rewrite: string }[];
  return new Map(arr.map((r) => [r.index, r.rewrite]));
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Replace flagged sentences (pairs may be joined by a space). Whitespace-tolerant,
 *  strips any leftover halves, and collapses an accidentally repeated leading clause
 *  so a rewrite can never leave a doubled phrase in a paid artifact. */
export function applyRewrites(text: string, flags: AntithesisFlag[], byIndex: Map<number, string>): string {
  let out = text;
  for (const f of flags) {
    const replacement = byIndex.get(f.index);
    if (!replacement) continue;
    // use a function replacer so `$` in the rewrite is never treated as a backref
    if (out.includes(f.sentence)) {
      out = out.replace(f.sentence, () => replacement);
      continue;
    }
    const flex = new RegExp(escapeRe(f.sentence).replace(/\s+/g, "\\s+"));
    if (flex.test(out)) {
      out = out.replace(flex, () => replacement);
      continue;
    }
    // fallback: replace the first half, then strip any leftover trailing halves
    const parts = f.sentence.split(/(?<=[.;])\s+/);
    if (parts[0] && out.includes(parts[0])) {
      out = out.replace(parts[0], () => replacement);
      for (const rest of parts.slice(1)) if (rest && out.includes(rest)) out = out.replace(rest, "");
    }
  }
  // dedupe guard: collapse an accidental immediately-repeated leading clause
  // ("That is the procedure's opposite. That is the procedure's opposite — …")
  out = out.replace(/([A-Z][^.!?;]{7,}?)([.!?;])\s+(?=\1\b)/g, "").replace(/[ \t]{2,}/g, " ").trim();
  return out;
}

/**
 * Heavy: detect → rewrite → re-detect until residual 0 or maxPasses. Convergent
 * (each pass strictly removes flagged sentences). Caller gates on `after`.
 */
export async function lintField(
  provider: LLMProvider,
  text: string,
  opts: { maxPasses?: number; protect?: string | null } = {},
): Promise<{ text: string; before: number; after: number; passes: number }> {
  const { maxPasses = 4, protect = null } = opts;
  const before = detect(text).total;
  let current = text;
  let passes = 0;
  while (passes < maxPasses) {
    // skip the one budgeted pivot the artifact is allowed to keep
    const flags = detect(current).flags.filter((f) => !protect || f.sentence !== protect);
    if (flags.length === 0) break;
    let byIndex: Map<number, string>;
    try { byIndex = await rewriteFlagged(provider, flags); }
    catch (e) { console.error("[antithesis] rewrite pass failed:", (e as Error)?.message ?? e); break; }
    current = applyRewrites(current, flags, byIndex);
    passes++;
  }
  return { text: current, before, after: detect(current).total, passes };
}

/**
 * Light: a single best-effort pass for conversational replies. Never throws and
 * never withholds the reply — if the rewrite errors, the original text is kept.
 * So even quick follow-ups hold the voice without the heavy gate's latency.
 */
export async function lintLight(provider: LLMProvider, text: string): Promise<string> {
  const { total, flags } = detect(text);
  if (total === 0) return text;
  try {
    const byIndex = await rewriteFlagged(provider, flags);
    return applyRewrites(text, flags, byIndex);
  } catch {
    return text;
  }
}
