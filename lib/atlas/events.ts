// The proof-ledger writer — append-only lifecycle events, AUTH-INDEPENDENT.
// Events queue to localStorage the instant they happen and flush to Supabase
// (astrolabe_events) whenever a session exists. Modeled on lib/atlas/aura.ts.
// The judge runs server-side (authoritative); the trail is written here, under
// the user's own anon session, so RLS stays clean (same shape as aura_events).
import { ensureUser, getDb } from "./db";

const QKEY = "astrolab.events.queue";
export type SubjectType = "star" | "read" | "standing" | "month";
export interface LedgerEvent {
  subject_type: SubjectType;
  subject_id: string;
  event_type: string;
  payload: Record<string, unknown>;
  idempotency_key?: string | null;
  created_at: string;
}

function queue(): LedgerEvent[] { if (typeof window === "undefined") return []; try { return JSON.parse(localStorage.getItem(QKEY) || "[]"); } catch { return []; } }
function setQueue(q: LedgerEvent[]) { if (typeof window !== "undefined") localStorage.setItem(QKEY, JSON.stringify(q.slice(-500))); }

/** Record a ledger event immediately (local), then best-effort flush. Never throws, never gated on auth. */
export function logEvent(
  subject_type: SubjectType,
  subject_id: string,
  event_type: string,
  payload: Record<string, unknown> = {},
  idempotency_key?: string | null,
): void {
  if (typeof window === "undefined") return;
  setQueue([...queue(), { subject_type, subject_id, event_type, payload, idempotency_key: idempotency_key ?? null, created_at: new Date().toISOString() }]);
  void flushEvents();
}

let flushing = false;
export async function flushEvents(): Promise<void> {
  if (typeof window === "undefined" || flushing) return;
  const q = queue(); if (!q.length) return;
  flushing = true;
  try {
    const uid = await ensureUser(); const c = getDb();
    if (uid && c) {
      const rows = q.map((e) => ({
        user_id: uid, subject_type: e.subject_type, subject_id: e.subject_id,
        event_type: e.event_type, payload: e.payload, idempotency_key: e.idempotency_key ?? null, created_at: e.created_at,
      }));
      // idempotent: collisions on (user_id, idempotency_key) are ignored; NULL keys insert freely
      const { error } = await c.from("astrolabe_events").upsert(rows, { onConflict: "user_id,idempotency_key", ignoreDuplicates: true });
      if (!error) setQueue([]); // flushed; failures stay queued for next time
    }
  } catch { /* keep queued */ } finally { flushing = false; }
}

/** The ledger trail for one subject (cloud if available, else the unflushed local queue), oldest first. */
export async function eventsFor(subject_type: SubjectType, subject_id: string): Promise<LedgerEvent[]> {
  try {
    const uid = await ensureUser(); const c = getDb();
    if (uid && c) {
      const { data } = await c.from("astrolabe_events")
        .select("subject_type, subject_id, event_type, payload, idempotency_key, created_at")
        .eq("user_id", uid).eq("subject_type", subject_type).eq("subject_id", subject_id)
        .order("created_at", { ascending: true });
      if (data) return data as LedgerEvent[];
    }
  } catch { /* fall through to local */ }
  return queue().filter((e) => e.subject_type === subject_type && e.subject_id === subject_id);
}
