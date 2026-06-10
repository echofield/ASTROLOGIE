import { NextResponse } from "next/server";

export const runtime = "nodejs";

// Coarse observer position for the living sky — city-level is plenty for
// planetary hours and the horizon. Vercel provides it per-request from the IP;
// when absent (local dev, privacy proxies) the observatory defaults to Paris.
const PARIS = { lat: 48.8566, lon: 2.3522, fallback: true };

export async function GET(req: Request) {
  const lat = parseFloat(req.headers.get("x-vercel-ip-latitude") ?? "");
  const lon = parseFloat(req.headers.get("x-vercel-ip-longitude") ?? "");
  const body = Number.isFinite(lat) && Number.isFinite(lon) ? { lat, lon, fallback: false } : PARIS;
  return NextResponse.json(body, { headers: { "cache-control": "private, max-age=3600" } });
}
