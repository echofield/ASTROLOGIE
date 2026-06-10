// Which zodiac wedges stand above the local horizon right now.
// The wheel's wedges are the tropical signs, so each is represented by its
// center point on the ecliptic (λ = i·30°+15°, β = 0) converted to equatorial
// and then to altitude for the observer. Classical spherical formulae; the
// fixed obliquity drifts arcseconds per decade — invisible at glow precision.
import { SiderealTime } from "astronomy-engine";

const RAD = Math.PI / 180;
const EPS = 23.437 * RAD;

/** Altitude (degrees) of a sign's ecliptic center for an observer at lat/lon. */
export function signAltitude(signIndex: number, date: Date, latDeg: number, lonDeg: number): number {
  const lam = (signIndex * 30 + 15) * RAD;
  const dec = Math.asin(Math.sin(lam) * Math.sin(EPS));
  const ra = Math.atan2(Math.sin(lam) * Math.cos(EPS), Math.cos(lam)); // radians
  const lstDeg = SiderealTime(date) * 15 + lonDeg; // local apparent sidereal time, degrees
  const H = (((lstDeg - ra / RAD) % 360) + 360) % 360 * RAD; // hour angle
  const phi = latDeg * RAD;
  return Math.asin(Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(H)) / RAD;
}

/** The twelve wedges, true where the sign's center is above the horizon. */
export function signsAboveHorizon(date: Date, latDeg: number, lonDeg: number): boolean[] {
  return Array.from({ length: 12 }, (_, i) => signAltitude(i, date, latDeg, lonDeg) > 0);
}
