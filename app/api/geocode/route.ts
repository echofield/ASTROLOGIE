import { NextResponse } from "next/server";
import { lookupCity } from "@/lib/cities";

export const runtime = "nodejs";

const CACHE = new Map<string, { lat: number; lon: number; label: string; at: number }>();
const TTL_MS = 60 * 60 * 1000;

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim();
  if (!q) return NextResponse.json({ error: "missing query" }, { status: 400 });

  // 1) bundled common cities — instant, never depends on a third party
  const bundled = lookupCity(q);
  if (bundled) return NextResponse.json({ lat: bundled.lat, lon: bundled.lon, label: bundled.label });

  const key = q.toLowerCase();
  const hit = CACHE.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) {
    return NextResponse.json({ lat: hit.lat, lon: hit.lon, label: hit.label });
  }

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "the-astrolab/1.0 (contact: hello@the-astrolab.app)" },
      next: { revalidate: 3600 },
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
