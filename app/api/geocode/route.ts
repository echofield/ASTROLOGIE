import { NextResponse } from "next/server";
import { lookupCity } from "@/lib/cities";
import { rateLimit, clientKey } from "@/lib/ratelimit";

export const runtime = "nodejs";

const CACHE = new Map<string, { lat: number; lon: number; label: string; at: number }>();
const TTL_MS = 24 * 60 * 60 * 1000; // 24h — repeat birth cities never re-hit Nominatim

// Serialize outbound Nominatim calls to <=1/s (their usage policy) so the production IP is never
// flagged or banned — which would break house calculations for everyone. Per-instance; the
// bundled-cities and cache layers keep real traffic far below this rate to begin with.
let lastNominatimAt = 0;
let nominatimGate: Promise<unknown> = Promise.resolve();
function throttledNominatim(url: string, init: RequestInit): Promise<Response> {
  const run = nominatimGate.then(async () => {
    const wait = 1000 - (Date.now() - lastNominatimAt);
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    lastNominatimAt = Date.now();
    return fetch(url, init);
  });
  nominatimGate = run.then(() => {}, () => {}); // next call waits behind this one's spacing
  return run;
}

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim();
  if (!q) return NextResponse.json({ error: "missing query" }, { status: 400 });

  // 1) bundled common cities — instant, never depends on a third party
  const bundled = lookupCity(q);
  if (bundled) return NextResponse.json({ lat: bundled.lat, lon: bundled.lon, label: bundled.label });

  // 2) in-memory cache (city string → coords, 24h)
  const key = q.toLowerCase();
  const hit = CACHE.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) {
    return NextResponse.json({ lat: hit.lat, lon: hit.lon, label: hit.label });
  }

  // cap the public endpoint per IP so a flood of distinct misses can't tie up the Nominatim gate
  const rl = rateLimit(`geocode:${clientKey(req)}`, 20, 60_000);
  if (!rl.ok) return NextResponse.json({ error: "rate_limited" }, { status: 429, headers: { "retry-after": String(rl.retryAfter) } });

  // 3) Nominatim — throttled to <=1/s, with Next's data cache as a cross-instance layer
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`;
    const res = await throttledNominatim(url, {
      headers: { "User-Agent": "the-astrolab/1.0 (contact: contact@symi.io)" },
      next: { revalidate: 86400 },
    });
    if (!res.ok) return NextResponse.json({ error: "geocode failed" }, { status: 502 });

    const data = (await res.json()) as { lat: string; lon: string; display_name: string }[];
    if (!data.length) return NextResponse.json({ error: "not found" }, { status: 404 });

    const row = data[0];
    const lat = parseFloat(row.lat);
    const lon = parseFloat(row.lon);
    const label = row.display_name;
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return NextResponse.json({ error: "invalid coordinates" }, { status: 502 });
    }

    CACHE.set(key, { lat, lon, label, at: Date.now() });
    return NextResponse.json({ lat, lon, label });
  } catch {
    return NextResponse.json({ error: "geocode failed" }, { status: 500 });
  }
}
