// The doorway generation — the same machine the Reading runs, pointed through a
// mask. One chart engine, one lint, one judge; the config decides the lens and
// the section contract. Runs server-side with nobody watching (the webhook),
// so every failure throws a stage-tagged error and the LEDGER is the held-queue:
// a paid row without report_generated is the operator's signal.
import { getProvider } from "@/lib/llm";
import { displaySky, signOf, SIGN_NAME } from "@/lib/chart";
import { ascendant, midheaven, equalHouses, houseOf } from "@/lib/ascendant";
import { tightestNatalAspects, computeYearAhead } from "@/lib/transits";
import { lintField } from "@/lib/antithesis";
import { judge, regenSection } from "@/lib/read-judge";
import { splitSentences } from "@/lib/read-lint";
import { productMethod } from "./method";
import type { ProductConfig } from "./types";

const L1_MODEL = "claude-fable-5";

export interface DoorBirth {
  birthISO: string;
  place?: string;
  lat?: number;
  lon?: number;
  timeUnknown?: boolean;
}

export interface DoorInput {
  birth: DoorBirth;
  quiz: Record<string, string>;
  language?: "en" | "fr";
}

export class GenerationError extends Error {
  constructor(public stage: "no_provider" | "generation_failed" | "parse_failed" | "judge_failed", message: string) {
    super(message);
  }
}

function stripFence(t: string): string {
  let s = t.trim();
  if (s.startsWith("```")) s = s.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  return s;
}

/** The chart payload a doorway reads — same engine, same honesty rules as core. */
export function buildDoorPayload(birth: DoorBirth, quiz: Record<string, string>) {
  const d = new Date(birth.birthISO);
  const natal = displaySky(d);
  let asc: number | null = null;
  let mc: number | null = null;
  let houses: number[] | null = null;
  // a real horizon needs real coordinates AND a real hour — never a fabricated noon
  if (birth.lat != null && birth.lon != null && !birth.timeUnknown) {
    asc = ascendant(d, birth.lat, birth.lon);
    mc = midheaven(d, birth.lon);
    houses = equalHouses(asc);
  }
  return {
    birth: birth.birthISO,
    place: birth.place ?? null,
    natal: Object.fromEntries(
      Object.entries(natal).map(([k, v]) => [k, {
        lon: v, sign: SIGN_NAME[signOf(v as number)],
        ...(asc != null ? { house: houseOf(v as number, asc) } : {}),
      }]),
    ),
    hasHouses: asc != null,
    asc: asc != null ? { lon: asc, sign: SIGN_NAME[signOf(asc)] } : null,
    mc: mc != null ? { lon: mc, sign: SIGN_NAME[signOf(mc)] } : null,
    houses,
    natalAspects: tightestNatalAspects(natal, asc, mc, 3),
    transits: computeYearAhead(natal, asc, mc, new Date()),
    answers: quiz,
  };
}

export interface DoorArtifact {
  sections: Record<string, string>;
  generatedAt: string;
}

/** Generate a doorway reading through the full quality gate. Throws GenerationError. */
export async function generateProduct(cfg: ProductConfig, input: DoorInput): Promise<DoorArtifact> {
  const provider = getProvider();
  if (!provider) throw new GenerationError("no_provider", "no model configured");
  const language = input.language === "fr" ? "fr" : "en";
  const payload = buildDoorPayload(input.birth, input.quiz);

  // L1 — the masked method under the shared voice
  let raw: string;
  try {
    raw = await provider.complete({
      model: L1_MODEL,
      maxTokens: language === "fr" ? 20000 : 12000,
      system: productMethod(cfg, language),
      messages: [{ role: "user", content: JSON.stringify(payload) }],
    });
  } catch (e) {
    throw new GenerationError("generation_failed", String((e as Error)?.message ?? e));
  }

  let parsed: Record<string, string>;
  try {
    const obj = JSON.parse(stripFence(raw)) as Record<string, unknown>;
    parsed = {};
    for (const s of cfg.sections) {
      const v = obj[s.key];
      if (typeof v !== "string" || !v.trim()) throw new Error(`missing section "${s.key}"`);
      parsed[s.key] = v.trim();
    }
  } catch (e) {
    throw new GenerationError("parse_failed", String((e as Error)?.message ?? e));
  }

  // L2/L3 — the deterministic gate. Doorways carry ZERO pivot budget.
  for (const s of cfg.sections) {
    const r = await lintField(provider, parsed[s.key], { protect: null, language });
    if (r.after > 0) throw new GenerationError("generation_failed", `lint not clean on "${s.key}" (${r.after} residual)`);
    parsed[s.key] = r.text;
  }

  // L4 — the judge grades the contract; one regen round for failing sections
  let verdict = await judge(provider, parsed, language);
  if (verdict && !verdict.pass) {
    for (const sec of verdict.sections) {
      if (sec.pass || !parsed[sec.section]) continue;
      const regen = await regenSection(provider, payload, sec.section, parsed[sec.section], sec.failures, language);
      if (regen) {
        const r = await lintField(provider, regen, { protect: null, language });
        if (r.after === 0) parsed[sec.section] = r.text;
      }
    }
    verdict = await judge(provider, parsed, language);
    if (verdict && !verdict.pass) throw new GenerationError("judge_failed", "sections failed after regen");
  }
  // judge unavailable (verdict null) → ship rather than strand a paid customer; the trail shows the skip

  // the closing line is ONE sentence — distilled if the model overran it
  const last = cfg.sections[cfg.sections.length - 1].key;
  if (splitSentences(parsed[last]).length > 1) {
    try {
      const one = (await provider.complete({
        model: "claude-sonnet-4-6",
        maxTokens: 200,
        system: language === "fr"
          ? "Vous recevez une conclusion de plusieurs phrases. Renvoyez UNIQUEMENT la phrase unique la plus forte, fidèle au texte, sans guillemets."
          : "You receive a multi-sentence closing. Return ONLY the single strongest sentence, faithful to the text, no quotes.",
        messages: [{ role: "user", content: parsed[last] }],
      })).trim().replace(/^["'«»\s]+|["'«»\s]+$/g, "");
      if (one) parsed[last] = one;
    } catch { /* keep the multi-sentence closing over failing the whole artifact */ }
  }

  return { sections: parsed, generatedAt: new Date().toISOString() };
}
