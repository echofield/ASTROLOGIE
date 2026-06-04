"use client";

import { useId } from "react";
import type { Palette } from "@/lib/theme";
import {
  SIGN_GLYPH, SIGN_NAME, SIGN_KEY, PLANETS, norm360, type LonMap,
} from "@/lib/chart";
import { lonXY, GlyphText } from "./primitives";
import ConstellationFig from "./ConstellationFig";

interface Props {
  pal: Palette;
  size?: number;
  bodies?: LonMap;
  asc?: number | null;
  houses?: boolean;
  highlight?: string | null;
  sealedLon?: number | null;
  showArc?: boolean;
  rotation?: number;
  hoverSign?: number | null;
  onSign?: ((i: number | null) => void) | null;
}

export default function SkyWheel({
  pal, size = 300, bodies = {}, asc = null, houses = false,
  highlight = null, sealedLon = null, showArc = false, rotation = 0,
  hoverSign = null, onSign = null,
}: Props) {
  const uid = useId().replace(/:/g, "");
  const night = pal.theme === "night";
  const rOuter = 192, rZodInner = 158, rGlyph = 175, rHouse = 128, rCore = 128;
  const line = pal.line, brass = pal.brass;

  const ticks = [];
  for (let d = 0; d < 360; d += 1) {
    const big = d % 30 === 0, mid = d % 10 === 0, sm = d % 5 === 0;
    const len = big ? 10 : mid ? 6 : sm ? 4 : 2;
    const [x1, y1] = lonXY(d, rZodInner), [x2, y2] = lonXY(d, rZodInner - len);
    ticks.push(<line key={`t${d}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke={line}
      strokeWidth={big ? 0.9 : 0.45} opacity={big ? 0.75 : sm ? 0.5 : 0.28} />);
  }

  const signs = [];
  for (let i = 0; i < 12; i++) {
    const [bx1, by1] = lonXY(i * 30, rOuter), [bx2, by2] = lonXY(i * 30, rZodInner);
    signs.push(<line key={`b${i}`} x1={bx1} y1={by1} x2={bx2} y2={by2} stroke={line} strokeWidth={0.7} opacity={0.55} />);
    const [gx, gy] = lonXY(i * 30 + 15, rGlyph);
    const hot = hoverSign === i;
    signs.push(<GlyphText key={`g${i}`} ch={SIGN_GLYPH[i]} x={gx} y={gy} size={hot ? 17 : 14.5}
      fill={hot ? pal.brassHi : brass} opacity={hot ? 1 : 0.92} shadow={night ? (hot ? 5 : 0) : 0} />);
  }

  const houseEls = [];
  if (houses && asc != null) {
    for (let h = 0; h < 12; h++) {
      const cusp = asc + h * 30;
      const [x1, y1] = lonXY(cusp, rZodInner), [x2, y2] = lonXY(cusp, rCore);
      houseEls.push(<line key={`h${h}`} x1={x1} y1={y1} x2={x2} y2={y2}
        stroke={line} strokeWidth={h % 3 === 0 ? 0.9 : 0.5} opacity={h % 3 === 0 ? 0.6 : 0.32} />);
      const [nx, ny] = lonXY(cusp + 15, rHouse + 13);
      houseEls.push(<text key={`hn${h}`} x={nx} y={ny + 3} textAnchor="middle" fontFamily="var(--font-num)"
        fontSize="8" fill={pal.inkSoft} opacity={0.6}>{h + 1}</text>);
    }
  }

  let ascEls = null;
  if (asc != null) {
    const [ax, ay] = lonXY(asc, rOuter), [ax2, ay2] = lonXY(asc + 180, rOuter);
    ascEls = (
      <g>
        <line x1={ax} y1={ay} x2={ax2} y2={ay2} stroke={brass} strokeWidth={0.6} opacity={0.4} strokeDasharray="1 4" />
        <text x={ax - 9} y={ay + 3} textAnchor="end" fontFamily="var(--font-num)" fontSize="8"
          fill={brass} opacity={0.85} letterSpacing="1">ASC</text>
      </g>
    );
  }

  // planet layout with light de-cluttering
  const list = PLANETS.filter((p) => bodies[p.key] != null)
    .map((p) => ({ ...p, lon: norm360(bodies[p.key]), r: 116 }))
    .sort((a, b) => a.lon - b.lon);
  let last = -99, lvl = 0;
  list.forEach((p) => { if (p.lon - last < 8) lvl = (lvl + 1) % 3; else lvl = 0; p.r = 116 - lvl * 15; last = p.lon; });

  const planetEls = list.map((p) => {
    const [x, y] = lonXY(p.lon, p.r);
    const [lx, ly] = lonXY(p.lon, rZodInner - 12);
    const hot = highlight === p.key;
    const col = hot ? pal.accent : (night ? pal.silver : pal.ink);
    return (
      <g key={p.key}>
        <line x1={x} y1={y} x2={lx} y2={ly} stroke={line} strokeWidth={0.4} opacity={0.35} />
        {hot && (
          <circle cx={x} cy={y} r={12} fill={col} opacity={night ? 0.22 : 0.12}
            className={p.key === "moon" ? "astro-pulse" : undefined} style={{ filter: "blur(3px)" }} />
        )}
        <circle cx={x} cy={y} r={1.5} fill={col} opacity={0.9} />
        <GlyphText ch={p.glyph} x={x} y={y - 9} size={hot ? 13 : 11} fill={col}
          opacity={hot ? 1 : 0.85} shadow={night && hot ? 5 : 0} />
      </g>
    );
  });

  let arcEls = null;
  if (sealedLon != null) {
    const [sx, sy] = lonXY(sealedLon, rZodInner - 2);
    const star = (
      <g transform={`translate(${sx} ${sy})`}>
        <path d="M0 -7 L1.9 -1.9 L7 0 L1.9 1.9 L0 7 L-1.9 1.9 L-7 0 L-1.9 -1.9 Z"
          fill={pal.accent} style={{ filter: night ? `drop-shadow(0 0 4px ${pal.accent})` : "none" }} />
      </g>
    );
    if (showArc && bodies.moon != null) {
      const m = norm360(bodies.moon), gap = norm360(sealedLon - m);
      const rA = rHouse - 6;
      const [mx, my] = lonXY(m, rA), [ex, ey] = lonXY(sealedLon, rA);
      const large = gap > 180 ? 1 : 0;
      arcEls = (
        <g>
          <path d={`M ${mx} ${my} A ${rA} ${rA} 0 ${large} 0 ${ex} ${ey}`} fill="none"
            stroke={pal.accent} strokeWidth={1.4} opacity={0.7} strokeLinecap="round" />
          {star}
        </g>
      );
    } else {
      arcEls = star;
    }
  }

  const annulus = [];
  for (let i = 0; i < 36; i++) {
    const [x, y] = lonXY(i * 10 + 5, rOuter + 7);
    annulus.push(<circle key={`a${i}`} cx={x} cy={y} r={i % 3 === 0 ? 0.9 : 0.5} fill={brass} opacity={0.4} />);
  }

  const wedges = onSign ? Array.from({ length: 12 }, (_, i) => {
    const [p1x, p1y] = lonXY(i * 30, rOuter), [p2x, p2y] = lonXY((i + 1) * 30, rOuter);
    return (
      <path key={`w${i}`} d={`M 200 200 L ${p1x} ${p1y} A ${rOuter} ${rOuter} 0 0 0 ${p2x} ${p2y} Z`}
        fill="transparent" style={{ cursor: "pointer" }}
        onMouseEnter={() => onSign(i)} onMouseLeave={() => onSign(null)}
        onClick={() => onSign(hoverSign === i ? null : i)} />
    );
  }) : null;

  return (
    <svg viewBox="0 0 400 400" width={size} height={size} style={{ display: "block", overflow: "visible" }}>
      <defs>
        <radialGradient id={`core${uid}`} cx="50%" cy="46%" r="58%">
          <stop offset="0%" stopColor={pal.coreHi} />
          <stop offset="100%" stopColor={pal.core} />
        </radialGradient>
      </defs>

      {night && <circle cx="200" cy="200" r="198" fill={pal.coreHi} opacity="0.4" style={{ filter: "blur(30px)" }} />}
      <circle cx="200" cy="200" r={rCore} fill={`url(#core${uid})`} />

      <g transform={`rotate(${rotation} 200 200)`} style={{ opacity: night ? 1 : 0.7 }}>{annulus}</g>

      <circle cx="200" cy="200" r={rOuter} fill="none" stroke={brass} strokeWidth={night ? 1 : 0.9} opacity="0.85" />
      <circle cx="200" cy="200" r={rZodInner} fill="none" stroke={line} strokeWidth="0.7" opacity="0.6" />
      <circle cx="200" cy="200" r={rCore} fill="none" stroke={line} strokeWidth="0.5" opacity="0.45" />

      {ticks}
      {signs}
      {houseEls}
      {ascEls}

      {hoverSign != null && (
        <g style={{ opacity: 0.9 }}>
          <g transform="translate(118 118)">
            <ConstellationFig k={SIGN_KEY[hoverSign]} pal={pal} w={164} h={164} dotMax={2.2} />
          </g>
          <text x="200" y="300" textAnchor="middle" fontFamily="var(--font-text)" fontSize="11"
            letterSpacing="3" fill={pal.inkSoft} style={{ textTransform: "uppercase" }}>{SIGN_NAME[hoverSign]}</text>
        </g>
      )}

      {arcEls}
      {planetEls}
      {wedges}
    </svg>
  );
}
