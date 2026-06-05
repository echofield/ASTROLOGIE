// Local persistence. The UI reads from localStorage first so the instrument is
// instant and works offline; Supabase mirrors the same objects when configured.

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
  starLedger: "astrolabe.starLedger",
  messages: "astrolabe.messages",
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

function sameStar(a: SealedStar, b: SealedStar): boolean {
  return a.sealedAt === b.sealedAt || (a.name === b.name && a.must === b.must);
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

export function getStarLedger(): SealedStar[] {
  return read<SealedStar[]>(KEY.starLedger, []);
}

export function saveStarLedger(stars: SealedStar[]): void {
  write(KEY.starLedger, stars.slice(-50));
}

export function recordStar(star: SealedStar): SealedStar[] {
  const existing = getStarLedger().filter((s) => !sameStar(s, star));
  const next = [...existing, star].sort((a, b) => a.sealedAt.localeCompare(b.sealedAt));
  saveStarLedger(next);
  return next;
}

export function resetAll(): void {
  if (typeof window === "undefined") return;
  for (const k of Object.values(KEY)) window.localStorage.removeItem(k);
}
