// AstroLab — Motion Language (ported in spirit from ARCHÉ's motion.ts).
// Single source of truth for durations + easings. No raw numbers in components:
// reach for a named speed/ease instead. Reduced-motion is honored everywhere.

export type Speed = "instant" | "brisk" | "measured" | "contemplative" | "ambient";
export type Ease = "appear" | "transition" | "dismiss" | "linear";

export const DUR: Record<Speed, number> = {
  instant: 90,
  brisk: 200,
  measured: 400,
  contemplative: 750,
  ambient: 60000,
};

export const EASE: Record<Ease, string> = {
  appear: "cubic-bezier(0, 0, 0.2, 1)",
  transition: "cubic-bezier(0.4, 0, 0.2, 1)",
  dismiss: "cubic-bezier(0.4, 0, 1, 1)",
  linear: "linear",
};

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

/** Duration in ms for a named speed; collapses toward instant under reduced-motion. */
export function ms(s: Speed): number {
  return prefersReducedMotion() ? Math.min(DUR[s], DUR.instant) : DUR[s];
}

/** Duration in seconds (for GSAP and other s-based APIs). */
export function sec(s: Speed): number {
  return ms(s) / 1000;
}

/** Build a CSS transition string: transition(transition("opacity","measured","appear")). */
export function transition(prop: string, s: Speed = "measured", e: Ease = "transition", delayMs = 0): string {
  return `${prop} ${ms(s)}ms ${EASE[e]}${delayMs ? ` ${delayMs}ms` : ""}`;
}
