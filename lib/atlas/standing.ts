// The Standing — one year, spine + accumulation. localStorage-first, spine
// mirrored to astrolabe_standing. The monthly reading is /api/read span:"month"
// fed the spine's chapter AND the Day's Record since last — prophecy that listens.
import { ensureUser, getDb } from "./db";
import { logAura } from "./aura";
import { entriesSince, type RecordEntry } from "./records";

const SKEY = "astrolab.standing";
const RKEY = "astrolab.standing.readings";

export interface SpineChapter { month: number; title: string; shape: string; }
export interface Spine { arc: string; chapters: SpineChapter[]; }
export interface Standing { questions: string[]; spine: Spine; started_at: string; expires_at: string; status: string; }
export interface MonthlyReading { period: number; chapter: string; thread: string; counsel: string; created_at: string; }

function getJSON<T>(k: string, fb: T): T { if (typeof window === "undefined") return fb; try { return JSON.parse(localStorage.getItem(k) || "null") ?? fb; } catch { return fb; } }
function setJSON(k: string, v: unknown) { if (typeof window !== "undefined") localStorage.setItem(k, JSON.stringify(v)); }

export function getStanding(): Standing | null { return getJSON<Standing | null>(SKEY, null); }
export function isActive(): boolean { const s = getStanding(); return !!s && s.status === "active" && new Date(s.expires_at) > new Date(); }
export function getReadings(): MonthlyReading[] { return getJSON<MonthlyReading[]>(RKEY, []); }

/** months elapsed since the year began, clamped to a 0–11 chapter index */
export function currentChapterIndex(): number {
  const s = getStanding(); if (!s) return 0;
  const start = new Date(s.started_at), now = new Date();
  const m = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
  return Math.max(0, Math.min(11, m));
}

/** Seal the year: compose the spine from chart + sealed questions, store it. Dormant-aware (null if the engine isn't keyed). */
export async function sealYear(questions: string[], chartContext: Record<string, unknown>): Promise<Standing | null> {
  let spine: Spine | null = null;
  try {
    const res = await fetch("/api/read", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ span: "spine", context: { ...chartContext, questions } }) });
    const data = await res.json();
    if (Array.isArray(data?.chapters) && data.chapters.length) spine = { arc: data.arc ?? "", chapters: data.chapters };
  } catch { /* dormant or offline */ }
  if (!spine) return null; // engine not live yet — caller keeps the user in the seal state

  const now = new Date(); const exp = new Date(now); exp.setFullYear(exp.getFullYear() + 1);
  const s: Standing = { questions, spine, started_at: now.toISOString(), expires_at: exp.toISOString(), status: "active" };
  setJSON(SKEY, s);
  logAura("standing_sealed", { questions: questions.length });
  try {
    const uid = await ensureUser(); const c = getDb();
    if (uid && c) await c.from("astrolabe_standing").upsert({ user_id: uid, started_at: s.started_at, expires_at: s.expires_at, questions: s.questions, spine: s.spine, status: s.status });
  } catch { /* localStorage holds it */ }
  return s;
}

/** This month's chapter: on the spine, bent to the lived month (Record + aura since last). Dormant-aware. */
export async function monthlyReading(chartContext: Record<string, unknown>): Promise<MonthlyReading | null> {
  const s = getStanding(); if (!s) return null;
  const idx = currentChapterIndex();
  const chapter = s.spine.chapters[idx];
  const readings = getReadings();
  const lastISO = readings[readings.length - 1]?.created_at ?? s.started_at;
  const records: RecordEntry[] = entriesSince(lastISO);
  try {
    const res = await fetch("/api/read", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ span: "month", context: {
      ...chartContext, arc: s.spine.arc, chapter, questions: s.questions,
      records: records.map((r) => ({ when: r.created_at, body: r.body })),
      priorChapters: readings.map((r) => ({ period: r.period, counsel: r.counsel })),
    } }) });
    const data = await res.json();
    if (!data?.chapter) return null;
    const mr: MonthlyReading = { period: idx + 1, chapter: data.chapter, thread: data.thread ?? "", counsel: data.counsel ?? "", created_at: new Date().toISOString() };
    setJSON(RKEY, [...readings, mr]);
    logAura("monthly_reading", { period: mr.period, records: records.length });
    return mr;
  } catch { return null; }
}
