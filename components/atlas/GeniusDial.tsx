"use client";

import { useEffect, useState } from "react";
import table from "@/data/constellations.json";
import type { ConstellationTable } from "@/types/atlas";

// The Genius instrument — the orrery dial from the design: a ticked ring, a
// constellation line-figure, an elliptical orbit, and the ouroboros body that
// travels it (120s a lap). Once a birth chart exists the abstract asterism
// resolves into the user's REAL sun constellation, drawn from the same star
// table as the Atlas plates (ra/dec/mag); its brightest star turns gold when
// a question is sealed.
const SIGNS = (table as unknown as ConstellationTable).signs;
const ORBIT = "M322.4,150.6 A132,52 -22 1,0 77.6,249.4 A132,52 -22 1,0 322.4,150.6";

interface Pt { x: number; y: number; r: number; faint?: boolean; heart?: boolean; id?: string }

// the design's abstract asterism — the resting figure before a chart exists
const ABSTRACT: { pts: Pt[]; lines: [number, number][] } = {
  pts: [
    { x: 150, y: 158, r: 2.4 },
    { x: 184, y: 140, r: 1.5, faint: true },
    { x: 224, y: 158, r: 3.0, heart: true },
    { x: 258, y: 198, r: 1.7 },
    { x: 236, y: 244, r: 2.1 },
    { x: 190, y: 236, r: 1.4, faint: true },
    { x: 300, y: 138, r: 1.3, faint: true },
  ],
  lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5]],
};

/** Project a sign's real stars (ra hours / dec degrees / mag) into the dial. */
function realFigure(signKey: string): { pts: Pt[]; lines: [number, number][] } | null {
  const sign = SIGNS[signKey] as { stars?: { id: string; ra: number; dec: number; mag: number }[]; lines?: [string, string][] } | undefined;
  if (!sign?.stars?.length) return null;
  let ras = sign.stars.map((s) => s.ra);
  // RA wraps at 24h (Pisces straddles it) — unwrap before normalizing
  if (Math.max(...ras) - Math.min(...ras) > 12) ras = ras.map((r) => (r < 12 ? r + 24 : r));
  const decs = sign.stars.map((s) => s.dec);
  const raMin = Math.min(...ras), raSpan = Math.max(...ras) - raMin || 1;
  const decMin = Math.min(...decs), decSpan = Math.max(...decs) - decMin || 1;
  // fit into a centered box, uniform scale (RA increases to the LEFT on the sky)
  const BOX_W = 168, BOX_H = 118, CX = 200, CY = 192;
  const k = Math.min(BOX_W / raSpan, BOX_H / decSpan);
  const minMag = Math.min(...sign.stars.map((s) => s.mag));
  const pts: Pt[] = sign.stars.map((s, i) => {
    const ra = ras[i];
    return {
      id: s.id,
      x: CX + (raSpan / 2 - (ra - raMin)) * k,
      y: CY + (decSpan / 2 - (s.dec - decMin)) * k,
      r: Math.max(1.2, 3.4 - s.mag * 0.55),
      faint: s.mag > 3.6,
      heart: s.mag === minMag,
    };
  });
  const idx = new Map(pts.map((p, i) => [p.id, i] as const));
  const lines: [number, number][] = [];
  for (const [a, b] of sign.lines ?? []) {
    const ia = idx.get(a), ib = idx.get(b);
    if (ia != null && ib != null) lines.push([ia, ib]);
  }
  return { pts, lines };
}

export default function GeniusDial({ signKey, named = false }: { signKey?: string | null; named?: boolean }) {
  const [still, setStill] = useState(false);
  useEffect(() => { setStill(window.matchMedia("(prefers-reduced-motion: reduce)").matches); }, []);

  const fig = (signKey && realFigure(signKey)) || ABSTRACT;
  const ticks = Array.from({ length: 72 }, (_, i) => {
    const ang = (i * 5 * Math.PI) / 180, q = i % 18 === 0;
    const r1 = 150, r2 = 150 - (q ? 15 : 8);
    return (
      <line key={i} className={`instr-tick${q ? " q" : ""}`} strokeWidth={q ? 1.1 : 0.8}
        x1={+(200 + Math.cos(ang) * r1).toFixed(1)} y1={+(200 + Math.sin(ang) * r1).toFixed(1)}
        x2={+(200 + Math.cos(ang) * r2).toFixed(1)} y2={+(200 + Math.sin(ang) * r2).toFixed(1)} />
    );
  });

  // the ouroboros body — a ring that eats its tail
  const body = (
    <>
      <circle className="instr-marker" r="8" />
      <path className="instr-marker" d="M5.5 -5.5 l4.5 -1.6 -1 4.6" strokeWidth="1.2" />
    </>
  );

  return (
    <svg className="instrument" viewBox="0 0 400 400" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      <circle className="instr-dial" cx="200" cy="200" r="150" strokeWidth="1" strokeOpacity=".32" />
      <circle className="instr-dial" cx="200" cy="200" r="120" strokeWidth="0.7" strokeOpacity=".09" />
      {ticks}
      {fig.lines.map(([a, b], i) => (
        <line key={`l${i}`} className="ic-line" style={{ animationDelay: `${300 + i * 150}ms` }}
          x1={+fig.pts[a].x.toFixed(1)} y1={+fig.pts[a].y.toFixed(1)} x2={+fig.pts[b].x.toFixed(1)} y2={+fig.pts[b].y.toFixed(1)} />
      ))}
      {fig.pts.map((p, i) => (
        <circle key={`s${i}`}
          className={`ic-star${p.faint ? " faint" : ""}${named && p.heart ? " named" : ""}`}
          cx={+p.x.toFixed(1)} cy={+p.y.toFixed(1)} r={+(named && p.heart ? p.r + 0.7 : p.r).toFixed(1)}
          style={{ animationDelay: `${i * 80}ms` }} />
      ))}
      <path className="instr-orbit" d={ORBIT} strokeWidth="1" />
      {still ? (
        <g transform="translate(322.4 150.6)">{body}</g>
      ) : (
        <g>
          {body}
          <animateMotion dur="120s" repeatCount="indefinite" rotate="0" path={ORBIT} />
        </g>
      )}
    </svg>
  );
}
