// The next sky beat — the Genius headline's one sentence, chosen by priority:
//   1. an exact transit to the user's chart within 7 days
//   2. a lunation within 7 days
//   3. the next day of the chart ruler ("the heavens are still travelling
//      toward Friday" — Venus's day, for a Venus-ruled chart)
// Deterministic templates in the house register; the gold word is the beat.
// (A voice-pipeline phrasing can replace the templates later — the BEAT
// selection stays this code either way.)
import { computeYearAhead, type TransitAspect } from "@/lib/transits";
import { lonOf } from "@/lib/sky";
import type { LonMap } from "@/lib/chart";

export interface Beat { pre: string; ill: string; post: string }

const DAY = 86400000;
const norm = (x: number) => ((x % 360) + 360) % 360;

const WEEKDAY = {
  en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  fr: ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"],
};
// sign index → ruling planet → that planet's weekday
const SIGN_RULER_DAY = [2, 5, 3, 1, 0, 3, 5, 2, 4, 6, 6, 4]; // Mars Ve Me Mo Su Me Ve Ma Ju Sa Sa Ju

const PLANET = {
  en: { jupiter: "Jupiter", saturn: "Saturn", uranus: "Uranus", neptune: "Neptune", pluto: "Pluto" } as Record<string, string>,
  fr: { jupiter: "Jupiter", saturn: "Saturne", uranus: "Uranus", neptune: "Neptune", pluto: "Pluton" } as Record<string, string>,
};
const POINT = {
  en: { sun: "Sun", moon: "Moon", mercury: "Mercury", venus: "Venus", mars: "Mars", asc: "Ascendant", mc: "Midheaven" } as Record<string, string>,
  fr: { sun: "Soleil", moon: "Lune", mercury: "Mercure", venus: "Vénus", mars: "Mars", asc: "Ascendant", mc: "Milieu du Ciel" } as Record<string, string>,
};
const VERB: Record<TransitAspect, { en: string; fr: string }> = {
  conjunction: { en: "reaches", fr: "rejoint" },
  opposition: { en: "faces", fr: "s'oppose à" },
  square: { en: "squares", fr: "heurte" },
  trine: { en: "steadies", fr: "soutient" },
  sextile: { en: "leans toward", fr: "incline vers" },
};

function lunationWithin(now: Date, days: number): { kind: "full" | "new"; inNights: number } | null {
  const elong = (d: Date) => norm(lonOf("Moon", d) - lonOf("Sun", d));
  let prev = elong(now);
  for (let i = 1; i <= days; i++) {
    const cur = elong(new Date(now.getTime() + i * DAY));
    if (prev < 180 && cur >= 180) return { kind: "full", inNights: i };
    if (prev > 300 && cur < 60) return { kind: "new", inNights: i };
    prev = cur;
  }
  return null;
}

export function nextBeat(natal: LonMap, lang: "en" | "fr", now: Date = new Date()): Beat {
  const fr = lang === "fr";

  // 1 — an exact transit inside the week (asc/mc only when truly known; callers
  //     without a real hour pass none, and the rule holds product-wide)
  try {
    const hits = computeYearAhead(natal, null, null, now);
    for (const h of hits) {
      const d = new Date(h.date);
      if (Number.isNaN(d.getTime())) continue;
      const dd = (d.getTime() - now.getTime()) / DAY;
      if (dd < 0 || dd > 7) continue;
      const T = (fr ? PLANET.fr : PLANET.en)[h.transiting.toLowerCase()] ?? h.transiting;
      const P = (fr ? POINT.fr : POINT.en)[h.natalPoint.toLowerCase()] ?? h.natalPoint;
      const day = WEEKDAY[fr ? "fr" : "en"][d.getDay()];
      const sameDay = dd < 1;
      return fr
        ? { pre: `${T} ${VERB[h.aspect].fr} votre ${P} `, ill: sameDay ? "aujourd'hui" : day, post: "." }
        : { pre: `${T} ${VERB[h.aspect].en} your ${P} on `, ill: sameDay ? "this very day" : day, post: "." };
    }
  } catch { /* fall through to the moon */ }

  // 2 — a lunation inside the week
  const lun = lunationWithin(now, 7);
  if (lun) {
    const n = lun.inNights;
    if (lun.kind === "full") {
      return fr
        ? { pre: "La ", ill: "pleine lune", post: n <= 1 ? " se tient cette nuit." : ` se tient dans ${n} nuits.` }
        : { pre: "The ", ill: "Full Moon", post: n <= 1 ? " stands tonight." : ` stands in ${n} nights.` };
    }
    return fr
      ? { pre: "Une ", ill: "nouvelle lune", post: n <= 1 ? " retourne le mois cette nuit." : ` retourne le mois dans ${n} nuits.` }
      : { pre: "A ", ill: "New Moon", post: n <= 1 ? " turns the month tonight." : ` turns the month in ${n} nights.` };
  }

  // 3 — the chart ruler's day (the resting line)
  const signIdx = Math.floor(norm(natal.sun ?? 0) / 30) % 12;
  const target = SIGN_RULER_DAY[signIdx];
  const todayIdx = now.getDay();
  const day = WEEKDAY[fr ? "fr" : "en"][target];
  if (target === todayIdx) {
    return fr
      ? { pre: "Le ciel se tient avec vous — ce jour est ", ill: "le vôtre", post: "." }
      : { pre: "The heavens stand with you — this day is ", ill: "yours", post: "." };
  }
  return fr
    ? { pre: "Rien ne presse encore. Le ciel chemine vers ", ill: day, post: "." }
    : { pre: "Nothing presses yet. The heavens are still travelling toward ", ill: day, post: "." };
}
