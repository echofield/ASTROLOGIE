// The Day's Record — the writable memory substrate of The Standing, and the
// thread that makes a monthly reading bend to the lived month instead of just
// unspooling the spine. localStorage source-of-truth, Supabase mirror, aura-logged.
// Captured from day one, before the Standing is purchasable.
import { ensureUser, getDb } from "./db";
import { logAura } from "./aura";

const LKEY = "astrolab.records";
export interface RecordEntry { id: string; body: string; created_at: string; }

function local(): RecordEntry[] { if (typeof window === "undefined") return []; try { return JSON.parse(localStorage.getItem(LKEY) || "[]"); } catch { return []; } }
function setLocal(rows: RecordEntry[]) { if (typeof window !== "undefined") localStorage.setItem(LKEY, JSON.stringify(rows)); }
const byNewest = (a: RecordEntry, b: RecordEntry) => b.created_at.localeCompare(a.created_at);
const uuid = () => (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`);

export function getEntries(): RecordEntry[] { return [...local()].sort(byNewest); }
export function entriesSince(iso: string): RecordEntry[] { return getEntries().filter((e) => e.created_at > iso); }

/** Add a short entry — local first, then mirror + aura. Returns the updated list (newest first). */
export async function addEntry(body: string): Promise<RecordEntry[]> {
  const text = body.trim(); if (!text) return getEntries();
  const e: RecordEntry = { id: uuid(), body: text, created_at: new Date().toISOString() };
  setLocal([...local(), e]);
  logAura("record_entry", { len: text.length });
  try {
    const uid = await ensureUser(); const c = getDb();
    if (uid && c) await c.from("astrolabe_records").insert({ id: e.id, user_id: uid, body: e.body, created_at: e.created_at });
  } catch { /* localStorage holds it; sync reconciles */ }
  return getEntries();
}

/** Merge cloud↔local by id, push any local-only rows. Returns the merged list (newest first). */
export async function syncRecords(): Promise<RecordEntry[]> {
  try {
    const uid = await ensureUser(); const c = getDb();
    if (uid && c) {
      const { data } = await c.from("astrolabe_records").select("id, body, created_at");
      const remote = new Map((data ?? []).map((r: RecordEntry) => [r.id, r]));
      const merged = new Map<string, RecordEntry>();
      for (const r of [...remote.values(), ...local()]) merged.set(r.id, r);
      setLocal([...merged.values()]);
      const toPush = local().filter((r) => !remote.has(r.id));
      if (toPush.length) await c.from("astrolabe_records").insert(toPush.map((r) => ({ id: r.id, user_id: uid, body: r.body, created_at: r.created_at })));
    }
  } catch { /* offline → local stands */ }
  return getEntries();
}
