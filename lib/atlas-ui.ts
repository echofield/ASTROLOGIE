// The gold/ivory register — ported from The AstroLab.html (the design handoff).
// Used by the customer-facing surfaces: the unified header, the home wheel, the
// Offering, and the reading reveal. The deeper instrument internals stay on the
// existing night palette (lib/theme.ts) for now.
export const GOLD = {
  ink: "#05080f",
  bg: "radial-gradient(150% 100% at 50% -25%, #0f1a35 0%, #0a1124 34%, #070b18 64%, #05080f 100%)",
  gold: "#c2a25f",
  goldBright: "#e3c884",
  goldDeep: "#8a7140",
  ivory: "#ece4d2",
  ivoryDim: "#b6b1a3",
  slate: "#6f7894",
  slateDim: "#4a5270",
  rule: "rgba(194,162,95,.18)",
  ruleSoft: "rgba(194,162,95,.09)",
  serif: "var(--font-display), 'Cormorant Garamond', Georgia, serif",
  body: "var(--font-body), 'EB Garamond', Georgia, serif",
  mono: "var(--font-mono), 'IBM Plex Mono', ui-monospace, monospace",
  ease: "cubic-bezier(.165,.84,.44,1)",
} as const;
