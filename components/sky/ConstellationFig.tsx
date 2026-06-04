"use client";

import type { Palette } from "@/lib/theme";
import { CONSTELLATIONS } from "@/lib/constellations";

// Stylized luminous line-figure for one sign.
export default function ConstellationFig({
  k, pal, w = 200, h = 200, dotMax = 2.4, line = true,
}: {
  k: string; pal: Palette; w?: number; h?: number; dotMax?: number; line?: boolean;
}) {
  const C = CONSTELLATIONS[k];
  if (!C) return null;
  const col = pal.star || pal.brass;
  return (
    <g>
      {line && C.l.map(([a, b], i) => (
        <line key={`l${i}`} x1={C.s[a][0] * w} y1={C.s[a][1] * h} x2={C.s[b][0] * w} y2={C.s[b][1] * h}
          stroke={col} strokeWidth={0.6} opacity={0.4} />
      ))}
      {C.s.map((st, i) => (
        <circle key={`s${i}`} cx={st[0] * w} cy={st[1] * h} r={dotMax * (1 - (st[2] - 1) * 0.28)}
          fill={col} opacity={0.95 - (st[2] - 1) * 0.18}
          style={{ filter: `drop-shadow(0 0 2px ${col})` }} />
      ))}
    </g>
  );
}
