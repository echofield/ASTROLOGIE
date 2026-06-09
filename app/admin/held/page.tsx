"use client";

import { useState } from "react";
import AdminHeldClient, { type HeldRead } from "./AdminHeldClient";

// The held-reads console gate. The admin secret is entered in a password field and sent in the
// POST body to /api/admin/held — never in the URL query (which would leak to logs, browser
// history, and Referer headers). Once authorized, the same key flows to /api/admin/deliver.
const C = { bg: "#0d0f14", ink: "#e8e6df", soft: "#9aa0ac", line: "#2a2f3a", gold: "#c2a25f", warn: "#e0a26a" };

export default function AdminHeldPage() {
  const [key, setKey] = useState("");
  const [held, setHeld] = useState<HeldRead[] | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "denied">("idle");

  async function enter() {
    const k = key.trim();
    if (!k) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/admin/held", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: k }),
      });
      const data = await res.json();
      if (data.ok) { setHeld(data.held as HeldRead[]); return; }
      setStatus("denied");
    } catch {
      setStatus("denied");
    }
  }

  if (held) return <AdminHeldClient adminKey={key.trim()} initial={held} />;

  return (
    <main style={{ minHeight: "100svh", background: C.bg, color: C.ink, fontFamily: "ui-monospace, SFMono-Regular, monospace", display: "flex", alignItems: "center", justifyContent: "center", padding: 28 }}>
      <div style={{ width: "100%", maxWidth: 360 }}>
        <h1 style={{ fontSize: 16, letterSpacing: 1, margin: 0 }}>Held-reads console</h1>
        <p style={{ color: C.soft, fontSize: 12.5, marginTop: 8 }}>Operator access.</p>
        <input
          type="password"
          value={key}
          placeholder="admin key"
          autoFocus
          onChange={(e) => { setKey(e.target.value); setStatus("idle"); }}
          onKeyDown={(e) => { if (e.key === "Enter") void enter(); }}
          style={{ width: "100%", marginTop: 16, background: "#0b0d12", color: C.ink, border: `1px solid ${C.line}`, borderRadius: 4, padding: "11px 13px", fontFamily: "inherit", fontSize: 14, outline: "none" }}
        />
        <button
          onClick={() => void enter()}
          disabled={!key.trim() || status === "loading"}
          style={{ marginTop: 14, background: C.gold, color: "#0b0d12", border: "none", borderRadius: 4, padding: "10px 22px", fontFamily: "inherit", fontSize: 12.5, letterSpacing: 1, textTransform: "uppercase", cursor: !key.trim() || status === "loading" ? "default" : "pointer", opacity: !key.trim() || status === "loading" ? 0.6 : 1 }}
        >
          {status === "loading" ? "…" : "Enter"}
        </button>
        {status === "denied" && <p style={{ color: C.warn, fontSize: 12, marginTop: 12 }}>Forbidden.</p>}
      </div>
    </main>
  );
}
