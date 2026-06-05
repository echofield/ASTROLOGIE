import { PRODUCT_NAME } from "@/lib/brand";
import { FD, FT, NIGHT } from "@/lib/theme";

export default function Loading() {
  return (
    <main style={{ minHeight: "100svh", background: NIGHT.bg, color: NIGHT.ink, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FT }}>
      <div style={{ textAlign: "center", padding: 24 }}>
        <div style={{ fontFamily: FT, letterSpacing: 3, textTransform: "uppercase", fontSize: 11, color: NIGHT.brass }}>{PRODUCT_NAME}</div>
        <div style={{ fontFamily: FD, fontStyle: "italic", fontSize: 30, marginTop: 10 }}>Preparing your sky.</div>
        <div style={{ color: NIGHT.inkSoft, fontSize: 14, marginTop: 8 }}>Préparation de votre ciel.</div>
      </div>
    </main>
  );
}
