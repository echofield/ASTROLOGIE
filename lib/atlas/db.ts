// The missing piece: a client-side Supabase handle with an anonymous session,
// so localStorage-first state can mirror to the cloud under RLS. Degrades to
// null when env is absent or anonymous sign-ins are disabled — callers then
// stay localStorage-only. (This is also the GO-LIVE "enable anonymous sign-ins".)
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null | undefined;
function client(): SupabaseClient | null {
  if (_client !== undefined) return _client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  _client = url && key && typeof window !== "undefined"
    ? createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true } })
    : null;
  return _client;
}

export function getDb(): SupabaseClient | null { return client(); }

let _user: Promise<string | null> | null = null;
/** Returns the current user id (anonymous session), creating one if needed; null if unavailable. */
export function ensureUser(): Promise<string | null> {
  if (_user) return _user;
  _user = (async () => {
    const c = client(); if (!c) return null;
    try {
      const { data: { session } } = await c.auth.getSession();
      if (session?.user) return session.user.id;
      const { data, error } = await c.auth.signInAnonymously();
      if (error || !data.user) return null;
      return data.user.id;
    } catch { return null; }
  })();
  return _user;
}
