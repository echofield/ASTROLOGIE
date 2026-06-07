import { createClient } from "@supabase/supabase-js";
import AdminHeldClient, { type HeldRead } from "./AdminHeldClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// The held-reads console. A judge-fail is logged (client-side, under the customer's
// uid) on read_judged_failed with the full held context. This page (service role)
// lists the un-delivered ones so the operator can edit/regenerate and deliver.
async function loadHeld(): Promise<HeldRead[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const svc = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !svc) return [];
  const sb = createClient(url, svc);

  const { data: fails } = await sb.from("astrolabe_events")
    .select("id, user_id, subject_id, payload, created_at")
    .eq("event_type", "read_judged_failed")
    .order("created_at", { ascending: false })
    .limit(80);
  const { data: delivered } = await sb.from("astrolabe_events")
    .select("user_id, subject_id").eq("event_type", "read_delivered");
  const done = new Set((delivered ?? []).map((d) => `${d.user_id}:${d.subject_id}`));

  return (fails ?? [])
    .filter((r) => (r.payload as Record<string, unknown>)?.held && !done.has(`${r.user_id}:${r.subject_id}`))
    .map((r) => {
      const p = r.payload as Record<string, unknown>;
      const held = p.held as { draft?: Record<string, string>; star?: { must?: string; name?: string }; intake?: Record<string, string>; profile?: { place?: string; birthISO?: string } };
      return {
        eventId: r.id as string,
        uid: r.user_id as string,
        subjectId: r.subject_id as string,
        createdAt: r.created_at as string,
        question: held.star?.must ?? "(no question)",
        starName: held.star?.name ?? "",
        place: held.profile?.place ?? "",
        birthISO: held.profile?.birthISO ?? "",
        intake: held.intake ?? {},
        reasons: (p.failedSections as { section: string; failures?: { test: string; quote: string; why: string }[] }[]) ?? [],
        draft: held.draft ?? {},
      } satisfies HeldRead;
    });
}

export default async function AdminHeldPage({ searchParams }: { searchParams: Promise<{ key?: string }> }) {
  const key = (await searchParams).key ?? "";
  const secret = process.env.ADMIN_SECRET;
  const wrap: React.CSSProperties = { minHeight: "100svh", background: "#0d0f14", color: "#e8e6df", fontFamily: "ui-monospace, monospace", padding: "40px 28px" };

  if (!secret) return <main style={wrap}>ADMIN_SECRET is not set — the held-reads console is disabled.</main>;
  if (key !== secret) return <main style={wrap}>Forbidden. Append ?key=… to access the held-reads console.</main>;

  const held = await loadHeld();
  return <AdminHeldClient adminKey={key} initial={held} />;
}
