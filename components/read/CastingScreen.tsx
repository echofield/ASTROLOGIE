"use client";

import { useEffect, useState } from "react";
import type { Palette } from "@/lib/theme";
import { FD } from "@/lib/theme";
import { Cap } from "@/components/sky/chrome";
import PlanetMedallion from "@/components/sky/PlanetMedallion";

// The waiting room — a "casting", not a spinner. Anticipation is part of the value.
export default function CastingScreen({
  pal, par, cap, lines,
}: {
  pal: Palette; par: { x: number; y: number }; cap: string; lines: string[];
}) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((v) => v + 1), 2600);
    return () => clearInterval(id);
  }, []);
  return (
    <div style={{ textAlign: "center", maxWidth: 460, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "center", transform: `translate(${par.x * 5}px, ${par.y * 5}px)`, transition: "transform .4s ease-out" }}>
        <PlanetMedallion pal={pal} glyph="✶" size={176} />
      </div>
      <Cap pal={pal} style={{ marginTop: 28 }}>{cap}</Cap>
      <div key={i} className="astro-fade" style={{ fontFamily: FD, fontStyle: "italic", fontSize: 22, color: pal.ink, marginTop: 14, minHeight: 64, lineHeight: 1.35 }}>
        {lines[i % lines.length]}
      </div>
    </div>
  );
}
