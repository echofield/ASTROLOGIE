"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { Palette } from "@/lib/theme";
import { FD } from "@/lib/theme";
import { Cap } from "@/components/sky/chrome";
import PlanetMedallion from "@/components/sky/PlanetMedallion";

// The waiting room — a "casting", not a spinner. The wait is intention: lines fade slowly,
// one at a time. The footer is the functional anchor (email + the hour it arrives).
export default function CastingScreen({
  pal, par, cap, lines, footer,
}: {
  pal: Palette; par: { x: number; y: number }; cap: string; lines: string[]; footer?: ReactNode;
}) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((v) => v + 1), 3800); // slow — no urgency
    return () => clearInterval(id);
  }, []);
  return (
    <div style={{ textAlign: "center", maxWidth: 480, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "center", transform: `translate(${par.x * 5}px, ${par.y * 5}px)`, transition: "transform .4s ease-out" }}>
        <PlanetMedallion pal={pal} glyph="✶" size={176} />
      </div>
      <Cap pal={pal} style={{ marginTop: 28 }}>{cap}</Cap>
      <div key={i} className="astro-fade" style={{ fontFamily: FD, fontStyle: "italic", fontSize: 23, color: pal.ink, marginTop: 16, minHeight: 84, lineHeight: 1.4, padding: "0 14px" }}>
        {lines[i % lines.length]}
      </div>
      {footer}
    </div>
  );
}
