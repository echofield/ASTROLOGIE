"use client";

import { useEffect, useRef } from "react";

// The persistent world — #sky starfield canvas + .grain overlay, on every surface.
// Ported verbatim from the export's sky() (AstroLab Home.html / astrolab.js).
export default function AtlasChrome() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const x = c.getContext("2d");
    if (!x) return;
    let s: { x: number; y: number; r: number; base: number; vx: number; vy: number; ph: number; gold: boolean }[] = [];
    let W = 0, H = 0, raf = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    function size() {
      W = c!.width = window.innerWidth * dpr;
      H = c!.height = window.innerHeight * dpr;
      c!.style.width = window.innerWidth + "px";
      c!.style.height = window.innerHeight + "px";
      // phones don't need the desktop floor of 170 stars — the density formula already scales
      const floor = window.innerWidth < 760 ? 90 : 170;
      const n = Math.min(300, Math.max(floor, Math.round((window.innerWidth * window.innerHeight) / 7000)));
      s = [];
      for (let i = 0; i < n; i++) {
        const a = Math.random() * 6.283, sp = (Math.random() * 0.03 + 0.012) * dpr;
        s.push({ x: Math.random() * W, y: Math.random() * H, r: (Math.random() * 0.9 + 0.25) * dpr, base: Math.random() * 0.32 + 0.08, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, ph: Math.random() * 6.283, gold: Math.random() < 0.08 });
      }
    }
    function frame(t: number) {
      x!.clearRect(0, 0, W, H);
      for (const p of s) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x += W; else if (p.x > W) p.x -= W;
        if (p.y < 0) p.y += H; else if (p.y > H) p.y -= H;
        const a = p.base * (0.55 + 0.45 * (0.5 + 0.5 * Math.sin((t / 4000) * 6.283 + p.ph)));
        x!.beginPath(); x!.arc(p.x, p.y, p.r, 0, 6.283);
        x!.fillStyle = p.gold ? "rgba(226,200,132," + a + ")" : "rgba(214,222,240," + a + ")";
        x!.fill();
      }
      raf = requestAnimationFrame(frame);
    }
    size();
    window.addEventListener("resize", size);
    // reduced-motion: one still frame of sky, no loop; otherwise animate, but rest while the tab is hidden
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (still) {
      frame(0);
      cancelAnimationFrame(raf);
    } else {
      raf = requestAnimationFrame(frame);
    }
    const vis = () => {
      if (still) return;
      cancelAnimationFrame(raf);
      if (!document.hidden) raf = requestAnimationFrame(frame);
    };
    document.addEventListener("visibilitychange", vis);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", size); document.removeEventListener("visibilitychange", vis); };
  }, []);
  return (<><canvas id="sky" ref={ref} /><div className="grain" /></>);
}
