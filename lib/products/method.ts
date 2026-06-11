import { VOICE, VOICE_FR } from "@/lib/read-method";
import type { ProductConfig } from "./types";

// The mask assembler. A doorway's generation method is: the shared VOICE bible
// (the constant — prompt-cached prefix, identical to the Reading's), then the
// product LENS (emphasis, never omission), then the section contract from
// config. core does NOT pass through here — its READ_METHOD predates the
// registry and stays byte-identical; doorways are born in this file.
//
// The law this file keeps: tone modulates WITHIN the voice. The lint and the
// judge run on every doorway's output exactly as they run on the Reading's.

export function productMethod(cfg: ProductConfig, language: "en" | "fr" = "en"): string {
  const voice = language === "fr" ? VOICE_FR : VOICE;
  const last = cfg.sections[cfg.sections.length - 1];
  const body = cfg.sections.slice(0, -1);

  const sectionLines = body
    .map((s, i) => `${i + 1}. "${s.key}" — ${s.label}. Two to four paragraphs in the voice. Each paragraph holds at least one observable, falsifiable claim drawn from the chart or from the person's own words.`)
    .join("\n");

  return `${voice}

THE LENS — ${cfg.displayName.toUpperCase()} (${cfg.doorway})
This reading is drawn through one lens: ${cfg.lens.themes.join("; ")}.
Inflection within the voice (never a different voice): ${cfg.tone}.
Read the WHOLE chart — nothing is omitted — but the reading leans on ${cfg.lens.bodies.join(", ")}${cfg.lens.houses.length ? `, and on houses ${cfg.lens.houses.join(", ")} when hasHouses is true` : ""}. Other placements appear only when they sharpen the lens's claim.

THE SOURCE
You receive a JSON payload: the natal chart (true ecliptic longitudes, computed), natalAspects with orbs, transits with dates, hasHouses, and the person's own funnel answers. The answers are testimony — quote their words sparingly and exactly; what repeats in them is the thread.

DATA RULES — non-negotiable.
- Real astronomy only. Cite placements and transits exactly as given; never invent a position, an aspect, or a date.
- If hasHouses is false the hour is unknown: NO houses, NO Ascendant, NO Midheaven, anywhere. Name the missing hour once if it matters; never fabricate a horizon.
- A transit appears only when it anchors a specific observable claim (voice rule 14).

THE SECTIONS — write exactly these, in order.
${sectionLines}
${cfg.sections.length}. "${last.key}" — ${last.label}. ONE sentence. The whole reading folded into a single line the person could carry for a year. Flat and direct — no negation pivot, no comfort, no uplift (voice rules 12 and 13). It is the line they will remember; earn it.

OUTPUT
Return ONLY a JSON object with exactly these keys, every value a string in ${language === "fr" ? "French" : "English"}:
${cfg.sections.map((s) => `"${s.key}"`).join(", ")}
For any quotation inside a value use ${language === "fr" ? "the French quotation marks « » — NEVER the straight double quote \\\", it breaks the JSON" : "single quotation marks — never an unescaped double quote"}. No markdown, no commentary, no keys beyond the contract.`;
}

/** The preview's computed slots — {sunSign}-style fills from the real chart. */
export function fillPreview(template: string, slots: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, k: string) => slots[k] ?? "");
}
