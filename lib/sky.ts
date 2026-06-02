import {
  Body,
  SunPosition,
  EclipticGeoMoon,
  GeoVector,
  Ecliptic,
} from "astronomy-engine";
import type {
  AspectInfo,
  AspectName,
  Contact,
  Longitude,
  NatalChart,
  PlanetName,
} from "./types";

export const PLANETS: PlanetName[] = [
  "Sun",
  "Moon",
  "Mercury",
  "Venus",
  "Mars",
  "Jupiter",
  "Saturn",
];

export const PLANET_GLYPH: Record<PlanetName, string> = {
  Sun: "☉",
  Moon: "☽",
  Mercury: "☿",
  Venus: "♀",
  Mars: "♂",
  Jupiter: "♃",
  Saturn: "♄",
};

export const ZODIAC = ["♈","♉","♊","♋","♌","♍","♎","♏","♐","♑","♒","♓"];
export const SIGN_NAMES = [
  "Aries","Taurus","Gemini","Cancer","Leo","Virgo",
  "Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces",
];

/** Geocentric apparent ecliptic longitude of-date (tropical) for any body, degrees [0,360). */
export function lonOf(planet: PlanetName, date: Date): Longitude {
  if (planet === "Sun") return norm(SunPosition(date).elon);
  if (planet === "Moon") return norm(EclipticGeoMoon(date).lon);
  const vec = GeoVector(Body[planet], date, true);
  return norm(Ecliptic(vec).elon);
}

export function natalChart(birth: Date, birthISO: string): NatalChart {
  const positions = {} as Record<PlanetName, Longitude>;
  for (const p of PLANETS) positions[p] = lonOf(p, birth);
  return { positions, birthISO };
}

/** Live longitudes of every body at a given instant. */
export function liveSky(date: Date): Record<PlanetName, Longitude> {
  const out = {} as Record<PlanetName, Longitude>;
  for (const p of PLANETS) out[p] = lonOf(p, date);
  return out;
}

// ---- aspects ----------------------------------------------------------------

export const ASPECTS: AspectInfo[] = [
  { name: "conjunction", angle: 0, tone: "harmony", glyph: "☌" },
  { name: "sextile", angle: 60, tone: "harmony", glyph: "⚹" },
  { name: "square", angle: 90, tone: "tension", glyph: "□" },
  { name: "trine", angle: 120, tone: "harmony", glyph: "△" },
  { name: "opposition", angle: 180, tone: "tension", glyph: "☍" },
];

const ASPECT_BY_NAME = Object.fromEntries(
  ASPECTS.map((a) => [a.name, a]),
) as Record<AspectName, AspectInfo>;

/** Smallest angular separation between two longitudes, 0..180. */
export function separation(a: Longitude, b: Longitude): number {
  const d = Math.abs(((a - b) % 360) + 360) % 360;
  return d > 180 ? 360 - d : d;
}

const WIDE_ORB = 6; // a window is forming
const TIGHT_ORB = 3; // the threshold is open

/** The Moon's relationship to an anchor longitude at a given instant. */
export function contact(moonLon: Longitude, anchor: Longitude): Contact {
  const sep = separation(moonLon, anchor);
  let nearest = ASPECTS[0];
  let best = Infinity;
  for (const a of ASPECTS) {
    const o = Math.abs(sep - a.angle);
    if (o < best) {
      best = o;
      nearest = a;
    }
  }
  const forming = best <= WIDE_ORB;
  const open = best <= TIGHT_ORB && nearest.tone === "harmony";
  return {
    separation: sep,
    nearest,
    orb: best,
    forming,
    open,
    tone: nearest.tone,
  };
}

export function aspectInfo(name: AspectName): AspectInfo {
  return ASPECT_BY_NAME[name];
}

// ---- zodiac helpers ---------------------------------------------------------

export function norm(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

export function signIndex(lon: Longitude): number {
  return Math.floor(norm(lon) / 30);
}

export function degInSign(lon: Longitude): number {
  return norm(lon) % 30;
}

/** "12° Leo" style label. */
export function lonLabel(lon: Longitude): string {
  const i = signIndex(lon);
  const d = Math.floor(degInSign(lon));
  return `${d}° ${SIGN_NAMES[i]}`;
}

// ---- the search: when does the next harmonious window open? -----------------

export interface Window {
  /** Hours from `from` until the threshold first opens. */
  hoursAway: number;
  date: Date;
  aspect: AspectName;
}

/**
 * Scan forward from `from` to find the next moment the threshold opens
 * (Moon within the tight orb of a harmonious aspect to the anchor).
 * Steps in 10-minute increments up to `limitHours`.
 */
export function nextWindow(
  anchor: Longitude,
  from: Date,
  limitHours = 72,
): Window | null {
  const stepMin = 10;
  const steps = (limitHours * 60) / stepMin;
  for (let i = 0; i <= steps; i++) {
    const d = new Date(from.getTime() + i * stepMin * 60_000);
    const c = contact(lonOf("Moon", d), anchor);
    if (c.open) {
      return { hoursAway: (i * stepMin) / 60, date: d, aspect: c.nearest.name };
    }
  }
  return null;
}
