import Link from "next/link";
import { PRODUCT_NAME } from "@/lib/brand";
import { FD, FN, FT, NIGHT } from "@/lib/theme";

export default function NotFound() {
  return (
    <main style={{ minHeight: "100svh", background: NIGHT.bg, color: NIGHT.ink, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FT, padding: 24 }}>
      <div style={{ maxWidth: 420, textAlign: "center" }}>
        <div style={{ fontFamily: FT, letterSpacing: 3, textTransform: "uppercase", fontSize: 11, color: NIGHT.brass }}>{PRODUCT_NAME}</div>
        <h1 style={{ fontFamily: FD, fontStyle: "italic", fontSize: 38, lineHeight: 1.05, margin: "12px 0 10px", fontWeight: 500 }}>Page not found</h1>
        <p style={{ color: NIGHT.inkSoft, fontSize: 15, lineHeight: 1.5 }}>This route does not exist yet. Cette page n&apos;existe pas encore.</p>
        <Link href="/" style={{ display: "inline-flex", marginTop: 22, border: `1px solid ${NIGHT.accent}`, color: NIGHT.accent, borderRadius: 24, padding: "11px 18px", fontFamily: FN, fontSize: 12, textDecoration: "none" }}>
          Return / Retour
        </Link>
      </div>
    </main>
  );
}
