// A sealed star: a human intention turned into a celestial object.
// The words are deterministic seeds for a glyph, a place on the zodiac, a
// planetary ruler, a house and a resonance. The *reach* is real — computed
// from the live Moon (which moves ~13.18°/day) toward the star's longitude.

import { lonOf } from "./sky";
import type { Longitude } from "./types";

export interface SealedStar {
  must: string;
  name: string;
  lon: Longitude;
  glyph: string;
  ruler: string;
  rulerGlyph: string;
  resonance: string;
  house: string;
  sealedAt: string; // ISO
}

const GLYPHS = ["✶", "✷", "✦", "❋", "✸", "✹", "❂", "✺", "✱", "⁂"];
const RULERS: [string, string, string][] = [
  ["☉", "Sun", "What only you can author."],
  ["☽", "Moon", "What you carry, made visible."],
  ["☿", "Mercury", "The word that must move."],
  ["♀", "Venus", "What you love, made durable."],
  ["♂", "Mars", "The move that takes nerve."],
  ["♃", "Jupiter", "The leap toward more."],
  ["♄", "Saturn", "The long vow you keep."],
];
const HOUSES = ["I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII"];

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function makeStar(must: string, name: string): SealedStar {
  const h = hash(must.trim().toLowerCase() + "·" + name.trim().toLowerCase());
  const ruler = RULERS[h % 7];
  return {
    must: must.trim(),
    name: name.trim(),
    lon: (h >>> 2) % 360,
    glyph: GLYPHS[(h >>> 5) % GLYPHS.length],
    rulerGlyph: ruler[0],
    ruler: ruler[1],
    resonance: ruler[2],
    house: HOUSES[(h >>> 9) % 12],
    sealedAt: new Date().toISOString(),
  };
}

const MOON_DEG_PER_DAY = 13.176;

export interface Reach {
  moonLon: Longitude;
  /** Degrees of zodiac the Moon must still travel forward to conjoin the star. */
  gap: number;
  /** Approximate days until that conjunction. */
  days: number;
  /** Headline string: degrees when near, days when far. */
  headline: string;
  near: boolean;
}

/** The live relationship between the Moon and a sealed star at `date`. */
export function reachOf(star: SealedStar, date: Date): Reach {
  const moonLon = lonOf("Moon", date);
  const gap = ((star.lon - moonLon) % 360 + 360) % 360; // forward to conjunction
  const days = gap / MOON_DEG_PER_DAY;
  const near = gap <= 30;
  const headline = near
    ? `${Math.max(1, Math.round(gap))}°`
    : `${Math.round(days)} days`;
  return { moonLon, gap, days, headline, near };
}
