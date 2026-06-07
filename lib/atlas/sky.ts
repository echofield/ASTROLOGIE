// The live sky — Moon sign/phase, retrogrades, the ruling planet. Pure, free,
// computed from the ephemeris. Drives the homepage's resting Moment Plate.
import { lonOf, signIndex, norm, SIGN_NAMES } from "@/lib/sky";
import { getPlanetaryDay, type Planet } from "./planetary-hours";

const DAY = 24 * 3600e3;

export function moonSign(date = new Date()): string {
  return SIGN_NAMES[signIndex(lonOf("Moon", date))];
}

export function moonPhase(date = new Date()): { name: string; waxing: boolean; illum: number } {
  const sun = lonOf("Sun", date), moon = lonOf("Moon", date);
  const e = norm(moon - sun); // 0 new → 180 full → 360 new
  const illum = (1 - Math.cos((e * Math.PI) / 180)) / 2;
  const waxing = e < 180;
  let name = "Waxing Crescent";
  if (e < 12 || e > 348) name = "New";
  else if (e < 78) name = "Waxing Crescent";
  else if (e < 102) name = "First Quarter";
  else if (e < 168) name = "Waxing Gibbous";
  else if (e < 192) name = "Full";
  else if (e < 258) name = "Waning Gibbous";
  else if (e < 282) name = "Last Quarter";
  else name = "Waning Crescent";
  return { name, waxing, illum };
}

const RETRO_BODIES = ["Mercury", "Venus", "Mars", "Jupiter", "Saturn"] as const;

export function retrogrades(date = new Date()): string[] {
  const out: string[] = [];
  for (const p of RETRO_BODIES) {
    const a = lonOf(p, date), b = lonOf(p, new Date(date.getTime() + DAY));
    let d = b - a; if (d > 180) d -= 360; if (d < -180) d += 360;
    if (d < 0) out.push(p);
  }
  return out;
}

export interface MomentPlate {
  ruler: Planet;
  hourIndex: number;
  isDay: boolean;
  degraded: boolean;
  moonSign: string;
  moonPhase: string;
  waxing: boolean;
  retrogrades: string[];
}

export function getMomentPlate(date = new Date(), lat?: number, lon?: number): MomentPlate {
  const day = getPlanetaryDay(date, lat, lon);
  const mp = moonPhase(date);
  return {
    ruler: day.current.ruler,
    hourIndex: day.current.index,
    isDay: day.current.isDay,
    degraded: day.degraded,
    moonSign: moonSign(date),
    moonPhase: mp.name,
    waxing: mp.waxing,
    retrogrades: retrogrades(date),
  };
}

// glyphs for the plate (Noto Sans Symbols 2 covers these)
export const PLANET_GLYPH: Record<Planet, string> = {
  Saturn: "♄", Jupiter: "♃", Mars: "♂", Sun: "☉", Venus: "♀", Mercury: "☿", Moon: "☾",
};
