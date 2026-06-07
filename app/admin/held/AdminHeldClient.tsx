"use client";

import { useState } from "react";

export interface HeldRead {
  eventId: string;
  uid: string;
  subjectId: string;
  createdAt: string;
  question: string;
  starName: string;
  place: string;
  birthISO: string;
  intake: Record<string, string>;
  reasons: { section: string; failures?: { test: string; quote: string; why: string }[] }[];
  draft: Record<string, string>;
}

const SECTIONS = ["signature", "chart", "pattern", "star", "yearAhead", "counsel"] as const;
const C = { bg: "#0d0f14", panel: "#14171f", line: "#2a2f3a", ink: "#e8e6df", soft: "#9aa0ac", gold: "#c2a25f", warn: "#e0a26a" };

export default function AdminHeldClient({ adminKey, initial }: { adminKey: string; initial: HeldRead[] }) {
  const [rows, setRows] = useState(initial);
  return (
    <main style={{ minHeight: "100svh", background: C.bg, color: C.ink, fontFamily: "ui-monospace, SFMono-Regular, monospace", padding: "36px 28px" }}>
      <div style={{ maxWidth: 980, margin: "0 auto" }}>
        <h1 style={{ fontSize: 20, letterSpacing: 1, margin: 0 }}>Held readings <span style={{ color: C.gold }}>· {rows.length}</span></h1>
        <p style={{ color: C.soft, fontSize: 12.5, marginTop: 6 }}>Judge-fails awaiting hand-fulfilment. Edit the flagged sections against the reasons, then deliver — it lands in the customer&apos;s Cabinet on return.</p>
        {rows.length === 0 && <p style={{ color: C.soft, marginTop: 30 }}>Nothing held. A judge-fail will appear here.</p>}
        {rows.map((r) => (
          <HeldCard key={r.eventId} row={r} adminKey={adminKey} onDelivered={() => setRows((rs) => rs.filter((x) => x.eventId !== r.eventId))} />
        ))}
      </div>
    </main>
  );
}

function HeldCard({ row, adminKey, onDelivered }: { row: HeldRead; adminKey: string; onDelivered: () => void }) {
  const [draft, setDraft] = useState<Record<string, string>>(() => ({ ...row.draft }));
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const failedBy = new Map(row.reasons.map((r) => [r.section, r.failures ?? []]));

  async function deliver() {
    setStatus("sending");
    try {
      const res = await fetch("/api/admin/deliver", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: adminKey, uid: row.uid, subjectId: row.subjectId, read: { ...draft, generatedAt: row.subjectId } }),
      });
      const data = await res.json();
      if (data.ok) { setStatus("done"); setTimeout(onDelivered, 1000); } else setStatus("error");
    } catch { setStatus("error"); }
  }

  return (
    <section style={{ border: `1px solid ${C.line}`, background: C.panel, borderRadius: 6, padding: "22px 22px 24px", margin: "22px 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", borderBottom: `1px solid ${C.line}`, paddingBottom: 14 }}>
        <div>
          <div style={{ color: C.soft, fontSize: 11, letterSpacing: 1 }}>QUESTION{row.starName ? ` · ${row.starName}` : ""}</div>
          <div style={{ fontSize: 16, marginTop: 4 }}>{row.question}</div>
        </div>
        <div style={{ color: C.soft, fontSize: 11, textAlign: "right", lineHeight: 1.7 }}>
          {row.place || "—"}<br />{row.birthISO || "—"}<br />uid {row.uid.slice(0, 8)}…
        </div>
      </div>

      {(row.intake.season || row.intake.repeating || row.intake.afraid) && (
        <div style={{ color: C.soft, fontSize: 12, marginTop: 12, lineHeight: 1.6 }}>
          {row.intake.season && <div>season — {row.intake.season}</div>}
          {row.intake.repeating && <div>repeating — {row.intake.repeating}</div>}
          {row.intake.afraid && <div>afraid — {row.intake.afraid}</div>}
        </div>
      )}

      <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 14 }}>
        {SECTIONS.map((k) => {
          const fails = failedBy.get(k) ?? [];
          return (
            <div key={k}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                <span style={{ color: fails.length ? C.warn : C.soft, fontSize: 12, letterSpacing: 1, textTransform: "uppercase" }}>{k}</span>
                {fails.length > 0 && <span style={{ color: C.warn, fontSize: 11 }}>✦ {fails.map((f) => f.test).join(", ")}</span>}
              </div>
              {fails.map((f, i) => (
                <div key={i} style={{ color: C.warn, fontSize: 11.5, marginTop: 4, lineHeight: 1.5, opacity: 0.92 }}>
                  &quot;{f.quote}&quot; — {f.why}
                </div>
              ))}
              <textarea
                value={draft[k] ?? ""}
                onChange={(e) => setDraft((d) => ({ ...d, [k]: e.target.value }))}
                style={{ width: "100%", marginTop: 6, minHeight: k === "counsel" ? 56 : 120, background: "#0b0d12", color: C.ink, border: `1px solid ${fails.length ? C.warn + "66" : C.line}`, borderRadius: 4, padding: "10px 12px", fontFamily: "Georgia, serif", fontSize: 14, lineHeight: 1.55, resize: "vertical" }}
              />
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 18, display: "flex", alignItems: "center", gap: 16 }}>
        <button onClick={() => void deliver()} disabled={status === "sending" || status === "done"}
          style={{ background: status === "done" ? "#2f6b3f" : C.gold, color: "#0b0d12", border: "none", borderRadius: 4, padding: "10px 22px", fontFamily: "inherit", fontSize: 12.5, letterSpacing: 1, textTransform: "uppercase", cursor: status === "sending" ? "default" : "pointer", opacity: status === "sending" ? 0.6 : 1 }}>
          {status === "done" ? "Delivered ✓" : status === "sending" ? "Delivering…" : "Deliver to Cabinet"}
        </button>
        {status === "error" && <span style={{ color: C.warn, fontSize: 12 }}>Delivery failed — check ADMIN_SECRET / service role.</span>}
      </div>
    </section>
  );
}
