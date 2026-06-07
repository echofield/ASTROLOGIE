"use client";

import { FD, FT, NIGHT } from "@/lib/theme";
import { territoryByKey } from "@/data/territories";

// The arch-card: an artifact you earn AND a gate you pass through. Image is the
// engraved arch; clean type + edition mark are overlaid (never baked) so every
// card in the deck reads as one minted set.
const pal = NIGHT;

export const cardSrc = (key: string) => `/card-${key}.png`;
// signs that currently have generated card art (the rest fall back to a frame)
export const HAS_CARD = new Set<string>(["sagittarius"]);
// edition mark — the navy hex 030B1E, as a maison signature
const EDITION = "No. 030·B1E";

export default function Card({
  signKey, width = 300, onEnter,
}: { signKey: string; width?: number; onEnter?: () => void }) {
  const t = territoryByKey(signKey);
  if (!t) return null;
  const has = HAS_CARD.has(signKey);

  return (
    <div className="astro-card" onClick={onEnter} style={{
      width, aspectRatio: "2 / 3", position: "relative", borderRadius: 6, overflow: "hidden",
      cursor: onEnter ? "pointer" : "default", border: `1px solid ${pal.panelLine}`,
      boxShadow: "0 18px 50px rgba(0,0,0,0.5)", background: "#030B1E",
    }}>
      {has ? (
        <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${cardSrc(signKey)})`, backgroundSize: "cover", backgroundPosition: "center" }} />
      ) : (
        <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center",
          background: "radial-gradient(120% 80% at 50% 32%, #0A1330 0%, #030B1E 70%)" }}>
          <span style={{ fontFamily: "var(--font-glyph)", fontSize: width * 0.34, color: pal.brass, opacity: 0.5 }}>
            {/* glyph stand-in until art exists */}
            {["♈","♉","♊","♋","♌","♍","♎","♏","♐","♑","♒","♓"][t.i]}
          </span>
        </div>
      )}

      {/* bottom plate — clean type, sized to cover any baked signature */}
      <div style={{
        position: "absolute", left: 0, right: 0, bottom: 0, padding: "44px 16px 16px", textAlign: "center",
        background: "linear-gradient(to top, #030B1E 18%, rgba(3,11,30,0.85) 52%, transparent)",
      }}>
        <div style={{ fontFamily: FT, fontSize: 11, letterSpacing: 5, textTransform: "uppercase", color: pal.brass }}>{t.name}</div>
        <div style={{ fontFamily: FD, fontStyle: "italic", fontSize: 15, color: pal.ink, marginTop: 2 }}>{t.realm}</div>
        <div style={{ fontFamily: FT, fontSize: 8.5, letterSpacing: 3, textTransform: "uppercase", color: pal.inkSoft, opacity: 0.7, marginTop: 7 }}>{EDITION}</div>
      </div>
    </div>
  );
}
