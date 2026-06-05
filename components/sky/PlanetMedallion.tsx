"use client";

import { useId } from "react";
import type { Palette } from "@/lib/theme";
import { GlyphText } from "./primitives";

// AstroLab-style medallion — light + orbit + engraving. The sealed-star hero
// (replaces the brown sphere). The glyph is a label on the orbit, not an object.
export default function PlanetMedallion({
  pal, glyph = "♂", size = 200,
}: {
  pal: Palette; glyph?: string; size?: number;
}) {
  const uid = useId().replace(/:/g, "");
  const night = pal.theme === "night";
  const ticks = Array.from({ length: 72 }, (_, i) => {
    const a = (i * 5 * Math.PI) / 180, big = i % 6 === 0;
    const r1 = 92, r2 = 92 - (big ? 7 : 3.5);
    return <line key={i} x1={100 + r1 * Math.cos(a)} y1={100 + r1 * Math.sin(a)}
      x2={100 + r2 * Math.cos(a)} y2={100 + r2 * Math.sin(a)} stroke={pal.brass}
      strokeWidth={big ? 0.8 : 0.4} opacity={big ? 0.7 : 0.4} />;
  });
  return (
    <svg viewBox="0 0 200 200" width={size} height={size} style={{ display: "block", overflow: "visible" }}>
      <defs>
        <radialGradient id={`hl${uid}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={pal.starHalo} stopOpacity={night ? 0.85 : 0.5} />
          <stop offset="55%" stopColor={pal.starHalo} stopOpacity={night ? 0.15 : 0.1} />
          <stop offset="100%" stopColor={pal.starHalo} stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="100" cy="100" r="96" fill={`url(#hl${uid})`} />
      <circle cx="100" cy="100" r="95" fill="none" stroke={pal.brass} strokeWidth="0.9" opacity="0.7" />
      <circle cx="100" cy="100" r="92" fill="none" stroke={pal.brass} strokeWidth="0.5" opacity="0.45" />
      {ticks}
      <ellipse cx="100" cy="100" rx="74" ry="30" fill="none" stroke={pal.brass} strokeWidth="0.7" opacity="0.5"
        transform="rotate(-22 100 100)" />
      <ellipse cx="100" cy="100" rx="62" ry="46" fill="none" stroke={pal.brass} strokeWidth="0.5" opacity="0.35"
        transform="rotate(24 100 100)" />
      <g transform="translate(100 100)">
        <g className="astro-pulse-slow">
          <path d="M0 -26 L5 -6 L26 0 L5 6 L0 26 L-5 6 L-26 0 L-5 -6 Z" fill={pal.starCore}
            style={{ filter: `drop-shadow(0 0 8px ${pal.starHalo})` }} />
          <path d="M0 -12 L2.4 -2.4 L12 0 L2.4 2.4 L0 12 L-2.4 2.4 L-12 0 L-2.4 -2.4 Z" fill="#fff" opacity="0.9" />
        </g>
      </g>
      <GlyphText ch={glyph} x={158} y={70} size={15} fill={pal.brass} opacity={0.9} />
    </svg>
  );
}
