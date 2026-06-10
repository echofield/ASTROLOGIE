"use client";

// The living sky, in one hook — everything THE SKY TONIGHT panel, the wheel
// medallion, the horizon glow and the panel↔wheel binding need, computed from
// the real ephemeris on a shared minute clock. Client-only by design: the date
// and the hour are the visitor's, never the build's.
import { useEffect, useMemo, useState } from "react";
import { lonOf } from "@/lib/sky";
import { getPlanetaryDay, type PlanetaryHour } from "./planetary-hours";
import { signsAboveHorizon } from "./horizon";
import { useSkyNow } from "./use-sky-now";

export interface Geo { lat: number; lon: number; fallback: boolean }
const GEO_KEY = "alab-geo-v1";
const PARIS: Geo = { lat: 48.8566, lon: 2.3522, fallback: true };

/** Coarse observer position — Vercel IP headers via /api/geo, day-cached, Paris fallback. */
export function useGeo(): Geo | null {
  const [geo, setGeo] = useState<Geo | null>(null);
  useEffect(() => {
    try {
      const c = localStorage.getItem(GEO_KEY);
      if (c) {
        const { t, g } = JSON.parse(c);
        if (Date.now() - t < 86400e3 && Number.isFinite(g?.lat)) { setGeo(g); return; }
      }
    } catch { /* fall through to fetch */ }
    fetch("/api/geo")
      .then((r) => r.json())
      .then((g: Geo) => {
        setGeo(g);
        try { localStorage.setItem(GEO_KEY, JSON.stringify({ t: Date.now(), g })); } catch { /* private mode */ }
      })
      .catch(() => setGeo(PARIS));
  }, []);
  return geo;
}

const norm = (x: number) => ((x % 360) + 360) % 360;
const octant = (e: number) =>
  e < 11.25 || e >= 348.75 ? 0 : e < 78.75 ? 1 : e < 101.25 ? 2 : e < 168.75 ? 3 : e < 191.25 ? 4 : e < 258.75 ? 5 : e < 281.25 ? 6 : 7;

export interface SkyTonightData {
  now: Date;
  geo: Geo | null;
  moon: { lon: number; signIdx: number; degInSign: number; phaseIdx: number; waxing: boolean; illum: number };
  sun: { lon: number; signIdx: number; degInSign: number };
  hour: PlanetaryHour;
  hourDegraded: boolean;
  horizon: boolean[] | null;
}

export function useSkyTonight(): SkyTonightData {
  const { now } = useSkyNow(30_000);
  const geo = useGeo();
  return useMemo(() => {
    const moonLon = lonOf("Moon", now);
    const sunLon = lonOf("Sun", now);
    const e = norm(moonLon - sunLon);
    const day = getPlanetaryDay(now, geo?.lat, geo?.lon);
    return {
      now,
      geo,
      moon: {
        lon: moonLon,
        signIdx: Math.floor(moonLon / 30) % 12,
        degInSign: moonLon % 30,
        phaseIdx: octant(e),
        waxing: e < 180,
        illum: (1 - Math.cos((e * Math.PI) / 180)) / 2,
      },
      sun: { lon: sunLon, signIdx: Math.floor(sunLon / 30) % 12, degInSign: sunLon % 30 },
      hour: day.current,
      hourDegraded: day.degraded,
      horizon: geo ? signsAboveHorizon(now, geo.lat, geo.lon) : null,
    };
  }, [now, geo]);
}

/** "New" | "Full" | "Waxing" | "Waning" — the statement's first word. */
export function phaseWord(phaseIdx: number, waxing: boolean): string {
  if (phaseIdx === 0) return "New";
  if (phaseIdx === 4) return "Full";
  return waxing ? "Waxing" : "Waning";
}
