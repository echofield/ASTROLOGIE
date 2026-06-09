// A lightweight in-memory rate limiter to keep the public LLM routes from
// burning credits. Fixed window, keyed per client. Good enough to stop naive
// hammering on a small app. NOTE: serverless instances each hold their own map,
// so the cap is per-instance, not global — for hard global limits, swap this
// for Upstash/Redis or a Supabase counter. Same interface, no caller changes.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

interface Entry {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Entry>();

export interface LimitResult {
  ok: boolean;
  retryAfter: number; // seconds
}

export function rateLimit(key: string, max: number, windowMs: number): LimitResult {
  const now = Date.now();

  // opportunistic prune so the map can't grow unbounded
  if (buckets.size > 5000) {
    for (const [k, e] of buckets) if (now >= e.resetAt) buckets.delete(k);
  }

  const e = buckets.get(key);
  if (!e || now >= e.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }
  if (e.count >= max) {
    return { ok: false, retryAfter: Math.ceil((e.resetAt - now) / 1000) };
  }
  e.count++;
  return { ok: true, retryAfter: 0 };
}

/** Best-effort client identity from proxy headers (Vercel sets x-forwarded-for). */
export function clientKey(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

let svcClient: SupabaseClient | null | undefined;
function svc(): SupabaseClient | null {
  if (svcClient !== undefined) return svcClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  svcClient = url && key ? createClient(url, key) : null;
  return svcClient;
}

// Durable, cross-instance fixed-window limiter backed by the astrolabe_rate_take RPC — the cap
// holds across serverless instances and cold starts. Falls back to the in-memory limiter when
// Supabase isn't configured (local dev) or on any DB error, so a real user is never hard-blocked
// by infrastructure; there is always *a* cap in force.
export async function durableLimit(key: string, max: number, windowMs: number): Promise<LimitResult> {
  const client = svc();
  if (!client) return rateLimit(key, max, windowMs);
  try {
    const { data, error } = await client.rpc("astrolabe_rate_take", {
      p_key: key,
      p_max: max,
      p_window_seconds: Math.ceil(windowMs / 1000),
    });
    if (error) return rateLimit(key, max, windowMs);
    const row = Array.isArray(data) ? data[0] : data;
    if (row && typeof row.allowed === "boolean") {
      return { ok: row.allowed, retryAfter: typeof row.retry_after === "number" ? row.retry_after : 0 };
    }
    return rateLimit(key, max, windowMs);
  } catch {
    return rateLimit(key, max, windowMs);
  }
}
