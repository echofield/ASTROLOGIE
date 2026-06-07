"use client";

import { useRouter } from "next/navigation";
import Card from "@/components/cards/Card";
import { NIGHT, FD, FT } from "@/lib/theme";

// Showcase: a single card as it lives in the Codex. Click the gate to pass through.
const pal = NIGHT;

export default function CardPage() {
  const router = useRouter();
  return (
    <main style={{
      minHeight: "100dvh", color: pal.ink, padding: "40px 20px",
      background: "radial-gradient(120% 105% at 50% 22%, #0A1330 0%, #030B1E 60%, #02050E 100%)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 22,
    }}>
      <div style={{ fontFamily: FT, fontSize: 11, letterSpacing: 6, textTransform: "uppercase", color: pal.inkSoft }}>
        The Codex · a card
      </div>
      <Card signKey="sagittarius" width={340} onEnter={() => router.push("/sign/sagittarius")} />
      <div style={{ fontFamily: FD, fontStyle: "italic", fontSize: 15, color: pal.inkSoft }}>
        Click the gate to pass through.
      </div>
      <button onClick={() => router.push("/wheel3")} style={{
        fontFamily: FT, fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: pal.inkSoft,
        background: "transparent", border: "none", cursor: "pointer", marginTop: 8,
      }}>← the atlas</button>
    </main>
  );
}
