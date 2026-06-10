// L4 — the Judge. Scores a lint-clean Read against the bible's §6 checklist, per
// section, and (on a section-level fail) regenerates only that section. Opus —
// taste call — with no temperature (4.8 deprecates the param). The judge is
// authoritative server-side; the route records its verdict as ledger events.
import type { LLMProvider } from "./llm/types";
import { VOICE, VOICE_FR } from "./read-method";

const MODEL = "claude-opus-4-8";

export const JUDGE_METHOD = `You are the editor-in-chief of The AstroLab, judging a finished reading against a fixed checklist before it can be kept. You are strict, specific, and you are NOT rewriting — you are scoring.

You receive a JSON object: the reading (keys: signature, chart, pattern, star, yearAhead, counsel). Judge EACH section against §6:
- OBSERVABLE: every paragraph contains an observable, falsifiable claim the reader could agree or dispute. Horoscope vagueness ("a season of transformation awaits") fails.
- NO_COMFORT_CLOSE: the section does not resolve into comfort, reassurance, or uplift; it names the structure and leaves. A redemption arc or a soft landing fails.
- NO_PREDICTION: it never claims what the person will choose or what will happen — only retrospective inevitability / what is already set in motion. yearAhead MAY name real transits by date (astronomy), but must not forecast the person's choices or outcomes. EXCEPTION — the star section: it reads the intention the person has ALREADY SEALED, a commitment they have chosen and stated. Naming, restating, or reading that sealed intention — why this, why now, what in the chart it answers, what it will cost — is NOT prediction; never flag the person's own sealed words (e.g. "move in with her in the spring") as NO_PREDICTION. The star fails NO_PREDICTION only if it forecasts an OUTCOME of that intention — whether it will succeed, how others will respond, what the person will become — not for reading the chosen act itself.
- WARM_THEN_COOL: recognition before the cut; not cold judgment, not therapy-speak.
- PIVOT_BUDGET: at most ONE "not X, it's Y" / "never X, it's Y" antithesis pivot in the WHOLE reading, and NONE in counsel.

A section passes only if it clears every applicable test. For each failure, name the test and quote the exact offending phrase. Be exact; do not invent failures, and do not pass a section that genuinely breaks a rule.

Return ONLY this JSON, no prose, no code fence:
{ "pivotCount": <int across the whole reading>, "sections": [ { "section": "<name>", "pass": <bool>, "failures": [ { "test": "OBSERVABLE|NO_COMFORT_CLOSE|NO_PREDICTION|WARM_THEN_COOL|PIVOT_BUDGET", "quote": "<offending phrase>", "why": "<one line>" } ] } ], "pass": <bool overall> }`;

export const SECTION_REGEN_METHOD = `${VOICE}

— SECTION REGEN —
You are regenerating ONE section of a reading that failed the editor's check. You are given the full chart payload, the section name, the current text of that section, and the specific failures to fix. Rewrite ONLY that section — same length, same depth, same voice — fixing every named failure while keeping every legitimate claim and the real astronomy. Obey every voice rule above. Return ONLY a JSON object { "<section>": "<new markdown text>" }, no prose, no code fence.`;

// ── FRENCH — judge + section regen for the French read. Same output JSON shape. ──
export const JUDGE_METHOD_FR = `Vous êtes le rédacteur en chef de The AstroLab : vous jugez une lecture finie en français contre une liste de contrôle fixe avant qu'elle soit gardée. Strict, précis ; vous ne réécrivez pas — vous notez.

Vous recevez un objet JSON (clés : signature, chart, pattern, star, yearAhead, counsel). Jugez CHAQUE section contre :
- OBSERVABLE : chaque paragraphe contient une affirmation observable, réfutable, que le lecteur pourrait approuver ou contester. Le flou d'horoscope (« une saison de transformation s'annonce ») échoue.
- NO_COMFORT_CLOSE : la section ne se résout pas en réconfort, ni rassurance, ni note haute ; elle nomme la structure et part. Un arc rédempteur ou un atterrissage doux échoue.
- NO_PREDICTION : jamais ce que la personne choisira ni ce qui arrivera — seulement l'inévitabilité rétrospective / ce qui est déjà en mouvement. yearAhead PEUT nommer des transits réels par date (astronomie), sans prédire les choix ou résultats de la personne. EXCEPTION — la section star : elle lit l'intention DÉJÀ scellée, un engagement choisi et énoncé. La nommer, la redire, la lire (pourquoi, pourquoi maintenant, ce que le thème y répond, ce qu'elle coûte) n'est PAS une prédiction ; ne jamais signaler les mots scellés de la personne. La star échoue NO_PREDICTION seulement si elle prédit un RÉSULTAT (réussite, réaction des autres, ce que la personne deviendra).
- WARM_THEN_COOL : la reconnaissance avant la coupe ; ni jugement froid, ni langage thérapeutique.
- REGISTRE : registre littéraire français tenu — aucun ton d'horoscope de magazine, aucun lexique de développement personnel (énergies, vibrations, lâcher-prise, rayonner, âme, bienveillance, cheminement), aucun point d'exclamation, aucune antithèse « Ce n'est pas X, c'est Y » ni ses variantes. Le « vous » est tenu, sans flatterie.

Une section passe seulement si elle franchit chaque test applicable. Pour chaque échec, nommez le test et citez la phrase exacte fautive. Soyez exact ; n'inventez pas d'échec, et ne validez pas une section qui enfreint vraiment une règle.

Renvoyez UNIQUEMENT ce JSON, sans prose, sans clôture de code :
{ "pivotCount": <int sur toute la lecture>, "sections": [ { "section": "<nom>", "pass": <bool>, "failures": [ { "test": "OBSERVABLE|NO_COMFORT_CLOSE|NO_PREDICTION|WARM_THEN_COOL|REGISTRE", "quote": "<phrase fautive>", "why": "<une ligne>" } ] } ], "pass": <bool global> }`;

export const SECTION_REGEN_METHOD_FR = `${VOICE_FR}

— RÉGÉNÉRATION D'UNE SECTION —
Vous régénérez UNE section d'une lecture qui a échoué au contrôle du rédacteur. On vous donne le payload complet du thème, le nom de la section, le texte actuel de cette section, et les échecs précis à corriger. Réécrivez SEULEMENT cette section — même longueur, même profondeur, même voix — en corrigeant chaque échec nommé tout en gardant chaque affirmation légitime et l'astronomie réelle. Obéissez à chaque règle de voix ci-dessus. Renvoyez UNIQUEMENT un objet JSON { "<section>": "<nouveau texte markdown>" }, sans prose, sans clôture de code.`;

export interface SectionFailure { test: string; quote: string; why: string }
export interface SectionVerdict { section: string; pass: boolean; failures: SectionFailure[] }
export interface JudgeResult { pivotCount: number; sections: SectionVerdict[]; pass: boolean }

function stripFence(t: string): string {
  let s = t.trim();
  if (s.startsWith("```")) s = s.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  return s;
}

/** Score a clean reading. Returns null on infra/parse failure (caller records a skip, never ships blind). */
export async function judge(provider: LLMProvider, reading: Record<string, string>, language: "en" | "fr" = "en"): Promise<JudgeResult | null> {
  try {
    const raw = await provider.complete({
      model: MODEL,
      maxTokens: 2000,
      system: language === "fr" ? JUDGE_METHOD_FR : JUDGE_METHOD,
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
  language: "en" | "fr" = "en",
): Promise<string | null> {
  try {
    const raw = await provider.complete({
      model: MODEL,
      maxTokens: 1500,
      system: language === "fr" ? SECTION_REGEN_METHOD_FR : SECTION_REGEN_METHOD,
      messages: [{ role: "user", content: JSON.stringify({ chart, section, currentText, failures }) }],
    });
    const obj = JSON.parse(stripFence(raw)) as Record<string, unknown>;
    const text = obj[section];
    return typeof text === "string" && text.trim() ? text.trim() : null;
  } catch { return null; }
}
