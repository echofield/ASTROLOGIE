// Display layer for the engraved instruments: 10-body longitudes + zodiac data +
// position helpers. Logic engines stay on the 7 classical planets (lib/sky,
// lib/star); this is presentation only — the wheel may show all ten.

import {
  Body, SunPosition, EclipticGeoMoon, GeoVector, Ecliptic,
} from "astronomy-engine";
import { norm, SIGN_NAMES } from "./sky";

export const norm360 = norm;

export const SIGN_GLYPH = ["♈","♉","♊","♋","♌","♍","♎","♏","♐","♑","♒","♓"];
export const SIGN_NAME = SIGN_NAMES;
export const SIGN_KEY = [
  "aries","taurus","gemini","cancer","leo","virgo",
  "libra","scorpio","sagittarius","capricorn","aquarius","pisces",
];

export interface DisplayPlanet { key: string; glyph: string; name: string; }
export const PLANETS: DisplayPlanet[] = [
  { key: "sun", glyph: "☉", name: "Sun" },
  { key: "moon", glyph: "☽", name: "Moon" },
  { key: "mercury", glyph: "☿", name: "Mercury" },
  { key: "venus", glyph: "♀", name: "Venus" },
  { key: "mars", glyph: "♂", name: "Mars" },
  { key: "jupiter", glyph: "♃", name: "Jupiter" },
  { key: "saturn", glyph: "♄", name: "Saturn" },
  { key: "uranus", glyph: "♅", name: "Uranus" },
  { key: "neptune", glyph: "♆", name: "Neptune" },
  { key: "pluto", glyph: "♇", name: "Pluto" },
];
export const PLANET_GLYPH: Record<string, string> = Object.fromEntries(PLANETS.map((p) => [p.key, p.glyph]));
export const PLANET_NAME: Record<string, string> = Object.fromEntries(PLANETS.map((p) => [p.key, p.name]));

const BODY: Record<string, Body> = {
  mercury: Body.Mercury, venus: Body.Venus, mars: Body.Mars, jupiter: Body.Jupiter,
  saturn: Body.Saturn, uranus: Body.Uranus, neptune: Body.Neptune, pluto: Body.Pluto,
};

/** Geocentric apparent ecliptic longitude of-date for a display body. */
export function bodyLon(key: string, date: Date): number {
  if (key === "sun") return norm360(SunPosition(date).elon);
  if (key === "moon") return norm360(EclipticGeoMoon(date).lon);
  const b = BODY[key];
  if (!b) return 0;
  return norm360(Ecliptic(GeoVector(b, date, true)).elon);
}

export type LonMap = Record<string, number>;

export function displaySky(date: Date): LonMap {
  const out: LonMap = {};
  for (const p of PLANETS) out[p.key] = bodyLon(p.key, date);
  return out;
}

// ── position helpers (match the design's formatting) ──────────
export function signOf(lon: number): number { return Math.floor(norm360(lon) / 30); }
export function degInSign(lon: number): number { return norm360(lon) % 30; }

export function degStr(lon: number): string {
  const d = degInSign(lon);
  const deg = Math.floor(d);
  const min = Math.floor((d - deg) * 60);
  return `${deg}°${String(min).padStart(2, "0")}′`;
}
export function shortPos(lon: number): string {
  return `${Math.floor(degInSign(lon))}° ${SIGN_NAME[signOf(lon)]}`;
}

const MOON_DEG_PER_DAY = 13.176;
/** Whole+fractional days until the Moon next reaches `targetLon`. */
export function daysMoonToReach(targetLon: number, date: Date): number {
  const gap = norm360(targetLon - bodyLon("moon", date));
  return gap / MOON_DEG_PER_DAY;
}
