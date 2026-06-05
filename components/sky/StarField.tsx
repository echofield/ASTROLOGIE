"use client";

import { useMemo } from "react";
import type { Palette } from "@/lib/theme";

// Night-only star layer: static and faint; depth comes from parallax.
function seeded(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

export default function StarField({
  pal, layer = 1, par,
}: {
  pal: Palette; layer?: number; par: { x: number; y: number };
}) {
  const dots = useMemo(() => (
    Array.from({ length: layer === 1 ? 60 : 26 }, (_, i) => ({
      x: seeded(layer * 1000 + i * 4 + 1) * 100,
      y: seeded(layer * 1000 + i * 4 + 2) * 100,
      r: seeded(layer * 1000 + i * 4 + 3) * (layer === 1 ? 1.2 : 1.8) + 0.4,
      o: seeded(layer * 1000 + i * 4 + 4) * 0.5 + 0.2,
    }))
  ), [layer]);
  const k = layer === 1 ? 6 : 12;
  return (
    <svg
      style={{
        position: "absolute", inset: -20, width: "calc(100% + 40px)", height: "calc(100% + 40px)",
        transform: `translate(${par.x * k}px, ${par.y * k}px)`, transition: "transform .4s ease-out",
      }}
    >
      {dots.map((d, i) => (
        <circle key={i} cx={`${d.x}%`} cy={`${d.y}%`} r={d.r} fill={pal.star} opacity={d.o} />
      ))}
    </svg>
  );
}
