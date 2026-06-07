"use client";

import { useEffect, useState } from "react";
import { NIGHT, FD, FT } from "@/lib/theme";
import { addEntry, getEntries, syncRecords, type RecordEntry } from "@/lib/atlas/records";

// The Day's Record — short timestamped entries, the breathing between the
// monthly heartbeats of The Standing. Persists localStorage-first + mirrors.
const pal = NIGHT;

function when(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" }) + " · " +
    d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

export default function DayRecord() {
  const [entries, setEntries] = useState<RecordEntry[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setEntries(getEntries());
    syncRecords().then(setEntries).catch(() => {});
  }, []);

  const submit = async () => {
    const text = draft.trim(); if (!text || busy) return;
    setBusy(true); setDraft("");
    setEntries(await addEntry(text));
    setBusy(false);
  };

  return (
    <section style={{ maxWidth: 560, margin: "0 auto", width: "100%" }}>
      <div style={{ fontFamily: FT, fontSize: 11, letterSpacing: 4, textTransform: "uppercase", color: pal.inkSoft, marginBottom: 14 }}>
        The Day's Record
      </div>
      <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
        <textarea
          value={draft} onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit(); }}
          placeholder="A line for today…" rows={2}
          style={{ flex: 1, resize: "none", background: "rgba(255,255,255,0.03)", border: `1px solid ${pal.panelLine}`,
            borderRadius: 3, padding: "12px 14px", color: pal.ink, fontFamily: FT, fontSize: 15, lineHeight: 1.5, outline: "none" }}
        />
        <button onClick={submit} disabled={busy || !draft.trim()} style={{
          fontFamily: FT, fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: pal.btnInk,
          background: draft.trim() ? pal.brass : pal.line, border: "none", borderRadius: 2, padding: "12px 18px",
          cursor: draft.trim() ? "pointer" : "default",
        }}>Keep</button>
      </div>
      <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 0 }}>
        {entries.length === 0 && (
          <div style={{ fontFamily: FD, fontStyle: "italic", fontSize: 15, color: pal.inkSoft, opacity: 0.7, padding: "8px 0" }}>
            Nothing kept yet. What moved today?
          </div>
        )}
        {entries.map((e) => (
          <div key={e.id} style={{ padding: "14px 0", borderTop: `1px solid ${pal.panelLine}` }}>
            <div style={{ fontFamily: FT, fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: pal.inkSoft, opacity: 0.7, marginBottom: 5 }}>{when(e.created_at)}</div>
            <div style={{ fontFamily: FD, fontSize: 17, color: pal.ink, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{e.body}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
