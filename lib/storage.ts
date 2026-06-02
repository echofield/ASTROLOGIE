// Data layer. localStorage-backed for v1, behind a narrow interface so it can
// be swapped for Supabase (or Cloud Run + a thin Claude API layer) later without
// touching the UI. Everything here is intentionally synchronous + client-only.

import type { NorthStar, Passage, Profile } from "./types";

const KEY = {
  profile: "lodestar.profile",
  stars: "lodestar.northStars",
  passages: "lodestar.passages",
} as const;

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// ---- profile ----------------------------------------------------------------

export function getProfile(): Profile | null {
  return read<Profile | null>(KEY.profile, null);
}
export function saveProfile(p: Profile): void {
  write(KEY.profile, p);
}

// ---- north stars ------------------------------------------------------------

export function getNorthStars(): NorthStar[] {
  return read<NorthStar[]>(KEY.stars, []);
}
export function getActiveNorthStar(): NorthStar | null {
  return getNorthStars().find((s) => s.active) ?? null;
}
export function saveNorthStar(star: NorthStar): void {
  const all = getNorthStars();
  const i = all.findIndex((s) => s.id === star.id);
  if (i >= 0) all[i] = star;
  else all.push(star);
  write(KEY.stars, all);
}
export function setActiveNorthStar(id: string): void {
  const all = getNorthStars().map((s) => ({ ...s, active: s.id === id }));
  write(KEY.stars, all);
}

// ---- passages ---------------------------------------------------------------

export function getPassages(): Passage[] {
  return read<Passage[]>(KEY.passages, []).sort(
    (a, b) => +new Date(a.sealedAt) - +new Date(b.sealedAt),
  );
}
export function addPassage(p: Passage): void {
  const all = getPassages();
  all.push(p);
  write(KEY.passages, all);
}

export function resetAll(): void {
  if (typeof window === "undefined") return;
  for (const k of Object.values(KEY)) window.localStorage.removeItem(k);
}

export function hasProfile(): boolean {
  return getProfile() !== null;
}
