"use client";

import { useMemo } from "react";
import type { Palette } from "@/lib/theme";

// Night-only star layer — static, faint; depth comes from parallax.
export default function StarField({
  pal, layer = 1, par,
}: {
  pal: Palette; layer?: number; par: { x: number; y: number };
}) {
  const dots = useMemo(() => {
    let s = 11 + layer * 7;
    const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    return Array.from({ length: layer === 1 ? 60 : 26 }, () => ({
      x: rnd() * 100, y: rnd() * 100, r: rnd() * (layer === 1 ? 1.2 : 1.8) + 0.4, o: rnd() * 0.5 + 0.2,
    }));
  }, [layer]);
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
