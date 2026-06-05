"use client";

import { useEffect, useMemo, useState, type RefObject } from "react";

/** Slow chart rotation (the living sphere). Night only. */
export function useSlowRotation(active: boolean): number {
  const [rot, setRot] = useState(0);
  useEffect(() => {
    if (!active) return;
    let raf = 0;
    const t0 = performance.now();
    const loop = (t: number) => { setRot((((t - t0) / 120000) * 360) % 360); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [active]);
  return rot;
}

/** Pointer parallax → normalized [-1,1] offsets for layered depth. */
export function useParallax(ref: RefObject<HTMLElement | null>, enabled: boolean) {
  const [p, setP] = useState({ x: 0, y: 0 });
  useEffect(() => {
    if (!enabled) return;
    const el = ref.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      setP({ x: ((e.clientX - r.left) / r.width - 0.5) * 2, y: ((e.clientY - r.top) / r.height - 0.5) * 2 });
    };
    const onLeave = () => setP({ x: 0, y: 0 });
    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => { el.removeEventListener("mousemove", onMove); el.removeEventListener("mouseleave", onLeave); };
  }, [enabled, ref]);
  return p;
}

/** Responsive breakpoint. Returns false during SSR/first paint, then resolves. */
export function useMediaQuery(query: string): boolean {
  const [match, setMatch] = useState(false);
  useEffect(() => {
    const m = window.matchMedia(query);
    const on = () => setMatch(m.matches);
    on();
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, [query]);
  return match;
}

/** A clock the user can fast-forward, so the Moon visibly advances. */
export function useSkyClock() {
  const [offsetDays, setOffsetDays] = useState(0);
  const date = useMemo(() => new Date(Date.now() + offsetDays * 86400000), [offsetDays]);
  return { date, offsetDays, setOffsetDays };
}
