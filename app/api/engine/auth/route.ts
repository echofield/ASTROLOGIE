import { NextResponse } from "next/server";
import { rateLimit, clientKey } from "@/lib/ratelimit";

export const runtime = "nodejs";

// The Studio gate — operator surface, same key discipline as the held-reads
// console: the secret travels in the POST body, never the URL.
export async function POST(req: Request) {
  const rl = rateLimit(`engine:${clientKey(req)}`, 10, 10 * 60 * 1000);
  if (!rl.ok) return NextResponse.json({ ok: false }, { status: 429 });
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return NextResponse.json({ ok: false }, { status: 503 });
  try {
    const { key } = (await req.json()) as { key?: string };
    return NextResponse.json({ ok: typeof key === "string" && key === secret });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
