// Cloud persistence: local-first, dormant until configured.
//
// localStorage stays the source of truth for the UI. If Supabase env vars are
// set, we mirror profile, current star, star ledger, and Genius messages under
// an anonymous user. Every call is guarded so missing env, offline mode, or RLS
// failure leaves the app local-only.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Profile } from "./storage";
import type { SealedStar } from "./star";
import type { ChatMessage } from "./llm/types";

let client: SupabaseClient | null | undefined;

function getClient(): SupabaseClient | null {
  if (client !== undefined) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  client = url && key
    ? createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true } })
    : null;
  return client;
}

export function cloudEnabled(): boolean {
  return getClient() !== null;
}

async function userId(): Promise<string | null> {
  const c = getClient();
  if (!c) return null;
  try {
    const { data } = await c.auth.getSession();
    if (data.session?.user) return data.session.user.id;
    const { data: anon, error } = await c.auth.signInAnonymously();
    if (error) return null;
    return anon.user?.id ?? null;
  } catch {
    return null;
  }
}

export interface CloudState {
  profile: Profile | null;
  star: SealedStar | null;
  ledger: SealedStar[];
}

/** Restore from the cloud, or null if unconfigured / empty / failed. */
export async function pull(): Promise<CloudState | null> {
  const c = getClient();
  if (!c) return null;
  try {
    const uid = await userId();
    if (!uid) return null;
    const [{ data: prof }, { data: st }, { data: ledgerRows }] = await Promise.all([
      c.from("astrolabe_profiles").select("birth_iso, place, natal, created_at").eq("user_id", uid).maybeSingle(),
      c.from("astrolabe_stars").select("star").eq("user_id", uid).maybeSingle(),
      c.from("astrolabe_star_ledger").select("star").eq("user_id", uid).order("sealed_at", { ascending: true }),
    ]);
    const profile: Profile | null = prof
      ? { birthISO: prof.birth_iso, place: prof.place ?? "", natal: prof.natal, createdAt: prof.created_at }
      : null;
    const star = (st?.star as SealedStar) ?? null;
    const ledger = Array.isArray(ledgerRows)
      ? ledgerRows.map((row) => row.star as SealedStar).filter(Boolean)
      : [];
    if (!profile && !star && ledger.length === 0) return null;
    return { profile, star, ledger };
  } catch {
    return null;
  }
}

/** Back up the current state. Fire-and-forget. */
export async function push(profile: Profile | null, star: SealedStar | null): Promise<void> {
  const c = getClient();
  if (!c) return;
  try {
    const uid = await userId();
    if (!uid) return;
    if (profile) {
      await c.from("astrolabe_profiles").upsert({
        user_id: uid,
        birth_iso: profile.birthISO,
        place: profile.place,
        natal: profile.natal,
        created_at: profile.createdAt,
      });
    }
    if (star) {
      await Promise.all([
        c.from("astrolabe_stars").upsert({ user_id: uid, star, updated_at: new Date().toISOString() }),
        c.from("astrolabe_star_ledger").upsert({
          user_id: uid,
          sealed_at: star.sealedAt,
          star,
          updated_at: new Date().toISOString(),
        }),
      ]);
    }
  } catch {
    /* stay local-only */
  }
}

/** Clear the cloud copy (on reset). */
export async function wipe(): Promise<void> {
  const c = getClient();
  if (!c) return;
  try {
    const uid = await userId();
    if (!uid) return;
    await Promise.all([
      c.from("astrolabe_messages").delete().eq("user_id", uid),
      c.from("astrolabe_star_ledger").delete().eq("user_id", uid),
      c.from("astrolabe_stars").delete().eq("user_id", uid),
      c.from("astrolabe_profiles").delete().eq("user_id", uid),
    ]);
  } catch {
    /* ignore */
  }
}

/** Conversation memory. Returns null when unconfigured (caller uses local). */
export async function pullMessages(limit = 100): Promise<ChatMessage[] | null> {
  const c = getClient();
  if (!c) return null;
  try {
    const uid = await userId();
    if (!uid) return null;
    const { data } = await c
      .from("astrolabe_messages")
      .select("role, content, created_at")
      .eq("user_id", uid)
      .order("created_at", { ascending: false })
      .limit(limit);
    return ((data ?? []) as { role: string; content: string; created_at: string }[])
      .reverse()
      .filter((row) => row.role === "user" || row.role === "assistant")
      .map((row) => ({ role: row.role as ChatMessage["role"], content: row.content, createdAt: row.created_at }));
  } catch {
    return null;
  }
}

export async function pushMessage(m: ChatMessage): Promise<void> {
  const c = getClient();
  if (!c) return;
  try {
    const uid = await userId();
    if (!uid) return;
    await c.from("astrolabe_messages").insert({
      user_id: uid,
      role: m.role,
      content: m.content,
      created_at: m.createdAt ?? new Date().toISOString(),
    });
  } catch {
    /* stay local-only */
  }
}
