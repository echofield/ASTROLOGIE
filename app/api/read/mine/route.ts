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
    // email is the normalized-lowercase value the cookie was signed with, and the read row was
    // stamped with the same — so exact eq is correct (and dodges ilike's %-wildcard handling).
    const q = `${url}/rest/v1/astrolabe_reads?email=eq.${encodeURIComponent(email)}&select=read,created_at&order=created_at.desc&limit=1`;
    const res = await fetch(q, { headers: { apikey: key, Authorization: `Bearer ${key}` }, cache: "no-store" });
    if (!res.ok) return NextResponse.json({ read: null });
    const rows = (await res.json()) as { read?: unknown }[];
    const read = Array.isArray(rows) && rows[0]?.read ? rows[0].read : null;
    return NextResponse.json({ read });
  } catch (e) {
    console.error("[read/mine] lookup failed:", e);
    return NextResponse.json({ read: null });
  }
}
