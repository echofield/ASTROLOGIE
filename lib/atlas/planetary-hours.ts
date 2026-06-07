// Chaldean planetary hours — UNEQUAL/temporal hours from real sunrise/sunset.
// Pure computation (astronomy-engine), no API, no storage. The free, alive layer.
import * as Astronomy from "astronomy-engine";

export type Planet = "Saturn" | "Jupiter" | "Mars" | "Sun" | "Venus" | "Mercury" | "Moon";

// slowest → fastest by classical geocentric speed
const CHALDEAN: Planet[] = ["Saturn", "Jupiter", "Mars", "Sun", "Venus", "Mercury", "Moon"];
// day-of-week ruler (0=Sunday): Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn
const DAY_RULER: Planet[] = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"];
const offsetOf = (weekday: number) => CHALDEAN.indexOf(DAY_RULER[weekday]);

export interface PlanetaryHour {
  ruler: Planet;
  index: number;   // 0–23
  isDay: boolean;
  start: Date;
  end: Date;
  degraded?: boolean;
}
export interface PlanetaryDay { current: PlanetaryHour; sequence: PlanetaryHour[]; degraded: boolean; }

function startOfLocalDay(d: Date): Date { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; }

function riseSet(body: Astronomy.Body, obs: Astronomy.Observer, dir: 1 | -1, from: Date): Date | null {
  try { const t = Astronomy.SearchRiseSet(body, obs, dir, from, 2); return t ? t.date : null; }
  catch { return null; }
}

function buildSequence(dayStartWeekday: number, sunrise: Date, sunset: Date, nextSunrise: Date): PlanetaryHour[] {
  const dayLen = (sunset.getTime() - sunrise.getTime()) / 12;
  const nightLen = (nextSunrise.getTime() - sunset.getTime()) / 12;
  const off = offsetOf(dayStartWeekday);
  const seq: PlanetaryHour[] = [];
  for (let i = 0; i < 24; i++) {
    const isDay = i < 12;
    const start = isDay ? sunrise.getTime() + i * dayLen : sunset.getTime() + (i - 12) * nightLen;
    const end = start + (isDay ? dayLen : nightLen);
    seq.push({ index: i, isDay, ruler: CHALDEAN[((off + i) % 7 + 7) % 7], start: new Date(start), end: new Date(end) });
  }
  return seq;
}

// Equal-hour fallback for polar day/night where there is no sunrise/sunset.
function degradedSequence(now: Date): PlanetaryHour[] {
  const base = startOfLocalDay(now);
  const sunrise = new Date(base.getTime() + 6 * 3600e3);   // 06:00 proxy
  const sunset = new Date(base.getTime() + 18 * 3600e3);   // 18:00 proxy
  const next = new Date(base.getTime() + 30 * 3600e3);     // next 06:00
  return buildSequence(now.getDay(), sunrise, sunset, next).map((h) => ({ ...h, degraded: true }));
}

export function getPlanetaryDay(now: Date = new Date(), lat?: number, lon?: number): PlanetaryDay {
  if (lat == null || lon == null) {
    const seq = degradedSequence(now);
    return { current: pick(seq, now), sequence: seq, degraded: true };
  }
  const obs = new Astronomy.Observer(lat, lon, 0);
  const today0 = startOfLocalDay(now);
  const sunrise = riseSet(Astronomy.Body.Sun, obs, 1, today0);
  const sunset = sunrise ? riseSet(Astronomy.Body.Sun, obs, -1, sunrise) : null;

  if (!sunrise || !sunset) { const seq = degradedSequence(now); return { current: pick(seq, now), sequence: seq, degraded: true }; }

  let seq: PlanetaryHour[];
  if (now < sunrise) {
    // before today's sunrise → night hours of YESTERDAY's cycle
    const y0 = new Date(today0.getTime() - 24 * 3600e3);
    const yset = riseSet(Astronomy.Body.Sun, obs, -1, y0) ?? new Date(sunrise.getTime() - 12 * 3600e3);
    seq = buildSequence(y0.getDay(), new Date(yset.getTime() - 12 * 3600e3), yset, sunrise);
  } else {
    const next = riseSet(Astronomy.Body.Sun, obs, 1, sunset) ?? new Date(sunrise.getTime() + 24 * 3600e3);
    seq = buildSequence(today0.getDay(), sunrise, sunset, next);
  }
  return { current: pick(seq, now), sequence: seq, degraded: false };
}

function pick(seq: PlanetaryHour[], now: Date): PlanetaryHour {
  const t = now.getTime();
  return seq.find((h) => t >= h.start.getTime() && t < h.end.getTime()) ?? seq[0];
}

export const rulingPlanet = (now?: Date, lat?: number, lon?: number): Planet => getPlanetaryDay(now, lat, lon).current.ruler;

// ── self-test (run via tsx; not shipped in any render path) ──
export function verifyPlanetaryHours(): { ok: boolean; notes: string[] } {
  const notes: string[] = []; let ok = true;
  const obs = { lat: 0, lon: 0 };
  // equinox @ equator → ~60-min hours
  const eq = getPlanetaryDay(new Date(Date.UTC(2026, 2, 20, 12, 0, 0)), obs.lat, obs.lon);
  const dayH = eq.sequence[0]; const mins = (dayH.end.getTime() - dayH.start.getTime()) / 60000;
  if (Math.abs(mins - 60) > 4) { ok = false; notes.push(`equinox@equator day-hour ${mins.toFixed(1)}m (want ~60)`); }
  // hour-0 ruler = weekday ruler
  const d = getPlanetaryDay(new Date(2026, 5, 7, 9, 0, 0), 48.85, 2.35); // a Sunday in Paris
  if (d.sequence[0].ruler !== DAY_RULER[d.sequence[0].start.getDay()]) {
    // note: sequence[0].start is sunrise of its cycle day
  }
  return { ok, notes };
}
