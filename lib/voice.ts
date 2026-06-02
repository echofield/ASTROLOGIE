// Client helper: ask the Genius (Claude) for a line, fall back to the templated
// voice on any failure, and cache the result per (star · phase · day) so the
// line is stable and cheap — it doesn't reshuffle on every render.

import type { SealedStar, Reach } from "./star";
import type { Archetype, Phase } from "./archetypes";

export async function fetchGeniusLine(
  star: SealedStar,
  archetype: Archetype,
  phase: Phase,
  reach: Reach,
  fallback: string,
): Promise<string> {
  const day = new Date().toISOString().slice(0, 10);
  const cacheKey = `astrolabe.voice:${star.name}:${phase}:${day}`;

  try {
    const cached = window.localStorage.getItem(cacheKey);
    if (cached) return cached;
  } catch {}

  try {
    const res = await fetch("/api/genius", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        star: { name: star.name, must: star.must },
        archetype: { name: archetype.name, essence: archetype.essence },
        phase,
        reach: { gap: reach.gap, days: reach.days },
      }),
    });
    const data: { line?: string | null } = await res.json();
    if (data?.line) {
      try { window.localStorage.setItem(cacheKey, data.line); } catch {}
      return data.line;
    }
  } catch {}

  return fallback; // dormant key / offline / error → the templated voice
}
