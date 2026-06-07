// L2 — the deterministic antithesis detector. Ported verbatim from detect.mjs
// (16/16 recall, 0 false positives on the live Reads). Detection is CODE, so the
// model cannot rationalize the "not X, it's Y" family back in. Returns flagged
// sentences with the matched pattern; L3 rewrites only these, then we re-detect
// until residual === 0.

export interface AntithesisFlag { index: number; sentence: string; pattern: string; note: string; }
export interface DetectResult { total: number; flags: AntithesisFlag[]; sentenceCount: number; }

// ---- sentence splitter (punctuation-aware) ----
export function splitSentences(text: string): string[] {
  const rough = text.replace(/\s+/g, " ").match(/[^.!?;]+[.!?;]+|\S[^.!?;]*$/g) || [];
  return rough.map((s) => s.trim()).filter(Boolean);
}

interface Pattern { name: string; re: RegExp; note: string; pairOnly?: boolean; }

// ---- the patterns ---- (RECALL first; false positives are cheap, L3 decides)
export const PATTERNS: Pattern[] = [
  {
    name: "not_X_it_is_Y",
    re: /\bis\s+not\b[^.!?;—–-]*?[.!?;,—–-]\s*(it|that|this|they|these)\s+(is|are)\b/i,
    note: "is not X / it is Y reversal",
  },
  {
    name: "never_X_it_is_Y",
    // "The exit was never the honest move — it was the practiced one." (pivot via 'never')
    re: /\b(is|are|was|were)\s+never\b[^.!?;—–-]*?[.!?;,—–-]\s*(it|that|this|they|these)\s+(is|are|was|were)\b/i,
    note: "is/was never X / it is Y reversal",
  },
  {
    name: "never_X_noun_was_Y",
    // non-pronoun completion: "The numbers were never the missing piece — the signature was."
    // em-dash + a determiner-led noun subject + a clause-final copula (short Y or elliptical).
    re: /\b(?:is|are|was|were)\s+never\b[^.!?;—–]*?[—–]\s*(?:the|a|an|this|that|those|these)\s+[a-z]+(?:\s+[a-z]+){0,2}\s+(?:is|are|was|were)\b(?:\s+[a-z]+){0,3}\s*(?=[.!?;]|$)/i,
    note: "was never X — [noun] was Y reversal (non-pronoun completion)",
  },
  {
    name: "not_A_but_B",
    re: /\bnot\s+(from\s+|out\s+of\s+|about\s+|a\s+|an\s+|the\s+)?[^.!?;,—–-]{2,40}?,?\s+but\s+/i,
    note: "not A but B",
  },
  {
    name: "X_does_not_Y_it_Zs",
    re: /\bdoes\s+not\s+[a-z]+[^.!?;,—–-]*?[.,;—–-]\s*(it|that|this)\s+[a-z]+s\b/i,
    note: "X does not Y, it Zs",
  },
  {
    name: "this_is_not_NOUN_it_is_NOUN",
    re: /\b(this|that|it)\s+is\s+not\s+(a|an|the)?\s*[a-z][^.!?;,—–-]*?[;.,—–-]\s*(it|that|this)\s+is\s+(a|an|the)?/i,
    note: "this is not [noun]; it is [noun]",
  },
  {
    name: "not_in_the_X_sense_but",
    re: /\bnot\b[^.!?;]*?\bin\s+the\s+[a-z]+\s+sense\b/i,
    note: "not in the X sense (paired-sense reversal)",
  },
  {
    name: "these_are_not_X_they_are_Y",
    re: /\b(these|those|they)\s+are\s+not\b[^.!?;—–-]*?[—–.;,-]\s*(they|these|those)\s+are\b/i,
    note: "these are not X, they are Y",
  },
  {
    name: "not_the_NOUN_the_NOUN",
    re: /^\s*not\s+the\s+[a-z]+\b[^.!?;]*?[—–-]\s*the\s+[a-z]+\b/i,
    note: "Not the X — the Y (elliptical)",
  },
  {
    name: "is_not_X_period_it_is",
    re: /\bis\s+not\s+(whether|that|about|a|an|the)\b/i,
    note: "is not [whether/that/about] ... (likely setup for 'It is')",
  },
  {
    name: "bare_negation_then_it_is",
    re: /\b(is|are|was|were)\s+not\s+[a-z][^.!?;]*$/i,
    note: "negated predicate (pairs with following 'It is')",
    pairOnly: true,
  },
];

// The clean single-pivot forms — the ones the bible rations to ONE per Read.
// The budget protects the first of these (never in the counsel); every other
// flag, pivot or disguise, is rewritten.
export const PIVOT_PATTERNS = new Set([
  "not_X_it_is_Y", "never_X_it_is_Y", "is_not_X_period_it_is", "cross_period_reversal",
]);

// The second half of a cross-period reversal: "It is / They are ..."
const FOLLOWUP_ASSERT = /^\s*(it|that|this|they|these)\s+(is|are|was|were)\b/i;

export function detect(text: string): DetectResult {
  const sentences = splitSentences(text);
  const flags: AntithesisFlag[] = [];
  const flagged = new Set<number>();

  // pass 1: single-sentence patterns
  for (let i = 0; i < sentences.length; i++) {
    const s = sentences[i];
    for (const p of PATTERNS) {
      if (p.pairOnly) continue;
      if (p.re.test(s)) {
        flags.push({ index: i, sentence: s, pattern: p.name, note: p.note });
        flagged.add(i);
        break;
      }
    }
  }

  // pass 2: adjacent-pair patterns ("... is not X." + "It is Y.")
  for (let i = 0; i < sentences.length - 1; i++) {
    if (flagged.has(i)) continue;
    const a = sentences[i];
    const b = sentences[i + 1];
    const negated =
      /\b(is|are|was|were)\s+not\s+[a-z]/i.test(a) ||
      /\bnot\s+(primarily|simply|only|just|merely|really)\b/i.test(a);
    if (negated && FOLLOWUP_ASSERT.test(b)) {
      flags.push({
        index: i,
        sentence: `${a} ${b}`,
        pattern: "cross_period_reversal",
        note: "not X. / It is Y. (reversal split across a period)",
      });
      flagged.add(i);
      flagged.add(i + 1);
    }
  }

  flags.sort((x, y) => x.index - y.index);
  return { total: flags.length, flags, sentenceCount: sentences.length };
}
