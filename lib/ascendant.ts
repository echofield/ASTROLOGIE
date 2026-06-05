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

/** Ecliptic longitude of the Ascendant (degrees, 0..360). */
export function ascendant(date: Date, latDeg: number, lonDeg: number): number {
  const r = ramc(date, lonDeg) * DEG;
  const e = meanObliquity(date) * DEG;
  const phi = latDeg * DEG;
  // standard horizon formula; atan2 resolves the quadrant
  let asc = Math.atan2(Math.cos(r), -(Math.sin(r) * Math.cos(e) + Math.tan(phi) * Math.sin(e))) / DEG;
  asc = norm360(asc);
  // ensure the Ascendant is the eastern point (opposite half from the MC)
  const mc = midheaven(date, lonDeg);
  const diff = norm360(asc - mc);
  if (diff < 180) asc = norm360(asc + 180);
  return asc;
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
