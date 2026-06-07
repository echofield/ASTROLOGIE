import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Hand-fulfilment delivery. Gated by ADMIN_SECRET. Writes the finished (edited or
// regenerated) read to the customer's astrolabe_reads BY UID — it then appears in
// their Cabinet on return. Logs read_delivered so the held-reads page can clear it.
function ok(key: unknown): boolean {
  const secret = process.env.ADMIN_SECRET;
  return !!secret && typeof key === "string" && key === secret;
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  if (!ok(body.key)) return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });

  const { uid, read, subjectId } = body as { uid?: string; read?: Record<string, string>; subjectId?: string };
  if (!uid || !read || typeof read !== "object") return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const svc = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !svc) return NextResponse.json({ ok: false, error: "not_configured" }, { status: 503 });
  const sb = createClient(url, svc);

  const generatedAt = (read.generatedAt as string) || new Date().toISOString();
  const artifact = {
    signature: read.signature ?? "", chart: read.chart ?? "", pattern: read.pattern ?? "",
    star: read.star ?? "", yearAhead: read.yearAhead ?? "", counsel: read.counsel ?? "", generatedAt,
  };

  const { error } = await sb.from("astrolabe_reads")
    .upsert({ user_id: uid, read: artifact, created_at: new Date().toISOString() }, { onConflict: "user_id" });
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  // trail — clears the row from the held-reads page
  try {
    await sb.from("astrolabe_events").insert({
      user_id: uid, subject_type: "read", subject_id: subjectId ?? generatedAt,
      event_type: "read_delivered", payload: { by: "admin" }, created_at: new Date().toISOString(),
    });
  } catch { /* delivery already succeeded; the trail is best-effort */ }

  return NextResponse.json({ ok: true });
}
