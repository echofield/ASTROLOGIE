// Cloud persistence — local-first, dormant until configured.
//
// localStorage stays the source of truth for the UI (instant, offline). If
// NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY are set, we also
// back the sealed star + profile up to Supabase under an anonymous identity, so
// it survives a cache clear and can travel to another device. Every call is
// guarded: any failure (no env, offline, RLS) silently leaves you local-only.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Profile } from "./storage";
import type { SealedStar } from "./star";

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
}

/** Restore from the cloud, or null if unconfigured / empty / failed. */
export async function pull(): Promise<CloudState | null> {
  const c = getClient();
  if (!c) return null;
  try {
    const uid = await userId();
    if (!uid) return null;
    const [{ data: prof }, { data: st }] = await Promise.all([
      c.from("astrolabe_profiles").select("birth_iso, place, natal, created_at").eq("user_id", uid).maybeSingle(),
      c.from("astrolabe_stars").select("star").eq("user_id", uid).maybeSingle(),
    ]);
    const profile: Profile | null = prof
      ? { birthISO: prof.birth_iso, place: prof.place ?? "", natal: prof.natal, createdAt: prof.created_at }
      : null;
    const star = (st?.star as SealedStar) ?? null;
    if (!profile && !star) return null;
    return { profile, star };
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
        user_id: uid, birth_iso: profile.birthISO, place: profile.place,
        natal: profile.natal, created_at: profile.createdAt,
      });
    }
    if (star) {
      await c.from("astrolabe_stars").upsert({ user_id: uid, star, updated_at: new Date().toISOString() });
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
      c.from("astrolabe_stars").delete().eq("user_id", uid),
      c.from("astrolabe_profiles").delete().eq("user_id", uid),
    ]);
  } catch {
    /* ignore */
  }
}
