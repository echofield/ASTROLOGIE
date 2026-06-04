"use client";

// Shared SVG primitives for the engraved sky instruments.

/** Fixed zodiac: 0° Aries at the left (west), longitude increasing CCW. */
export function lonXY(L: number, r: number, cx = 200, cy = 200): [number, number] {
  const a = ((180 + L) * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy - r * Math.sin(a)];
}

export function GlyphText({
  ch, x, y, size, fill, opacity = 1, shadow,
}: {
  ch: string; x: number; y: number; size: number; fill: string; opacity?: number; shadow?: number;
}) {
  return (
    <text
      x={x} y={y} textAnchor="middle" dominantBaseline="central"
      fontFamily="var(--font-glyph)" fontSize={size} fill={fill} opacity={opacity}
      style={shadow ? { filter: `drop-shadow(0 0 ${shadow}px ${fill})` } : undefined}
    >
      {ch}
    </text>
  );
}
