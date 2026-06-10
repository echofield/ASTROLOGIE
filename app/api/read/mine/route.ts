import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ACCESS_COOKIE, verifyAccess } from "@/lib/access";

export const runtime = "nodejs";

// Cross-device read retrieval. The €60 reading is keyed by anonymous browser session for
// the same-device fast path, but also stamped with the paid email at generation. Here we
// read it back by the email carried in the (signed, httpOnly) access cookie — so the
// reading the customer bought is recoverable on any device once they confirm that email.
// Returns { read: null } (never an error) when there's nothing to show, so the Cabinet
// can call it unconditionally on mount.
export async function GET() {
  const jar = await cookies();
  const token = jar.get(ACCESS_COOKIE)?.value;
  const { ok, email } = verifyAccess(token ?? "");
  if (!ok || !email) return NextResponse.json({ read: null });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ read: null });

  try {
    // email is the normalized-lowercase value the cookie was signed with, and the reading rows
    // are stamped with the same — exact eq is correct (and dodges ilike's %-wildcard handling).
    // Plural shelf: return the full list (newest first); `read` stays the newest for compat.
    const q = `${url}/rest/v1/astrolabe_readings?email=eq.${encodeURIComponent(email)}&select=read,created_at,opened_at&order=created_at.desc`;
    const res = await fetch(q, { headers: { apikey: key, Authorization: `Bearer ${key}` }, cache: "no-store" });
    if (!res.ok) return NextResponse.json({ read: null, reads: [] });
    const rows = (await res.json()) as { read?: unknown; created_at?: string; opened_at?: string | null }[];
    const reads = Array.isArray(rows) ? rows.filter((r) => r.read) : [];
    return NextResponse.json({ read: reads[0]?.read ?? null, reads });
  } catch (e) {
    console.error("[read/mine] lookup failed:", e);
    return NextResponse.json({ read: null, reads: [] });
  }
}
