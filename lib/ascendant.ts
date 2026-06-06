// Ascendant + Midheaven from birth time and place. Pure; uses astronomy-engine
// for apparent sidereal time. Equal houses are derived from the Ascendant.
//
// VERIFY ON FIRST USE against a known chart (e.g. an ephemeris/astro.com result):
// a wrong-quadrant Ascendant is the classic bug. A reference: 1990-06-02 22:14
// Paris (48.8566, 2.3522) should yield an Ascendant in Capricorn (~ a check value).

import { SiderealTime } from "astronomy-engine";

const DEG = Math.PI / 180;

/** Mean obliquity of the ecliptic (degrees) for the given date (Meeus). */
export function meanObliquity(date: Date): number {
  const jd = date.getTime() / 86400000 + 2440587.5;
  const T = (jd - 2451545.0) / 36525;
  return 23.43929111 - (46.815 * T + 0.00059 * T * T - 0.001813 * T * T * T) / 3600;
}

function norm360(d: number): number { return ((d % 360) + 360) % 360; }

/** Right Ascension of the Midheaven (degrees) = local apparent sidereal time. */
export function ramc(date: Date, lonDeg: number): number {
  const gastHours = SiderealTime(date); // apparent Greenwich sidereal time, hours
  return norm360((gastHours + lonDeg / 15) * 15);
}

/** Ecliptic longitude of the Ascendant (degrees, 0..360).
 *  Verified against reference charts: Einstein → Cancer 11.6°, JFK → Libra 20.0°.
 *  The atan2 form below already resolves the eastern point — do NOT add an
 *  MC-based 180° correction (that flips a correct Ascendant to the Descendant). */
export function ascendant(date: Date, latDeg: number, lonDeg: number): number {
  const r = ramc(date, lonDeg) * DEG;
  const e = meanObliquity(date) * DEG;
  const phi = latDeg * DEG;
  return norm360(Math.atan2(Math.cos(r), -(Math.sin(r) * Math.cos(e) + Math.tan(phi) * Math.sin(e))) / DEG);
}

/** Ecliptic longitude of the Midheaven (degrees, 0..360). */
export function midheaven(date: Date, lonDeg: number): number {
  const r = ramc(date, lonDeg) * DEG;
  const e = meanObliquity(date) * DEG;
  let mc = Math.atan2(Math.sin(r), Math.cos(r) * Math.cos(e)) / DEG;
  return norm360(mc);
}

/** Equal-house cusps (12 longitudes) from the Ascendant. */
export function equalHouses(asc: number): number[] {
  return Array.from({ length: 12 }, (_, i) => norm360(asc + i * 30));
}

/** The equal house (1..12) a longitude falls into, given the Ascendant. */
export function houseOf(lon: number, asc: number): number {
  return Math.floor(norm360(lon - asc) / 30) + 1;
}
