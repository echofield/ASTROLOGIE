"use client";

import { useState } from "react";
import Link from "next/link";
import { FD, FT, type Palette } from "@/lib/theme";
import type { Lang } from "@/lib/brand";

interface Props {
  pal: Palette;
  lang: Lang;
  copy: {
    emailLabel: string;
    emailPlaceholder: string;
    confirm: string;
    denied: string;
    skip: string;
  };
}

export default function SuccessAccessForm({ pal, lang, copy }: Props) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "denied">("idle");

  async function confirm() {
    const val = email.trim();
    if (!val) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: val }),
      });
      const data = await res.json();
      if (data.ok) {
        // remember the email so the "being drawn" ceremony can show where it'll be sent
        try { window.localStorage.setItem("the-astrolab.email", val); } catch {}
        // the read intake/generation lives on /cabinet (the wheel at / ignores ?read=intake)
        window.location.href = `/cabinet?read=intake&lang=${lang}`;
        return;
      }
      setStatus("denied");
    } catch {
      setStatus("denied");
    }
  }

  return (
    <div style={{ marginTop: 28, textAlign: "left", maxWidth: 360, marginLeft: "auto", marginRight: "auto" }}>
      <label style={{ display: "block" }}>
        <span style={{ fontFamily: FT, fontSize: 9.5, letterSpacing: 2, textTransform: "uppercase", color: pal.inkSoft }}>{copy.emailLabel}</span>
        <input
          type="email"
          value={email}
          placeholder={copy.emailPlaceholder}
          onChange={(e) => { setEmail(e.target.value); setStatus("idle"); }}
          style={{
            display: "block", width: "100%", marginTop: 7, background: "transparent", border: "none",
            borderBottom: `1px solid ${pal.panelLine}`, color: pal.ink, fontFamily: FD, fontStyle: "italic",
            fontSize: 20, padding: "8px 2px", outline: "none",
          }}
        />
      </label>
      <button
        onClick={() => void confirm()}
        disabled={!email.trim() || status === "loading"}
        style={{
          display: "inline-flex", marginTop: 18, padding: "12px 28px", borderRadius: 30,
          background: pal.accent, color: pal.btnInk, border: "none", cursor: "pointer",
          fontFamily: FT, fontWeight: 500, letterSpacing: 3, textTransform: "uppercase", fontSize: 12,
          opacity: !email.trim() || status === "loading" ? 0.5 : 1,
        }}
      >
        {status === "loading" ? "…" : copy.confirm}
      </button>
      {status === "denied" && (
        <p style={{ color: pal.accent, fontSize: 13, marginTop: 12 }}>{copy.denied}</p>
      )}
      <p style={{ marginTop: 16 }}>
        <Link href={`/?lang=${lang}`} style={{ color: pal.inkSoft, fontFamily: FT, fontSize: 12 }}>{copy.skip}</Link>
      </p>
    </div>
  );
}
