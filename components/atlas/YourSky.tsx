"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { lonOf, SIGN_NAMES, ZODIAC } from "@/lib/sky";

// U+FE0E forces TEXT presentation — without it Windows renders the glyph as a
// violet emoji square, which kills the register (the design carried it; keep it)
const glyphText = (g: string) => g + "︎";

// YOUR SKY — the front door. Ported from design/Your Sky.html (canonical set).
// The star-sphere resolved to a real datum: one gesture turns the universe yours.
// The design's embedded sun-math is replaced at the wire points by lib/sky —
// one engine, one sky (HANDOFF rule overruled with final authority: the engine
// that draws paid readings is the engine that answers the front door).
const STAR_NAMES = ["Sirius", "Canopus", "Arcturus", "Vega", "Capella", "Rigel", "Procyon", "Betelgeuse", "Altair", "Aldebaran", "Antares", "Spica", "Pollux", "Fomalhaut", "Deneb", "Regulus", "Castor", "Bellatrix", "Mizar", "Alphard", "Polaris", "Algol", "Markab", "Alnilam", "Hadar", "Mirfak", "Dubhe", "Alkaid"];

const sunLonAt = (d: Date) => lonOf("Sun", d);
const mod360 = (x: number) => ((x % 360) + 360) % 360;

interface Result { sign: string; glyph: string; deg: number; d: number; m: number; y: number; hh: number; mm: number; hourBlank: boolean }

export default function YourSky() {
  const cvRef = useRef<HTMLCanvasElement>(null);
  const revealRef = useRef<(lon: number) => void>(() => {});
  const resetRef = useRef<() => void>(() => {});
  const [now, setNow] = useState<{ t: string; s: string } | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [resultIn, setResultIn] = useState(false);
  const [vals, setVals] = useState({ d: "", m: "", y: "", h: "", mi: "" });
  const segRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

  // the live clock — client Date each second; the sign readout from the one engine
  useEffect(() => {
    const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const pad = (n: number) => String(n).padStart(2, "0");
    const tick = () => {
      const n = new Date();
      setNow({
        t: `${pad(n.getDate())} ${MONTHS[n.getMonth()]} ${n.getFullYear()} · ${pad(n.getHours())}:${pad(n.getMinutes())}:${pad(n.getSeconds())}`,
        s: `Sun in ${SIGN_NAMES[Math.floor(mod360(sunLonAt(n)) / 30)]}`,
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // the sphere — ported verbatim from the design (rAF, drag, resolve), engine swapped
  useEffect(() => {
    const cv = cvRef.current;
    if (!cv) return;
    const g = cv.getContext("2d");
    if (!g) return;
    const reduce = matchMedia("(prefers-reduced-motion:reduce)").matches;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    let W = 0, H = 0, CX = 0, CY = 0, R = 0;
    const smoother = (p: number) => (p <= 0 ? 0 : p >= 1 ? 1 : p * p * p * (p * (6 * p - 15) + 10));
    const D2R = Math.PI / 180;

    const t23 = 23.4 * D2R;
    const ECL_U: [number, number, number] = [1, 0, 0];
    const ECL_V: [number, number, number] = [0, Math.sin(t23), Math.cos(t23)];

    interface Bg { x: number; y: number; z: number; r: number; base: number; vx: number; vy: number; ph: number; tw: number; gold: boolean }
    const LAYERS = [{ dir: [1, 0.1], spd: 0.1, n: 0.4, gold: 0.05 }, { dir: [-0.85, 0.22], spd: 0.16, n: 0.34, gold: 0.06 }, { dir: [0.15, -1], spd: 0.12, n: 0.26, gold: 0.1 }];
    let bg: Bg[] = [];
    function buildBg() {
      bg = [];
      const total = Math.min(560, Math.max(300, Math.round((W * H) / 3400)));
      LAYERS.forEach((L) => {
        const c = Math.round(total * L.n);
        for (let i = 0; i < c; i++) {
          const z = 0.3 + Math.random() * 0.7;
          bg.push({ x: Math.random() * W, y: Math.random() * H, z, r: 0.3 + z * 1.2, base: 0.08 + z * 0.34, vx: L.dir[0] * L.spd * z, vy: L.dir[1] * L.spd * z, ph: Math.random() * 6.283, tw: 0.5 + Math.random() * 1.7, gold: Math.random() < L.gold });
        }
      });
    }

    interface Dot { x: number; y: number; z: number; s: number; gold: boolean; name: string | null; their: boolean; prox: number }
    let dots: Dot[] = [];
    function buildSphere() {
      dots = [];
      const N = Math.min(620, Math.max(380, Math.round(W / 2.6)));
      const golden = Math.PI * (3 - Math.sqrt(5));
      let ni = 0;
      for (let i = 0; i < N; i++) {
        const y = 1 - (i / (N - 1)) * 2, rr = Math.sqrt(Math.max(0, 1 - y * y)), th = i * golden, gold = Math.random() < 0.06;
        const named = gold && Math.random() < 0.5 && ni < STAR_NAMES.length;
        dots.push({ x: Math.cos(th) * rr, y, z: Math.sin(th) * rr, s: gold ? 1.5 : 0.6 + Math.random() * 0.8, gold, name: named ? STAR_NAMES[ni++] : null, their: false, prox: 0 });
      }
    }

    const RINGS = [
      { u: [1, 0, 0] as const, v: [0, 0, 1] as const, a: 0.1 },
      { u: [0, 1, 0] as const, v: [1, 0, 0] as const, a: 0.08 },
      { u: [0, 1, 0] as const, v: [Math.cos(52 * D2R), 0, Math.sin(52 * D2R)] as const, a: 0.07 },
    ];
    const SEG = 96;

    let yaw = 0.6, pitch = -0.32, vYaw = 0, vPitch = 0;
    let revealed = false, resolving = false, resolve = 0, resolveT0 = 0, yaw0 = 0, pitch0 = 0, tYaw = 0, tPitch = 0;
    let eclLit = 0;
    const AUTO = reduce ? 0 : 0.00006;
    const rot = (p: { x: number; y: number; z: number }): [number, number, number] => {
      const cx = Math.cos(yaw), sx = Math.sin(yaw);
      const x = p.x * cx - p.z * sx, z = p.x * sx + p.z * cx, y = p.y;
      const cy = Math.cos(pitch), sy = Math.sin(pitch);
      return [x, y * cy - z * sy, y * sy + z * cy];
    };
    const CAM = 3.0;
    const project = (v: [number, number, number]): [number, number, number, number] => {
      const persp = CAM / (CAM - v[2]);
      return [CX + v[0] * R * persp, CY + v[1] * R * persp, v[2], persp];
    };
    const vec = (u: readonly number[], v: readonly number[], ang: number) => {
      const c = Math.cos(ang), s = Math.sin(ang);
      return { x: u[0] * c + v[0] * s, y: u[1] * c + v[1] * s, z: u[2] * c + v[2] * s };
    };

    let sunNow: { x: number; y: number; z: number } | null = null;
    let sun: { x: number; y: number; z: number } | null = null;
    const sunVecForLon = (lon: number) => vec(ECL_U, ECL_V, lon * D2R);
    sunNow = { ...sunVecForLon(sunLonAt(new Date())) };

    function reveal(lon: number) {
      const b = sunVecForLon(lon);
      sun = { x: b.x, y: b.y, z: b.z };
      for (const d of dots) {
        const dp = d.x * b.x + d.y * b.y + d.z * b.z;
        d.their = dp > Math.cos(34 * D2R);
        d.prox = Math.max(0, (dp - Math.cos(42 * D2R)) / (1 - Math.cos(42 * D2R)));
      }
      yaw0 = yaw; pitch0 = pitch;
      const r = Math.hypot(b.x, b.z);
      tYaw = Math.atan2(b.x, b.z); tPitch = Math.atan2(b.y, r);
      revealed = true; resolving = true; resolveT0 = performance.now();
    }
    revealRef.current = reveal;
    resetRef.current = () => {
      sun = null; resolving = false; revealed = false; resolve = 0; eclLit = 0;
      for (const d of dots) { d.their = false; d.prox = 0; }
    };

    let dragging = false, lx = 0, ly = 0, mx = -1, my = -1;
    let hoverDot: Dot | null = null;
    const ptr = { tx: 0, ty: 0, x: 0, y: 0 };
    const onDown = (e: PointerEvent) => { dragging = true; lx = e.clientX; ly = e.clientY; cv.classList.add("drag"); cv.setPointerCapture(e.pointerId); resolving = false; };
    const onMove = (e: PointerEvent) => {
      mx = e.clientX; my = e.clientY;
      if (dragging) {
        const dx = e.clientX - lx, dy = e.clientY - ly; lx = e.clientX; ly = e.clientY;
        yaw += dx * 0.006; pitch = Math.max(-1.3, Math.min(1.3, pitch + dy * 0.006));
        vYaw = dx * 0.00035; vPitch = dy * 0.00035; hoverDot = null; return;
      }
      ptr.tx = e.clientX / innerWidth - 0.5; ptr.ty = e.clientY / innerHeight - 0.5;
      let best: Dot | null = null, bd = 15;
      for (const d of dots) {
        if (!d.name) continue;
        const pr = project(rot(d));
        if (pr[2] < 0.08) continue;
        const dist = Math.hypot(pr[0] - mx, pr[1] - my);
        if (dist < bd) { bd = dist; best = d; }
      }
      hoverDot = best;
    };
    const onLeave = () => { hoverDot = null; mx = -1; my = -1; };
    const rel = () => { dragging = false; cv.classList.remove("drag"); };
    cv.addEventListener("pointerdown", onDown);
    cv.addEventListener("pointermove", onMove);
    cv.addEventListener("pointerleave", onLeave);
    cv.addEventListener("pointerup", rel);
    cv.addEventListener("pointercancel", rel);

    function step(now: number, dt: number) {
      const f = Math.min(2.4, dt / 16.67);
      for (const p of bg) {
        if (!reduce) { p.x += p.vx * f; p.y += p.vy * f; }
        if (p.x < 0) p.x += W; else if (p.x > W) p.x -= W;
        if (p.y < 0) p.y += H; else if (p.y > H) p.y -= H;
      }
      ptr.x += (ptr.tx - ptr.x) * 0.05; ptr.y += (ptr.ty - ptr.y) * 0.05;
      if (resolving) {
        const p = Math.min(1, (now - resolveT0) / 3500), e = smoother(p); // the quiet settle
        let d = ((tYaw - yaw0 + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
        yaw = yaw0 + d * e; pitch = pitch0 + (tPitch - pitch0) * e; resolve = e; eclLit = e;
        if (p >= 1) resolving = false;
      } else if (revealed) {
        // the resolved sky keeps breathing — the slow drift resumes once settled
        if (!dragging) { vYaw *= Math.pow(0.92, f); vPitch *= Math.pow(0.9, f); yaw += (AUTO * 0.6 + vYaw) * dt; pitch += vPitch * dt; }
      } else if (!dragging) {
        yaw += (AUTO + vYaw) * dt; pitch += vPitch * dt; pitch += (-0.18 - pitch) * 0.004 * f;
        vYaw *= Math.pow(0.94, f); vPitch *= Math.pow(0.9, f);
      }
    }

    function draw(now: number) {
      g!.clearRect(0, 0, W, H);
      const bgFade = 1 - resolve * 0.4;
      for (const p of bg) {
        const tw = 0.62 + 0.38 * Math.sin((now / 1000) * p.tw + p.ph), a = p.base * tw * bgFade;
        const ox = p.x - ptr.x * 26 * p.z, oy = p.y - ptr.y * 26 * p.z;
        g!.beginPath(); g!.arc(ox, oy, p.r, 0, 6.283);
        g!.fillStyle = p.gold ? `rgba(226,200,132,${a.toFixed(3)})` : `rgba(206,216,238,${a.toFixed(3)})`; g!.fill();
      }
      const rr = R * 1.18, sg = g!.createRadialGradient(CX, CY, rr * 0.2, CX, CY, rr);
      sg.addColorStop(0, "rgba(4,7,16,.42)"); sg.addColorStop(0.7, "rgba(4,7,16,.18)"); sg.addColorStop(1, "rgba(4,7,16,0)");
      g!.fillStyle = sg; g!.beginPath(); g!.arc(CX, CY, rr, 0, 6.283); g!.fill();
      g!.lineCap = "round";
      for (const rg of RINGS) {
        let prev: [number, number, number, number] | null = null, pz = 0;
        for (let i = 0; i <= SEG; i++) {
          const pr = project(rot(vec(rg.u, rg.v, (i / SEG) * 6.283)));
          if (prev) {
            const front = ((pr[2] + pz) / 2 + 1) / 2;
            g!.lineWidth = 0.5 + front * 0.7;
            g!.strokeStyle = `rgba(150,165,205,${(rg.a * (0.22 + 0.78 * front)).toFixed(3)})`;
            g!.beginPath(); g!.moveTo(prev[0], prev[1]); g!.lineTo(pr[0], pr[1]); g!.stroke();
          }
          prev = pr; pz = pr[2];
        }
      }
      {
        let prev: [number, number, number, number] | null = null, pz = 0;
        const lit = 0.12 + eclLit * 0.62;
        for (let i = 0; i <= SEG; i++) {
          const pr = project(rot(vec(ECL_U, ECL_V, (i / SEG) * 6.283)));
          if (prev) {
            const front = ((pr[2] + pz) / 2 + 1) / 2;
            g!.lineWidth = (0.6 + front * 1.0) * (1 + eclLit * 0.5);
            g!.strokeStyle = `rgba(194,162,95,${(lit * (0.25 + 0.75 * front)).toFixed(3)})`;
            g!.beginPath(); g!.moveTo(prev[0], prev[1]); g!.lineTo(pr[0], pr[1]); g!.stroke();
          }
          prev = pr; pz = pr[2];
        }
      }
      if (resolve > 0.02) {
        const their = dots.filter((d) => d.their).map((d) => ({ d, pr: project(rot(d)) }));
        g!.lineWidth = 1;
        for (let i = 0; i < their.length; i++) for (let j = i + 1; j < their.length; j++) {
          const A = their[i], B = their[j];
          const dx = A.d.x - B.d.x, dy = A.d.y - B.d.y, dz = A.d.z - B.d.z, d3 = Math.sqrt(dx * dx + dy * dy + dz * dz);
          if (d3 < 0.5) {
            const front = ((A.pr[2] + B.pr[2]) / 2 + 1) / 2;
            const a = resolve * (1 - d3 / 0.5) * 0.3 * (0.3 + 0.7 * front);
            if (a < 0.01) continue;
            // the Atlas plate's line register: ivory-slate hairline, never a gold web
            g!.strokeStyle = `rgba(196,208,232,${a.toFixed(3)})`;
            g!.beginPath(); g!.moveTo(A.pr[0], A.pr[1]); g!.lineTo(B.pr[0], B.pr[1]); g!.stroke();
          }
        }
      }
      const proj = dots.map((d) => [project(rot(d)), d] as const).sort((a, b) => a[0][2] - b[0][2]);
      for (const [pr, d] of proj) {
        const front = (pr[2] + 1) / 2;
        let a = 0.12 + 0.88 * front;
        let size = d.s * pr[3] * (0.55 + 0.45 * front);
        const theirA = d.their ? 1 : 1 - resolve * 0.82;
        a *= theirA;
        const warm = d.their ? resolve * Math.max(d.prox, 0.4) : 0;
        if (d.their && resolve > 0) {
          const halo = size * (2.6 + resolve * 3.4 * Math.max(d.prox, 0.4));
          g!.globalCompositeOperation = "lighter";
          const hg = g!.createRadialGradient(pr[0], pr[1], 0, pr[0], pr[1], halo);
          hg.addColorStop(0, `rgba(226,200,132,${(0.16 * resolve * Math.max(d.prox, 0.4)).toFixed(3)})`); hg.addColorStop(1, "rgba(226,200,132,0)");
          g!.fillStyle = hg; g!.beginPath(); g!.arc(pr[0], pr[1], halo, 0, 6.283); g!.fill();
          g!.globalCompositeOperation = "source-over";
          size *= 1 + resolve * 0.5 * Math.max(d.prox, 0.4);
        } else if (d.gold && d.name) {
          g!.globalCompositeOperation = "lighter";
          g!.beginPath(); g!.arc(pr[0], pr[1], size * 3, 0, 6.283);
          g!.fillStyle = `rgba(226,200,132,${(a * 0.1).toFixed(3)})`; g!.fill();
          g!.globalCompositeOperation = "source-over";
        }
        g!.beginPath(); g!.arc(pr[0], pr[1], Math.max(0.4, size), 0, 6.283);
        g!.fillStyle = d.gold || warm > 0 ? `rgba(231,206,150,${Math.min(1, a + warm * 0.4).toFixed(3)})` : `rgba(220,228,245,${a.toFixed(3)})`;
        g!.fill();
      }
      const rim = g!.createRadialGradient(CX, CY, R * 0.78, CX, CY, R * 1.06);
      rim.addColorStop(0, "rgba(120,150,220,0)"); rim.addColorStop(0.82, "rgba(120,150,220,.05)");
      rim.addColorStop(0.94, "rgba(180,200,240,.10)"); rim.addColorStop(1, "rgba(120,150,220,0)");
      g!.fillStyle = rim; g!.beginPath(); g!.arc(CX, CY, R * 1.06, 0, 6.283); g!.fill();
      if (sunNow) {
        const pr = project(rot(sunNow)), front = (pr[2] + 1) / 2, a = (1 - resolve) * 0.32 * (0.4 + 0.6 * front);
        if (a > 0.01) { g!.beginPath(); g!.arc(pr[0], pr[1], Math.max(1, 2.2 * pr[3]), 0, 6.283); g!.fillStyle = `rgba(226,200,132,${a.toFixed(3)})`; g!.fill(); }
      }
      if (sun) {
        const pr = project(rot(sun)), front = (pr[2] + 1) / 2, a = eclLit * (0.35 + 0.65 * front);
        g!.globalCompositeOperation = "lighter";
        const gr = g!.createRadialGradient(pr[0], pr[1], 0, pr[0], pr[1], 28 * pr[3]);
        gr.addColorStop(0, `rgba(255,247,228,${a.toFixed(3)})`); gr.addColorStop(0.4, `rgba(243,227,189,${(a * 0.5).toFixed(3)})`); gr.addColorStop(1, "rgba(226,200,132,0)");
        g!.fillStyle = gr; g!.beginPath(); g!.arc(pr[0], pr[1], 28 * pr[3], 0, 6.283); g!.fill();
        g!.globalCompositeOperation = "source-over";
        g!.beginPath(); g!.arc(pr[0], pr[1], Math.max(1.6, 3.2 * pr[3]), 0, 6.283); g!.fillStyle = `rgba(255,250,235,${Math.min(1, a + 0.2).toFixed(3)})`; g!.fill();
        if (front > 0.5 && resolve > 0.4) {
          g!.font = "10px IBM Plex Mono, monospace"; g!.textAlign = "center";
          g!.fillStyle = `rgba(226,200,132,${(eclLit * 0.85).toFixed(3)})`; g!.fillText("☉︎", pr[0], pr[1] - 15 * pr[3]);
        }
      }
      if (hoverDot) {
        const pr = project(rot(hoverDot));
        if (pr[2] > 0.08) {
          const x = pr[0], y = pr[1];
          g!.strokeStyle = "rgba(226,200,132,.55)"; g!.lineWidth = 1;
          g!.beginPath(); g!.arc(x, y, 7, 0, 6.283); g!.stroke();
          g!.beginPath(); g!.moveTo(x + 8, y); g!.lineTo(x + 22, y); g!.stroke();
          g!.font = "11px IBM Plex Mono, monospace"; g!.textAlign = "left"; g!.textBaseline = "middle";
          g!.fillStyle = "rgba(236,228,210,.92)"; g!.fillText(hoverDot.name as string, x + 28, y);
          g!.textBaseline = "alphabetic";
        }
      }
    }

    let raf = 0, last = performance.now();
    function loop(now: number) { const dt = Math.min(64, now - last); last = now; step(now, dt); draw(now); raf = requestAnimationFrame(loop); }
    const el = cv; // hoisted closures lose the null-guard narrowing
    function size() {
      W = innerWidth; H = innerHeight; CX = W / 2; CY = H / 2; R = Math.min(W, H) * 0.3;
      el.width = Math.floor(W * dpr); el.height = Math.floor(H * dpr);
      el.style.width = W + "px"; el.style.height = H + "px";
      g!.setTransform(dpr, 0, 0, dpr, 0, 0); buildBg(); buildSphere();
    }
    size();
    addEventListener("resize", size);
    const vis = () => { if (!document.hidden) last = performance.now(); };
    document.addEventListener("visibilitychange", vis);
    step(performance.now(), 16); draw(performance.now());
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      removeEventListener("resize", size);
      document.removeEventListener("visibilitychange", vis);
      cv.removeEventListener("pointerdown", onDown);
      cv.removeEventListener("pointermove", onMove);
      cv.removeEventListener("pointerleave", onLeave);
      cv.removeEventListener("pointerup", rel);
      cv.removeEventListener("pointercancel", rel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // segmented entry — auto-advancing, inscribed not filled
  const seg = (i: number, key: keyof typeof vals, max: number) => ({
    ref: segRefs[i],
    value: vals[key],
    maxLength: max,
    inputMode: "numeric" as const,
    type: "text" as const,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value.replace(/\D/g, "");
      setVals((s) => ({ ...s, [key]: v }));
      if (v.length >= max && i < 4) segRefs[i + 1].current?.focus();
    },
    onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => {
      const el = e.currentTarget;
      if (e.key === "Enter") doReveal();
      else if (e.key === "Backspace" && el.value === "" && i > 0) { segRefs[i - 1].current?.focus(); e.preventDefault(); }
      else if (e.key === "ArrowLeft" && el.selectionStart === 0 && i > 0) segRefs[i - 1].current?.focus();
      else if (e.key === "ArrowRight" && el.selectionStart === el.value.length && i < 4) segRefs[i + 1].current?.focus();
    },
  });

  // REVEAL — {d,m,y,hh,mm}; blank hour = solar noon (no horizon is ever claimed
  // from it). Sign computed client-side by the one engine; "Read it →" carries
  // the moment into the Reading flow by querystring.
  function doReveal() {
    const d = +vals.d, m = +vals.m, y = +vals.y;
    const hourBlank = vals.h === "";
    const hh = hourBlank ? 12 : +vals.h, mm = vals.mi === "" ? 0 : +vals.mi;
    if (!(y >= 1 && m >= 1 && m <= 12 && d >= 1 && d <= 31)) {
      (!vals.d ? segRefs[0] : !vals.m ? segRefs[1] : segRefs[2]).current?.focus();
      return;
    }
    const lon = sunLonAt(new Date(y, m - 1, d, hh, mm));
    const si = Math.floor(mod360(lon) / 30);
    revealRef.current(lon);
    setResult({ sign: SIGN_NAMES[si], glyph: ZODIAC[si], deg: Math.floor(mod360(lon) - si * 30), d, m, y, hh, mm, hourBlank });
    setTimeout(() => setResultIn(true), 1400); // words after the recognition
  }
  function again() {
    setResultIn(false);
    setTimeout(() => { setResult(null); resetRef.current(); }, 600);
  }

  const momentQS = result
    ? `?d=${result.d}&m=${result.m}&y=${result.y}${result.hourBlank ? "" : `&hh=${result.hh}&mm=${result.mm}`}`
    : "";
  const readHref = `/reading${momentQS}`;
  // the doors, named — the moment carries forward so the door arrives pre-filled
  const DOORS = [
    { id: "lucy", name: "Lucy", gloss: "the pattern in love" },
    { id: "shadow", name: "Shadow", gloss: "what repeats" },
    { id: "path", name: "Path", gloss: "the work" },
  ];
  // the house offer stands first on the floor
  const READINGS = [{ name: "The Reading", gloss: "the whole sky", href: "/reading" }, ...DOORS.map((d) => ({ name: d.name, gloss: d.gloss, href: `/door/${d.id}` }))];

  return (
    <main className="yoursky">
      <style>{YS_CSS}</style>
      <canvas id="ys-sky" ref={cvRef} />
      <div className="ys-vignette" />
      <div className="ys-grain" />

      <div className="ys-mark"><span className="seal" /><span className="wm">Astrolab</span><span className="slogan">readings drawn from the real sky</span></div>
      <div className="ys-now" aria-hidden>
        <div className="k">The sky, right now</div>
        <div className="t">{now?.t ?? "—"}</div>
        <div className="s">{now?.s ?? "—"}</div>
      </div>

      {/* the instrument flanks the sphere — left now, a second may join on the right */}
      <Link className="ys-instrument" href="/chart" aria-label="Cast your natal chart">
        <span className="gl">✶</span><span className="t">The Natal Wheel</span><span className="ar">→</span>
      </Link>

      {/* the baseboard — the room's furniture, never part of the question */}
      <nav className="ys-base" aria-label="The readings">
        <span className="grp">
          <span className="k">The readings</span>
          {READINGS.map((d) => (
            <Link key={d.href} href={d.href}>{d.name}<em> · {d.gloss}</em></Link>
          ))}
        </span>
        <Link className="obs" href="/observatory">The observatory →</Link>
      </nav>

      <div className="ys-panel">
        {!result && (
          <div className="ys-ask">
            <p className="ask-line">When did you arrive?</p>
            <div className="moment">
              <div className="seg-group">
                <label>The day you arrived</label>
                <div className="seg-row">
                  <input className="seg d" placeholder="DD" aria-label="Day" {...seg(0, "d", 2)} />
                  <span className="sep">/</span>
                  <input className="seg m" placeholder="MM" aria-label="Month" {...seg(1, "m", 2)} />
                  <span className="sep">/</span>
                  <input className="seg y" placeholder="YYYY" aria-label="Year" {...seg(2, "y", 4)} />
                </div>
              </div>
              <div className="seg-group">
                <label>The hour</label>
                <div className="seg-row">
                  <input className="seg h" placeholder="HH" aria-label="Hour" {...seg(3, "h", 2)} />
                  <span className="sep">:</span>
                  <input className="seg mi" placeholder="MM" aria-label="Minute" {...seg(4, "mi", 2)} />
                </div>
              </div>
              <button className="reveal" onClick={doReveal}><span className="lbl">Reveal my sky</span><span className="ar">→</span></button>
            </div>
          </div>
        )}
        {result && (
          <div className={`ys-result${resultIn ? " in" : ""}`}>
            <p className="under">You arrived under</p>
            <h2 className="sign"><span>{result.sign}</span><span className="gl">{glyphText(result.glyph)}</span></h2>
            <p className="line">This is the sky that stood when you arrived.</p>
            <p className="sub">Sun at <b>{result.deg}° {result.sign}</b> on the ecliptic</p>
            <div className="acts">
              <Link className="read" href={readHref}>Read it <span>→</span></Link>
              <button className="again" onClick={again}>another moment</button>
            </div>
            {/* the same sky, read through a door — the moment travels with the link */}
            <div className="ys-result-doors">
              <span className="k">or through a door</span>
              {DOORS.map((d) => (
                <Link key={d.id} href={`/door/${d.id}${momentQS}`}>{d.name}<em> · {d.gloss}</em></Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

// ported from design/Your Sky.html — scoped under .yoursky / ys- prefixes; the
// wordmark sits slate-dim per the HANDOFF materiality rule
const YS_CSS = `
  .yoursky{position:relative;height:100vh;height:100dvh;overflow:hidden;
    background:radial-gradient(135% 120% at 50% 48%, #0c1733 0%, #081025 36%, #050a18 64%, #03050d 100%)}
  #ys-sky{position:fixed;inset:0;z-index:0;display:block;cursor:grab;touch-action:none}
  #ys-sky.drag{cursor:grabbing}
  .ys-vignette{position:fixed;inset:0;z-index:2;pointer-events:none;
    background:radial-gradient(125% 105% at 50% 48%, transparent 44%, rgba(3,5,13,.55) 80%, rgba(1,2,6,.95) 100%)}
  .ys-grain{position:fixed;inset:0;z-index:3;pointer-events:none;opacity:.045;mix-blend-mode:overlay;
    background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")}
  .ys-mark{position:fixed;top:30px;left:34px;z-index:6;display:flex;align-items:center;gap:13px;pointer-events:none}
  .ys-mark .seal{width:7px;height:7px;border-radius:50%;background:var(--gold-bright);position:relative}
  .ys-mark .seal::after{content:"";position:absolute;inset:-6px;border:1px solid var(--gold);border-radius:50%;opacity:.4}
  .ys-mark .wm{font-family:var(--mono);font-size:10px;letter-spacing:.46em;text-transform:uppercase;color:var(--slate-dim);opacity:.85}
  .ys-mark .slogan{font-family:var(--serif);font-style:italic;font-size:12.5px;color:var(--slate);letter-spacing:.4px;opacity:.9}
  @media (max-width:640px){ .ys-mark .slogan{display:none} }
  .ys-now{position:fixed;top:28px;right:34px;z-index:6;text-align:right;pointer-events:none;
    font-family:var(--mono);font-size:10px;letter-spacing:.24em;text-transform:uppercase;color:var(--slate-dim);line-height:1.85}
  .ys-now .t{color:var(--slate)}
  .ys-now .s{color:var(--gold-deep)}
  .ys-panel{position:fixed;left:50%;bottom:12vh;transform:translateX(-50%);z-index:6;width:min(640px,92vw);text-align:center}
  .yoursky .ask-line{font-family:var(--serif);font-style:italic;font-size:clamp(24px,3vw,34px);color:var(--ivory);letter-spacing:.3px;margin-bottom:24px}
  .yoursky .moment{display:flex;align-items:flex-end;justify-content:center;gap:clamp(22px,3vw,40px);flex-wrap:wrap}
  .yoursky .seg-group{display:flex;flex-direction:column;gap:13px}
  .yoursky .seg-group>label{font-family:var(--mono);font-size:9.5px;color:var(--gold-deep);letter-spacing:.32em;text-transform:uppercase;text-align:left}
  .yoursky .seg-row{position:relative;display:flex;align-items:baseline;gap:7px;padding:2px 2px 12px}
  .yoursky .seg-row::after{content:"";position:absolute;left:0;right:0;bottom:0;height:1px;background:var(--rule)}
  .yoursky .seg-row::before{content:"";position:absolute;left:0;right:0;bottom:0;height:1px;z-index:1;
    background:linear-gradient(90deg,var(--gold),var(--gold-deep) 60%,transparent);transform:scaleX(0);transform-origin:left;transition:transform .6s var(--ease)}
  .yoursky .seg-row:focus-within::before{transform:scaleX(1)}
  .yoursky .seg{background:transparent;border:0;outline:none;color:var(--ivory);font-family:var(--serif);font-weight:500;
    font-size:clamp(28px,3.4vw,36px);line-height:1;text-align:center;letter-spacing:.5px;padding:0;-webkit-appearance:none}
  .yoursky .seg::placeholder{color:var(--gold-deep);opacity:.5;font-style:italic;font-size:.66em;letter-spacing:.14em}
  .yoursky .seg.d,.yoursky .seg.m,.yoursky .seg.h,.yoursky .seg.mi{width:1.8em}
  .yoursky .seg.y{width:2.8em}
  .yoursky .sep{font-family:var(--serif);font-size:clamp(23px,2.9vw,30px);color:var(--gold-deep);opacity:.55;transform:translateY(-2px)}
  .yoursky .reveal{position:relative;align-self:flex-end;margin-bottom:5px;overflow:hidden;background:transparent;border:1px solid var(--gold);
    color:var(--gold-bright);font-family:var(--mono);font-size:11.5px;letter-spacing:.3em;text-transform:uppercase;cursor:pointer;
    padding:16px 30px;display:inline-flex;align-items:center;gap:13px;
    transition:color .6s var(--ease),border-color .6s var(--ease),box-shadow .6s var(--ease)}
  .yoursky .reveal::before{content:"";position:absolute;inset:0;background:linear-gradient(120deg,rgba(194,162,95,.18),rgba(194,162,95,.03));opacity:0;transition:opacity .6s var(--ease)}
  .yoursky .reveal .lbl,.yoursky .reveal .ar{position:relative}
  .yoursky .reveal .ar{transition:transform .6s var(--ease)}
  .yoursky .reveal:hover{color:#f6e8c4;border-color:var(--gold-bright);box-shadow:0 0 30px rgba(194,162,95,.16)}
  .yoursky .reveal:hover::before{opacity:1}
  .yoursky .reveal:hover .ar{transform:translateX(5px)}
  /* the instrument — a glass chip flanking the sphere, left of centre */
  .ys-instrument{position:fixed;left:30px;top:50%;transform:translateY(-50%);z-index:6;
    display:inline-flex;align-items:center;gap:10px;padding:11px 17px;border:1px solid var(--rule);border-radius:999px;
    background:rgba(20,33,66,.30);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);
    font-family:var(--mono);font-size:9.5px;letter-spacing:.26em;text-transform:uppercase;color:var(--ivory-dim);
    text-decoration:none;transition:border-color .5s var(--ease),color .5s var(--ease),background .5s var(--ease)}
  .ys-instrument:hover{border-color:var(--gold);color:var(--gold-bright);background:rgba(194,162,95,.08)}
  .ys-instrument .gl{color:var(--gold);font-size:13px}
  .ys-instrument .ar{color:var(--gold-deep)}
  @media(max-width:880px){.ys-instrument{top:72px;left:50%;transform:translateX(-50%);padding:8px 14px;font-size:9px}}
  /* the baseboard — doors left, observatory right, the floor of the room */
  .ys-base{position:fixed;left:34px;right:34px;bottom:26px;z-index:6;display:flex;justify-content:space-between;align-items:baseline;gap:20px}
  .ys-base .grp{display:flex;align-items:baseline;gap:22px;flex-wrap:wrap}
  .ys-base .k{font-family:var(--mono);font-size:9px;letter-spacing:.3em;text-transform:uppercase;color:var(--gold-deep)}
  .ys-base a{font-family:var(--mono);font-size:10.5px;letter-spacing:.22em;text-transform:uppercase;color:var(--ivory-dim);
    text-decoration:none;transition:color .5s var(--ease)}
  .ys-base a em{font-family:var(--serif);font-style:italic;font-size:12px;letter-spacing:.4px;text-transform:none;color:var(--slate-dim);transition:color .5s var(--ease)}
  .ys-base a:hover{color:var(--gold-bright)}
  .ys-base a:hover em{color:var(--slate)}
  .ys-base .obs{color:var(--slate-dim)}
  .ys-base .obs:hover{color:var(--gold)}
  /* the result's door offer stays in flow — the moment's own invitation */
  .ys-result-doors{display:flex;align-items:baseline;justify-content:center;gap:22px;flex-wrap:wrap;margin-top:26px}
  .ys-result-doors .k{font-family:var(--mono);font-size:9px;letter-spacing:.3em;text-transform:uppercase;color:var(--gold-deep)}
  .ys-result-doors a{font-family:var(--mono);font-size:10.5px;letter-spacing:.22em;text-transform:uppercase;color:var(--ivory-dim);text-decoration:none;transition:color .5s var(--ease)}
  .ys-result-doors a em{font-family:var(--serif);font-style:italic;font-size:12px;letter-spacing:.4px;text-transform:none;color:var(--slate-dim);transition:color .5s var(--ease)}
  .ys-result-doors a:hover{color:var(--gold-bright)}
  .ys-result-doors a:hover em{color:var(--slate)}
  @media (max-width:640px){
    /* on glass the question anchors to the sphere's heart; the floor owns the
       bottom strip alone — they can never collide again */
    .ys-panel{bottom:auto;top:52%;transform:translate(-50%,-50%)}
    .ys-base{left:10px;right:10px;bottom:max(12px, env(safe-area-inset-bottom));
      flex-direction:row;flex-wrap:wrap;justify-content:center;gap:8px 16px}
    .ys-base .grp{gap:16px;justify-content:center}
    .ys-base .k{display:none}
    .ys-base a{font-size:9px;letter-spacing:.16em}
    .ys-base a em,.ys-result-doors a em{display:none}
    .ys-result-doors{gap:14px}
    .yoursky .moment{gap:18px}
    .yoursky .ask-line{margin-bottom:16px}
  }
  .ys-result{opacity:0;transform:translateY(10px);transition:opacity 1.4s var(--ease),transform 1.4s var(--ease)}
  .ys-result.in{opacity:1;transform:none}
  .ys-result .under{font-family:var(--mono);font-size:10.5px;letter-spacing:.34em;text-transform:uppercase;color:var(--gold-deep);margin-bottom:14px}
  .ys-result .sign{font-family:var(--serif);font-weight:500;font-size:clamp(46px,7vw,80px);line-height:1;color:var(--ivory);
    display:flex;align-items:center;justify-content:center;gap:.32em}
  .ys-result .sign .gl{font-family:var(--mono);font-size:.42em;color:var(--gold)}
  .ys-result .line{font-family:var(--serif);font-style:italic;font-size:clamp(19px,2.1vw,24px);color:var(--ivory-dim);margin-top:20px;text-wrap:pretty}
  .ys-result .sub{font-family:var(--mono);font-size:10.5px;letter-spacing:.22em;color:var(--slate);margin-top:14px}
  .ys-result .sub b{color:var(--gold-bright);font-weight:400}
  .ys-result .acts{display:flex;align-items:center;justify-content:center;gap:28px;margin-top:32px}
  .ys-result .read{font-family:var(--mono);font-size:11px;letter-spacing:.26em;text-transform:uppercase;color:var(--gold-bright);
    text-decoration:none;border:1px solid var(--gold);padding:13px 28px;display:inline-flex;align-items:center;gap:11px;
    transition:background .6s var(--ease),color .6s var(--ease),border-color .6s var(--ease)}
  .ys-result .read span{transition:transform .6s var(--ease)}
  .ys-result .read:hover{background:rgba(194,162,95,.08);color:#f3e3bd;border-color:var(--gold-bright)}
  .ys-result .read:hover span{transform:translateX(5px)}
  .ys-result .again{background:none;border:0;cursor:pointer;font-family:var(--mono);font-size:10px;letter-spacing:.24em;text-transform:uppercase;color:var(--slate-dim);transition:color .5s var(--ease)}
  .ys-result .again:hover{color:var(--gold)}
  @media (max-width:640px){ .ys-now{display:none} .ys-panel{bottom:5vh} }
`;
