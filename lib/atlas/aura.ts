// The aura log — append-only behavioral data, AUTH-INDEPENDENT. Events queue to
// localStorage the instant they happen (even logged-out/anonymous) and flush to
// Supabase whenever a session exists. The aura is computed later (stub below);
// the point now is to never lose the history. (Mars's "cheap moat insurance".)
import { ensureUser, getDb } from "./db";

const QKEY = "astrolab.aura.queue";
type Ev = { kind: string; payload: Record<string, unknown>; created_at: string };

function queue(): Ev[] { if (typeof window === "undefined") return []; try { return JSON.parse(localStorage.getItem(QKEY) || "[]"); } catch { return []; } }
function setQueue(q: Ev[]) { if (typeof window !== "undefined") localStorage.setItem(QKEY, JSON.stringify(q.slice(-500))); }

/** Record an event immediately (local), then best-effort flush. Never throws, never gated on auth. */
export function logAura(kind: string, payload: Record<string, unknown> = {}): void {
  if (typeof window === "undefined") return;
  setQueue([...queue(), { kind, payload, created_at: new Date().toISOString() }]);
  void flushAura();
}

let flushing = false;
export async function flushAura(): Promise<void> {
  if (typeof window === "undefined" || flushing) return;
  const q = queue(); if (!q.length) return;
  flushing = true;
  try {
    const uid = await ensureUser(); const c = getDb();
    if (uid && c) {
      const rows = q.map((e) => ({ user_id: uid, kind: e.kind, payload: e.payload, created_at: e.created_at }));
      const { error } = await c.from("astrolabe_aura_events").insert(rows);
      if (!error) setQueue([]); // flushed; failures stay queued for next time
    }
  } catch { /* keep queued */ } finally { flushing = false; }
}

// computed later from the accumulated events — stubbed now (the seam, not the engine)
export interface AuraStub { events: number; }
export function computeAura(events: { kind: string }[] = []): AuraStub { return { events: events.length }; }
