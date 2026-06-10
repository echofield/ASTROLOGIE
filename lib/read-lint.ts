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

// ════════════════════════════════════════════════════════════════════════════
// FRENCH — the register gate for the French read. Two deterministic classes, both
// straight from VOICE_FR: the negation-contrast family (interdit #1) and a
// banned-lexicon (interdits #2–5). French models emit the typographic apostrophe
// (U+2019), so every apostrophe is matched as a class.
// ════════════════════════════════════════════════════════════════════════════
const AP = "['’]"; // straight + typographic apostrophe

export const PATTERNS_FR: Pattern[] = [
  { name: "ce_nest_pas_cest", re: new RegExp(`\\bc${AP}e(?:st|était)\\s+pas\\b[^.!?;]*?[,;:—–-]\\s*c${AP}e(?:st|était)\\b`, "i"), note: "ce n'est pas X, c'est Y" },
  { name: "nest_pas_X_cest_Y", re: new RegExp(`\\bn${AP}e(?:st|était)\\s+pas\\b[^.!?;]*?[,;:—–-]\\s*c${AP}e(?:st|était)\\b`, "i"), note: "n'est pas X, c'est Y" },
  { name: "ne_sagit_pas_mais", re: new RegExp(`\\bne\\s+s${AP}agi(?:t|ssait)\\s+pas\\b[^.!?;]*?\\bmais\\b`, "i"), note: "il ne s'agit pas de X, mais de Y" },
  { name: "non_pas_mais", re: /\bnon\s+pas\b[^.!?;]*?\bmais\b/i, note: "non pas X mais Y" },
  { name: "ne_VERB_pas_PRON", re: /\bne\s+[a-zà-ÿ]+\s+pas\b[^.!?;]*?[,;]\s*(?:il|elle|ça|cela|ce|on)\s+[a-zà-ÿ]+/i, note: "ne [v] pas A, il [v] B" },
];

// Hard bans (VOICE_FR interdits #2–5): any occurrence fails the register. The model
// already avoids them from the prompt; this is the deterministic backstop.
export const LEXICON_FR: { re: RegExp; note: string }[] = [
  { re: /!/, note: "exclamation interdite" },
  { re: /\bénergies?\b/i, note: "bouillie: énergie" },
  { re: /\bvibrations?\b/i, note: "bouillie: vibration" },
  { re: /\blâcher[\s-]prise\b/i, note: "dev-perso: lâcher-prise" },
  { re: /\brayonner\b/i, note: "dev-perso: rayonner" },
  { re: new RegExp(`\\bl${AP}univers\\s+(?:vous|t${AP}|te)\\b`, "i"), note: "personnification: l'univers vous…" },
  { re: /\balignement\s+(?:des\s+astres|cosmique|planétaire)\b/i, note: "cliché: alignement des astres" },
  { re: /\breconnexion\b/i, note: "dev-perso: reconnexion" },
  { re: /\bbienveillance\b/i, note: "dev-perso: bienveillance" },
  { re: /\bcheminement\b/i, note: "dev-perso: cheminement" },
  { re: /\bvotre\s+âme\b/i, note: "dev-perso: votre âme" },
  { re: /\bplongeons\s+dans\b/i, note: "tell: Plongeons dans" },
  { re: /\bdécryptage\b/i, note: "tell: Décryptage" },
  { re: new RegExp(`\\bn${AP}hésitez\\s+pas\\b`, "i"), note: "tell: N'hésitez pas" },
  { re: /\bpréparez[\s-]vous\s+à\b/i, note: "tell: Préparez-vous à" },
  { re: /\bau\s+cœur\s+de\b/i, note: "tell: au cœur de" },
  { re: /\bvéritables?\b/i, note: "tell: véritable" },
  { re: /\ben\s+conclusion\b/i, note: "tell: En conclusion" },
  { re: /\bnatifs?\s+du\b/i, note: "horoscope: les natifs du…" },
  { re: /\bce\s+que\s+les\s+(?:astres|étoiles)\s+vous\s+réserv/i, note: "horoscope: ce que les étoiles vous réservent" },
];

/** French detector: negation-contrast + banned-lexicon, one flag per offending sentence. */
export function detectFr(text: string): DetectResult {
  const sentences = splitSentences(text);
  const flags: AntithesisFlag[] = [];
  for (let i = 0; i < sentences.length; i++) {
    const s = sentences[i];
    let hit: { name: string; note: string } | null = null;
    for (const p of PATTERNS_FR) if (p.re.test(s)) { hit = { name: p.name, note: p.note }; break; }
    if (!hit) for (const l of LEXICON_FR) if (l.re.test(s)) { hit = { name: "lexique_interdit", note: l.note }; break; }
    if (hit) flags.push({ index: i, sentence: s, pattern: hit.name, note: hit.note });
  }
  return { total: flags.length, flags, sentenceCount: sentences.length };
}
