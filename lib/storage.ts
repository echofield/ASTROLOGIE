// Data layer — localStorage for v1, behind a narrow interface so it can move to
// Supabase / a SYMIONE sealing layer later. Synchronous, client-only.

import type { NatalChart } from "./types";
import type { SealedStar } from "./star";

export interface Profile {
  birthISO: string;
  place: string;
  natal: NatalChart;
  createdAt: string;
}

const KEY = {
  profile: "astrolabe.profile",
  star: "astrolabe.star",
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

export function getProfile(): Profile | null {
  return read<Profile | null>(KEY.profile, null);
}
export function saveProfile(p: Profile): void {
  write(KEY.profile, p);
}

export function getStar(): SealedStar | null {
  return read<SealedStar | null>(KEY.star, null);
}
export function saveStar(s: SealedStar): void {
  write(KEY.star, s);
}

export function resetAll(): void {
  if (typeof window === "undefined") return;
  for (const k of Object.values(KEY)) window.localStorage.removeItem(k);
}
