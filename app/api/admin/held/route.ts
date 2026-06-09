import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Held-reads listing for the operator console. The admin secret comes in the POST body
// (never the URL — it must not land in logs/history/Referer), matching /api/admin/deliver.
function authorized(key: unknown): boolean {
  const secret = process.env.ADMIN_SECRET;
  return !!secret && typeof key === "string" && key === secret;
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  if (!authorized(body.key)) return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const svc = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !svc) return NextResponse.json({ ok: false, error: "not_configured" }, { status: 503 });
  const sb = createClient(url, svc);

  const { data: fails } = await sb.from("astrolabe_events")
    .select("id, user_id, subject_id, payload, created_at")
    .eq("event_type", "read_judged_failed")
    .order("created_at", { ascending: false })
    .limit(80);
  const { data: delivered } = await sb.from("astrolabe_events")
    .select("user_id, subject_id").eq("event_type", "read_delivered");
  const done = new Set((delivered ?? []).map((d) => `${d.user_id}:${d.subject_id}`));

  const held = (fails ?? [])
    .filter((r) => (r.payload as Record<string, unknown>)?.held && !done.has(`${r.user_id}:${r.subject_id}`))
    .map((r) => {
      const p = r.payload as Record<string, unknown>;
      const h = p.held as { draft?: Record<string, string>; star?: { must?: string; name?: string }; intake?: Record<string, string>; profile?: { place?: string; birthISO?: string } };
      return {
        eventId: r.id as string,
        uid: r.user_id as string,
        subjectId: r.subject_id as string,
        createdAt: r.created_at as string,
        question: h.star?.must ?? "(no question)",
        starName: h.star?.name ?? "",
        place: h.profile?.place ?? "",
        birthISO: h.profile?.birthISO ?? "",
        intake: h.intake ?? {},
        reasons: (p.failedSections as { section: string; failures?: { test: string; quote: string; why: string }[] }[]) ?? [],
        draft: h.draft ?? {},
      };
    });

  return NextResponse.json({ ok: true, held });
}
