"use client";

import { Fragment } from "react";
import type { Contact, Longitude, PlanetName } from "@/lib/types";
import { PLANETS, PLANET_GLYPH, ZODIAC, norm } from "@/lib/sky";
import { rgbOf, rgbaOf, type PaletteFrame } from "@/lib/palette";

const CX = 200;
const CY = 200;

function pt(L: number, r: number): [number, number] {
  const a = ((180 + L) * Math.PI) / 180;
  return [CX + r * Math.cos(a), CY - r * Math.sin(a)];
}

interface Props {
  natal: Record<PlanetName, Longitude>;
  transit: Record<PlanetName, Longitude>; // at current scrub time
  moonStart: Longitude; // Moon at offset 0 (for the trail)
  anchor: Longitude;
  contact: Contact;
  colors: PaletteFrame["colors"];
}

export default function AstrolabeWheel({
  natal,
  transit,
  moonStart,
  anchor,
  contact,
  colors,
}: Props) {
  const ink = rgbOf(colors.ink);
  const soft = rgbaOf(colors.ink, 0.5);
  const acc = rgbOf(colors.accent);
  const pl = rgbOf(colors.planet);
  const harm = rgbOf(colors.harm);
  const faint = rgbaOf(colors.ink, 0.3);
  const ringc = rgbaOf(colors.ink, 0.5);

  const m1 = transit.Moon;
  const open = contact.open;
  const forming = contact.forming;

  // degree ticks
  const ticks = [];
  for (let d = 0; d < 360; d += 5) {
    const len = d % 30 === 0 ? 11 : d % 10 === 0 ? 7 : 4;
    const [x1, y1] = pt(d, 191 - len);
    const [x2, y2] = pt(d, 191);
    ticks.push(
      <line
        key={`t${d}`}
        x1={x1} y1={y1} x2={x2} y2={y2}
        stroke={d % 30 === 0 ? ringc : faint}
        strokeWidth={d % 30 === 0 ? 1 : 0.6}
      />,
    );
  }

  // sign glyphs
  const signs = ZODIAC.map((g, i) => {
    const [gx, gy] = pt(i * 30 + 15, 175);
    return (
      <text key={`s${i}`} x={gx} y={gy + 5} textAnchor="middle" fontSize={14} fill={soft}>
        {g}
      </text>
    );
  });

  // moon trail (the sky moving), from start to current
  const delta = norm(m1 - moonStart);
  let trail = null;
  if (delta > 0.3) {
    const [sx, sy] = pt(moonStart, 150);
    const [ex, ey] = pt(m1, 150);
    const big = delta > 180 ? 1 : 0;
    trail = (
      <path
        d={`M ${sx} ${sy} A 150 150 0 ${big} 0 ${ex} ${ey}`}
        fill="none" stroke={acc} strokeWidth={2} opacity={0.32} strokeLinecap="round"
      />
    );
  }

  // North Star beacon + ray to centre
  const [nsx, nsy] = pt(anchor, 191);
  const [nix, niy] = pt(anchor, 100);
  const [bx, by] = pt(anchor, 191);

  // line Moon -> North Star (the story)
  const [mx, my] = pt(m1, 150);

  // natal planets (quiet, inner ring)
  const natalEls = PLANETS.map((p) => {
    const L = natal[p];
    const [x, y] = pt(L, 132);
    const [tx, ty] = pt(L, 124);
    const [ix, iy] = pt(L, 116);
    return (
      <Fragment key={`n${p}`}>
        <line x1={tx} y1={ty} x2={ix} y2={iy} stroke={faint} strokeWidth={0.6} />
        <circle cx={x} cy={y - 4} r={2} fill={pl} opacity={0.8} />
        <text x={x} y={y + 5} textAnchor="middle" fontSize={13} fill={pl} opacity={0.85}>
          {PLANET_GLYPH[p]}
        </text>
      </Fragment>
    );
  });

  // transit planets (live, outer ring)
  const transitEls = PLANETS.map((p) => {
    const L = transit[p];
    const [x, y] = pt(L, 150);
    const isMoon = p === "Moon";
    const [tx, ty] = pt(L, 142);
    const [ix, iy] = pt(L, 134);
    return (
      <Fragment key={`tr${p}`}>
        <line x1={tx} y1={ty} x2={ix} y2={iy} stroke={rgbaOf(colors.accent, 0.5)} strokeWidth={0.7} />
        <text
          x={x} y={y + 5} textAnchor="middle"
          fontSize={isMoon ? 17 : 14} fill={acc}
          filter={isMoon && open ? `drop-shadow(0 0 7px ${acc})` : undefined}
        >
          {PLANET_GLYPH[p]}
        </text>
      </Fragment>
    );
  });

  return (
    <svg viewBox="0 0 400 400" role="img" aria-label="The living sky">
      {/* rims */}
      <circle cx={CX} cy={CY} r={191} fill="none" stroke={acc} strokeWidth={0.8} opacity={0.7} />
      <circle cx={CX} cy={CY} r={160} fill="none" stroke={faint} strokeWidth={0.8} />
      <circle cx={CX} cy={CY} r={132} fill="none" stroke={faint} strokeWidth={0.6} />
      <circle cx={CX} cy={CY} r={100} fill={rgbaOf(colors.accent, 0.04)} stroke={faint} strokeWidth={0.6} />

      {ticks}
      {signs}
      {trail}

      {/* North Star ray */}
      <line
        x1={nix} y1={niy} x2={nsx} y2={nsy}
        stroke={acc} strokeWidth={open ? 2 : 0.8} opacity={open ? 0.9 : 0.35}
        strokeDasharray={open ? undefined : "2 3"}
      />
      {/* line Moon -> North Star */}
      <line
        x1={mx} y1={my} x2={nix} y2={niy}
        stroke={open ? acc : forming ? harm : faint}
        strokeWidth={open ? 1.6 : 1}
        opacity={open ? 0.9 : forming ? 0.6 : 0.3}
      />

      {natalEls}
      {transitEls}

      {/* beacon on top */}
      <text
        x={bx} y={by + 6} textAnchor="middle"
        fontSize={open ? 22 : 17} fill={acc}
        filter={open ? `drop-shadow(0 0 6px ${acc})` : undefined}
      >
        ✶
      </text>
    </svg>
  );
}
