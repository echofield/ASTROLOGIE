import { bodyLon, type LonMap } from "./chart";
import { ASPECTS, separation } from "./sky";

export type TransitAspect = "conjunction" | "opposition" | "square" | "trine" | "sextile";

export interface YearAheadHit {
  date: string;
  transiting: string;
  aspect: TransitAspect;
  natalPoint: string;
  exactDeg: number;
}

export interface NatalAspect {
  bodyA: string;
  bodyB: string;
  aspect: TransitAspect;
  orb: number;
}

const TRANSITING = ["jupiter", "saturn", "uranus", "neptune", "pluto"] as const;
const NATAL_BODIES = ["sun", "moon", "mercury", "venus", "mars"] as const;

const SLOW_WEIGHT: Record<string, number> = {
  pluto: 5, neptune: 4, uranus: 3, saturn: 2, jupiter: 1,
};
const POINT_WEIGHT: Record<string, number> = {
  sun: 4, moon: 4, asc: 4, mc: 3, mercury: 1, venus: 1, mars: 1,
};

function nearestAspect(sep: number): { aspect: TransitAspect; orb: number } | null {
  let best: { aspect: TransitAspect; orb: number } | null = null;
  for (const a of ASPECTS) {
    const orb = Math.abs(sep - a.angle);
    if (orb <= 1 && (!best || orb < best.orb)) {
      best = { aspect: a.name as TransitAspect, orb };
    }
  }
  return best;
}

function refineExactDay(
  transiting: string,
  natalLon: number,
  aspectAngle: number,
  coarse: Date,
): { date: Date; exactDeg: number } {
  let bestDate = coarse;
  let bestOrb = Infinity;
  for (let d = -1; d <= 1; d++) {
    const dt = new Date(coarse.getTime() + d * 86400000);
    const tLon = bodyLon(transiting, dt);
    const sep = separation(tLon, natalLon);
    const orb = Math.abs(sep - aspectAngle);
    if (orb < bestOrb) {
      bestOrb = orb;
      bestDate = dt;
    }
  }
  return { date: bestDate, exactDeg: bestOrb };
}

function hitKey(h: YearAheadHit): string {
  return `${h.transiting}:${h.aspect}:${h.natalPoint}`;
}

function scoreHit(h: YearAheadHit): number {
  const slow = SLOW_WEIGHT[h.transiting] ?? 1;
  const point = POINT_WEIGHT[h.natalPoint] ?? 1;
  const tight = Math.max(0, 1 - h.exactDeg);
  return slow * 10 + point * 5 + tight * 20;
}

/** Year-ahead outer-planet transits to natal points (top ~8 by significance). */
export function computeYearAhead(
  natalLon: LonMap,
  asc: number | null,
  mc: number | null,
  from: Date,
): YearAheadHit[] {
  const natalPoints: Record<string, number> = {};
  for (const b of NATAL_BODIES) natalPoints[b] = natalLon[b];
  if (asc != null) natalPoints.asc = asc;
  if (mc != null) natalPoints.mc = mc;

  const hits: YearAheadHit[] = [];
  const seen = new Set<string>();
  const end = from.getTime() + 365 * 86400000;
  const stepMs = 3 * 86400000;

  for (let t = from.getTime(); t <= end; t += stepMs) {
    const coarse = new Date(t);
    for (const transiting of TRANSITING) {
      const tLon = bodyLon(transiting, coarse);
      for (const [natalPoint, nLon] of Object.entries(natalPoints)) {
        const match = nearestAspect(separation(tLon, nLon));
        if (!match) continue;
        const aspectInfo = ASPECTS.find((a) => a.name === match.aspect)!;
        const refined = refineExactDay(transiting, nLon, aspectInfo.angle, coarse);
        const hit: YearAheadHit = {
          date: refined.date.toISOString().slice(0, 10),
          transiting,
          aspect: match.aspect,
          natalPoint,
          exactDeg: refined.exactDeg,
        };
        const key = hitKey(hit);
        if (seen.has(key)) continue;
        seen.add(key);
        hits.push(hit);
      }
    }
  }

  return hits
    .sort((a, b) => scoreHit(b) - scoreHit(a) || a.date.localeCompare(b.date))
    .slice(0, 8)
    .sort((a, b) => a.date.localeCompare(b.date));
}

/** Tightest natal aspects (planet pairs + angles), orb ≤ 6°. */
export function tightestNatalAspects(
  lons: LonMap,
  asc: number | null,
  mc: number | null,
  count = 3,
): NatalAspect[] {
  const points: Record<string, number> = { ...lons };
  if (asc != null) points.asc = asc;
  if (mc != null) points.mc = mc;

  const keys = Object.keys(points);
  const found: NatalAspect[] = [];

  for (let i = 0; i < keys.length; i++) {
    for (let j = i + 1; j < keys.length; j++) {
      const sep = separation(points[keys[i]], points[keys[j]]);
      let best: { aspect: TransitAspect; orb: number } | null = null;
      for (const a of ASPECTS) {
        const orb = Math.abs(sep - a.angle);
        if (orb <= 6 && (!best || orb < best.orb)) {
          best = { aspect: a.name as TransitAspect, orb };
        }
      }
      if (best) {
        found.push({ bodyA: keys[i], bodyB: keys[j], aspect: best.aspect, orb: best.orb });
      }
    }
  }

  return found.sort((a, b) => a.orb - b.orb).slice(0, count);
}
