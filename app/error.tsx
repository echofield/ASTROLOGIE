"use client";

import Link from "next/link";
import { useState } from "react";
import { DEFAULT_LANG, PRODUCT_NAME, type Lang } from "@/lib/brand";
import { FD, FN, FT, NIGHT } from "@/lib/theme";

const COPY = {
  en: {
    cap: "Something moved",
    title: "The report could not be opened.",
    body: "Refresh the page or return to the instrument.",
    retry: "Try again",
    home: "Return home",
  },
  fr: {
    cap: "Un mouvement a échoué",
    title: "Le rapport n'a pas pu s'ouvrir.",
    body: "Actualisez la page ou revenez à l'instrument.",
    retry: "Réessayer",
    home: "Retour",
  },
};

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const [lang] = useState<Lang>(() => {
    if (typeof window === "undefined") return DEFAULT_LANG;
    const saved = window.localStorage.getItem("the-astrolab.lang");
    return saved === "fr" || saved === "en" ? saved : DEFAULT_LANG;
  });
  const t = COPY[lang];
  return (
    <main style={{ minHeight: "100svh", background: NIGHT.bg, color: NIGHT.ink, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FT, padding: 24 }}>
      <div style={{ maxWidth: 420, textAlign: "center" }}>
        <div style={{ fontFamily: FT, letterSpacing: 3, textTransform: "uppercase", fontSize: 11, color: NIGHT.brass }}>{t.cap}</div>
        <h1 style={{ fontFamily: FD, fontStyle: "italic", fontSize: 38, lineHeight: 1.05, margin: "12px 0 10px", fontWeight: 500 }}>{t.title}</h1>
        <p style={{ color: NIGHT.inkSoft, fontSize: 15, lineHeight: 1.5 }}>{t.body}</p>
        <div style={{ display: "flex", justifyContent: "center", gap: 10, marginTop: 22 }}>
          <button onClick={reset} style={{ appearance: "none", cursor: "pointer", border: `1px solid ${NIGHT.accent}`, background: NIGHT.accent, color: NIGHT.btnInk, borderRadius: 24, padding: "11px 18px", fontFamily: FN, fontSize: 12 }}>
            {t.retry}
          </button>
          <Link href="/" style={{ border: `1px solid ${NIGHT.panelLine}`, color: NIGHT.ink, borderRadius: 24, padding: "11px 18px", fontFamily: FN, fontSize: 12, textDecoration: "none" }}>
            {t.home}
          </Link>
        </div>
        <div style={{ fontFamily: FD, color: NIGHT.inkSoft, fontSize: 13, marginTop: 20 }}>{PRODUCT_NAME}</div>
      </div>
    </main>
  );
}
