// A lightweight in-memory rate limiter to keep the public LLM routes from
// burning credits. Fixed window, keyed per client. Good enough to stop naive
// hammering on a small app. NOTE: serverless instances each hold their own map,
// so the cap is per-instance, not global — for hard global limits, swap this
// for Upstash/Redis or a Supabase counter. Same interface, no caller changes.

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
