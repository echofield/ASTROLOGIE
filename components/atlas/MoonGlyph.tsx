import type { ReactNode } from "react";

// The true moon — the disc carries the actual illuminated fraction, computed
// from the Sun–Moon elongation, never an icon from an eight-phase set. The
// unlit side is shadow laid over the gold limb (the house line-work register:
// gold as a line; darkness is never added light). Shared by the Calendar
// nodes and the landing medallion.
function Wrap({ R, children }: { R: number; children: ReactNode }) {
  return <svg className="cal-emblem-svg" viewBox={`0 0 ${2 * R} ${2 * R}`} aria-hidden="true">{children}</svg>;
}

export default function MoonGlyph({ illum, waxing, R }: { illum: number; waxing: boolean; R: number }) {
  const c = R, r = R - 1.4;
  const limb = <circle className="cal-line" cx={c} cy={c} r={+r.toFixed(1)} />;
  if (illum >= 0.97) return <Wrap R={R}>{limb}</Wrap>;
  const rx = Math.abs(r * (1 - 2 * illum));
  let dark: ReactNode;
  if (illum <= 0.03) dark = <circle cx={c} cy={c} r={+r.toFixed(1)} fill="var(--moon-dark)" />;
  else {
    const sweep = waxing ? 0 : 1;
    const ts = waxing ? (illum < 0.5 ? 0 : 1) : (illum < 0.5 ? 1 : 0);
    dark = <path fill="var(--moon-dark)" d={`M${c},${(c - r).toFixed(1)} A${r.toFixed(1)},${r.toFixed(1)} 0 0 ${sweep} ${c},${(c + r).toFixed(1)} A${rx.toFixed(1)},${r.toFixed(1)} 0 0 ${ts} ${c},${(c - r).toFixed(1)} Z`} />;
  }
  return <Wrap R={R}>{dark}{limb}</Wrap>;
}
