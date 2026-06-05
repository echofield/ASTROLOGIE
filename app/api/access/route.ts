import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { accessCookieOptions, readOpen, signAccess } from "@/lib/access";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    const normalized = String(email ?? "").trim().toLowerCase();
    if (!normalized) return NextResponse.json({ ok: false });

    if (readOpen()) {
      const token = signAccess(normalized) ?? "open";
      const res = NextResponse.json({ ok: true });
      res.cookies.set(accessCookieOptions(token));
      return res;
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return NextResponse.json({ ok: false });

    const supabase = createClient(url, key);
    const { data } = await supabase
      .from("astrolabe_orders")
      .select("email")
      .ilike("email", normalized)
      .limit(1)
      .maybeSingle();

    if (!data) return NextResponse.json({ ok: false });

    const token = signAccess(normalized);
    if (!token) return NextResponse.json({ ok: false });

    const res = NextResponse.json({ ok: true });
    res.cookies.set(accessCookieOptions(token));
    return res;
  } catch {
    return NextResponse.json({ ok: false });
  }
}
