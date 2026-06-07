// Discovery state — localStorage source-of-truth, Supabase mirror under RLS.
// Codex/progress are derived here (queries), never stored as tables.
import { ensureUser, getDb } from "./db";
import { logAura } from "./aura";

const LKEY = "astrolab.discoveries"; // artifact_ids found on this device

function local(): string[] { if (typeof window === "undefined") return []; try { return JSON.parse(localStorage.getItem(LKEY) || "[]"); } catch { return []; } }
function setLocal(ids: string[]) { if (typeof window !== "undefined") localStorage.setItem(LKEY, JSON.stringify([...new Set(ids)])); }
const territoryOf = (artifactId: string) => artifactId.split(".")[0];

export function getDiscovered(): string[] { return local(); }

/** Mark an artifact found — local first (idempotent), then mirror + log. Returns the updated set. */
export async function discover(territory: string, artifactId: string): Promise<string[]> {
  const ids = local();
  if (!ids.includes(artifactId)) { setLocal([...ids, artifactId]); }
  logAura("artifact_found", { territory, artifact_id: artifactId });
  try {
    const uid = await ensureUser(); const c = getDb();
    if (uid && c) await c.from("astrolabe_discoveries").upsert({ user_id: uid, territory, artifact_id: artifactId }, { onConflict: "user_id,artifact_id" });
  } catch { /* localStorage already holds it */ }
  return local();
}

/** Pull remote rows, merge into local, and push any local-only rows up. Returns the merged set. */
export async function syncDiscoveries(): Promise<string[]> {
  try {
    const uid = await ensureUser(); const c = getDb();
    if (uid && c) {
      const { data } = await c.from("astrolabe_discoveries").select("artifact_id");
      const remote = new Set((data ?? []).map((r: { artifact_id: string }) => r.artifact_id));
      const merged = [...new Set([...local(), ...remote])];
      setLocal(merged);
      const toPush = merged.filter((id) => !remote.has(id));
      if (toPush.length) await c.from("astrolabe_discoveries").upsert(toPush.map((id) => ({ user_id: uid, territory: territoryOf(id), artifact_id: id })), { onConflict: "user_id,artifact_id" });
    }
  } catch { /* offline → local stands */ }
  return local();
}

// derived progress (no codex/progress tables)
export interface CodexEntry { found: number; total: number }
export function codex(territories: { slug: string; relics: { id: string }[] }[]): { byTerritory: Record<string, CodexEntry>; foundTotal: number; total: number } {
  const found = new Set(local());
  const byTerritory: Record<string, CodexEntry> = {};
  let foundTotal = 0, total = 0;
  for (const t of territories) {
    const f = t.relics.filter((r) => found.has(r.id)).length;
    byTerritory[t.slug] = { found: f, total: t.relics.length };
    foundTotal += f; total += t.relics.length;
  }
  return { byTerritory, foundTotal, total };
}
