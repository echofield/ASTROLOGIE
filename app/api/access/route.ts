import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { accessCookieOptions, readOpen, signAccess } from "@/lib/access";
import { rateLimit, clientKey } from "@/lib/ratelimit";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    const normalized = String(email ?? "").trim().toLowerCase();
    if (!normalized) return NextResponse.json({ ok: false });

    if (readOpen()) {
      const token = signAccess(normalized) ?? "open";
      const res = NextResponse.json({ ok: true, hasRead: false });
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

    // H2 — cap access GRANTS at 3 per IP per hour. Checked only once the order is confirmed, so
    // M1's race-retry (which polls while the order is still missing) never burns the cap — this
    // throttles only the abuse case: repeatedly minting access from known paid emails.
    const rl = rateLimit(`access:${clientKey(req)}`, 3, 60 * 60 * 1000);
    if (!rl.ok) {
      return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429, headers: { "retry-after": String(rl.retryAfter) } });
    }

    const token = signAccess(normalized);
    if (!token) return NextResponse.json({ ok: false });

    // Is a reading already drawn for this email? If so, /success routes straight to it
    // (cross-device re-claim) instead of opening a fresh intake.
    const { data: existingRead } = await supabase
      .from("astrolabe_readings")
      .select("email")
      .ilike("email", normalized)
      .limit(1)
      .maybeSingle();

    const res = NextResponse.json({ ok: true, hasRead: !!existingRead });
    res.cookies.set(accessCookieOptions(token));
    return res;
  } catch {
    return NextResponse.json({ ok: false });
  }
}
