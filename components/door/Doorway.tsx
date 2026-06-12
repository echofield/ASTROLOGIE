"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { lonOf, SIGN_NAMES } from "@/lib/sky";
import type { ProductConfig } from "@/lib/products/types";

// THE DOORWAY — one shell, masked per product. Ported from the design canonical
// set (design/The Doorway - Alive.html). The living sphere stays behind
// everything; the funnel is a sequence of single-question screens at its heart.
// The design's embedded planet-math is replaced by lib/sky (one engine), the
// demo mask switcher is gone (the registry chooses), and the CTA posts to the
// checkout that already sells.

const mod360 = (x: number) => ((x % 360) + 360) % 360;
const signOf = (lon: number) => SIGN_NAMES[Math.floor(mod360(lon) / 30)];

interface Signs { sunLon: number; sunSign: string; venusSign: string; saturnSign: string }
function signsFor(date: Date): Signs {
  const sunLon = lonOf("Sun", date);
  return { sunLon, sunSign: signOf(sunLon), venusSign: signOf(lonOf("Venus", date)), saturnSign: signOf(lonOf("Saturn", date)) };
}

const EMBLEMS: Record<string, { svg: (animRef: React.Ref<SVGElement>) => React.ReactNode }> = {};

type Step = "arrival" | "question" | "moment" | "preview" | "sealed";

export default function Doorway({ cfg }: { cfg: ProductConfig }) {
  const door = cfg.door!;
  const search = useSearchParams();
  const [step, setStep] = useState<Step>(search.get("sealed") === "1" ? "sealed" : "arrival");
  const [qi, setQi] = useState(0);
  const [qVal, setQVal] = useState("");
  const answersRef = useRef<Record<string, string>>({});
  // a moment revealed on the landing travels here — the door arrives pre-filled
  const [vals, setVals] = useState(() => ({
    d: search.get("d") ?? "", m: search.get("m") ?? "", y: search.get("y") ?? "",
    h: search.get("hh") ?? "", mi: search.get("mm") ?? "",
  }));
  const [signs, setSigns] = useState<Signs | null>(null);
  const birthRef = useRef<{ iso: string; hourKnown: boolean } | null>(null);
  const [previewSpans, setPreviewSpans] = useState<{ html: string; in: boolean }[]>([]);
  const [cutIn, setCutIn] = useState(false);
  const [ctaIn, setCtaIn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState<{ t: string; s: string } | null>(null);
  const cvRef = useRef<HTMLCanvasElement>(null);
  const sphereRef = useRef<{ reveal: (lon: number) => void; reset: () => void }>({ reveal: () => {}, reset: () => {} });
  const qInputRef = useRef<HTMLInputElement>(null);
  const segRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];
  const embRef = useRef<SVGPathElement | SVGCircleElement | null>(null);
  const reduceRef = useRef(false);

  // live clock — the same truth as the landing, from the one engine
  useEffect(() => {
    const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const pad = (n: number) => String(n).padStart(2, "0");
    const tick = () => {
      const n = new Date();
      setNow({
        t: `${pad(n.getDate())} ${MONTHS[n.getMonth()]} ${n.getFullYear()} · ${pad(n.getHours())}:${pad(n.getMinutes())}:${pad(n.getSeconds())}`,
        s: `Sun in ${signOf(lonOf("Sun", n))}`,
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // the sphere — themed by the mask, revealing on the moment
  useEffect(() => {
    const cv = cvRef.current;
    if (!cv) return;
    const g = cv.getContext("2d");
    if (!g) return;
    const reduce = matchMedia("(prefers-reduced-motion:reduce)").matches;
    reduceRef.current = reduce;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const D2R = Math.PI / 180;
    let W = 0, H = 0, CX = 0, CY = 0, R = 0;
    const smoother = (p: number) => (p <= 0 ? 0 : p >= 1 ? 1 : p * p * p * (p * (6 * p - 15) + 10));
    const t23 = 23.4 * D2R;
    const ECL_U = [1, 0, 0] as const, ECL_V = [0, Math.sin(t23), Math.cos(t23)] as const;
    const T = door.theme;
    const THEME = { star: T.star, acc: T.accRGB, bright: T.brightRGB, cy: T.cy, dawn: T.dawn };

    interface Bg { x: number; y: number; z: number; r: number; base: number; vx: number; vy: number; ph: number; tw: number; acc: boolean }
    interface Dot { x: number; y: number; z: number; s: number; their: boolean; prox: number }
    const LAYERS = [{ dir: [1, 0.1], spd: 0.1, n: 0.4 }, { dir: [-0.85, 0.22], spd: 0.16, n: 0.34 }, { dir: [0.15, -1], spd: 0.12, n: 0.26 }];
    let bg: Bg[] = [], dots: Dot[] = [];
    function buildBg() {
      bg = [];
      const total = Math.min(520, Math.max(280, Math.round((W * H) / 3600)));
      LAYERS.forEach((L) => {
        const c = Math.round(total * L.n);
        for (let i = 0; i < c; i++) {
          const z = 0.3 + Math.random() * 0.7;
          bg.push({ x: Math.random() * W, y: Math.random() * H, z, r: 0.3 + z * 1.2, base: 0.08 + z * 0.32, vx: L.dir[0] * L.spd * z, vy: L.dir[1] * L.spd * z, ph: Math.random() * 6.283, tw: 0.5 + Math.random() * 1.7, acc: Math.random() < 0.07 });
        }
      });
    }
    function buildSphere() {
      dots = [];
      const N = Math.min(600, Math.max(360, Math.round(W / 2.7)));
      const golden = Math.PI * (3 - Math.sqrt(5));
      for (let i = 0; i < N; i++) {
        const y = 1 - (i / (N - 1)) * 2, rr = Math.sqrt(Math.max(0, 1 - y * y)), th = i * golden;
        dots.push({ x: Math.cos(th) * rr, y, z: Math.sin(th) * rr, s: Math.random() < 0.06 ? 1.5 : 0.6 + Math.random() * 0.8, their: false, prox: 0 });
      }
    }
    const RINGS = [
      { u: [1, 0, 0] as const, v: [0, 0, 1] as const, a: 0.1 },
      { u: [0, 1, 0] as const, v: [1, 0, 0] as const, a: 0.08 },
      { u: [0, 1, 0] as const, v: [Math.cos(52 * D2R), 0, Math.sin(52 * D2R)] as const, a: 0.07 },
    ];
    const SEG = 96, CAM = 3.0;
    let yaw = 0.6, pitch = -0.32, revealed = false, resolving = false, resolve = 0, rT0 = 0, yaw0 = 0, pitch0 = 0, tYaw = 0, tPitch = 0, eclLit = 0;
    let sunV: { x: number; y: number; z: number } | null = null;
    const AUTO = reduce ? 0 : 0.00006;
    const ptr = { tx: 0, ty: 0, x: 0, y: 0 };
    const onPtr = (e: PointerEvent) => { ptr.tx = e.clientX / innerWidth - 0.5; ptr.ty = e.clientY / innerHeight - 0.5; };
    addEventListener("pointermove", onPtr, { passive: true });
    const rot = (p: { x: number; y: number; z: number }): [number, number, number] => {
      const cx = Math.cos(yaw), sx = Math.sin(yaw);
      const x = p.x * cx - p.z * sx, z = p.x * sx + p.z * cx, y = p.y;
      const cy = Math.cos(pitch), sy = Math.sin(pitch);
      return [x, y * cy - z * sy, y * sy + z * cy];
    };
    const project = (v: [number, number, number]): [number, number, number, number] => {
      const pe = CAM / (CAM - v[2]);
      return [CX + v[0] * R * pe, CY + v[1] * R * pe, v[2], pe];
    };
    const vec = (u: readonly number[], v: readonly number[], a: number) => {
      const c = Math.cos(a), s = Math.sin(a);
      return { x: u[0] * c + v[0] * s, y: u[1] * c + v[1] * s, z: u[2] * c + v[2] * s };
    };
    sphereRef.current = {
      reveal(lon: number) {
        const b = vec(ECL_U, ECL_V, lon * D2R);
        sunV = b;
        for (const d of dots) {
          const dp = d.x * b.x + d.y * b.y + d.z * b.z;
          d.their = dp > Math.cos(34 * D2R);
          d.prox = Math.max(0, (dp - Math.cos(42 * D2R)) / (1 - Math.cos(42 * D2R)));
        }
        yaw0 = yaw; pitch0 = pitch;
        tYaw = Math.atan2(b.x, b.z); tPitch = Math.atan2(b.y, Math.hypot(b.x, b.z));
        revealed = true; resolving = true; rT0 = performance.now();
      },
      reset() {
        sunV = null; revealed = false; resolving = false; resolve = 0; eclLit = 0;
        for (const d of dots) { d.their = false; d.prox = 0; }
      },
    };
    function step(now: number, dt: number) {
      const f = Math.min(2.4, dt / 16.67);
      for (const p of bg) {
        if (!reduce) { p.x += p.vx * f; p.y += p.vy * f; }
        if (p.x < 0) p.x += W; else if (p.x > W) p.x -= W;
        if (p.y < 0) p.y += H; else if (p.y > H) p.y -= H;
      }
      ptr.x += (ptr.tx - ptr.x) * 0.05; ptr.y += (ptr.ty - ptr.y) * 0.05;
      if (resolving) {
        const p = Math.min(1, (now - rT0) / 3500), e = smoother(p);
        let d = ((tYaw - yaw0 + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
        yaw = yaw0 + d * e; pitch = pitch0 + (tPitch - pitch0) * e; resolve = e; eclLit = e;
        if (p >= 1) resolving = false;
      } else if (revealed) {
        yaw += AUTO * 0.6 * dt; // the revealed sky keeps breathing
      } else {
        yaw += AUTO * dt; pitch += (-0.18 - pitch) * 0.004 * f;
      }
    }
    function draw(now: number) {
      g!.clearRect(0, 0, W, H);
      const bgFade = 1 - resolve * 0.4;
      for (const p of bg) {
        const tw = 0.62 + 0.38 * Math.sin((now / 1000) * p.tw + p.ph), a = p.base * tw * bgFade;
        const ox = p.x - ptr.x * 26 * p.z, oy = p.y - ptr.y * 26 * p.z;
        g!.beginPath(); g!.arc(ox, oy, p.r, 0, 6.283);
        g!.fillStyle = `rgba(${p.acc ? THEME.bright : THEME.star},${a.toFixed(3)})`; g!.fill();
      }
      if (THEME.dawn) {
        const dg = g!.createLinearGradient(0, H * 0.62, 0, H);
        dg.addColorStop(0, `rgba(${THEME.acc},0)`); dg.addColorStop(1, `rgba(${THEME.acc},0.07)`);
        g!.fillStyle = dg; g!.fillRect(0, H * 0.62, W, H * 0.38);
      }
      const rr = R * 1.18, sg = g!.createRadialGradient(CX, CY, rr * 0.2, CX, CY, rr);
      sg.addColorStop(0, "rgba(2,4,9,.42)"); sg.addColorStop(0.7, "rgba(2,4,9,.18)"); sg.addColorStop(1, "rgba(2,4,9,0)");
      g!.fillStyle = sg; g!.beginPath(); g!.arc(CX, CY, rr, 0, 6.283); g!.fill();
      g!.lineCap = "round";
      for (const rg of RINGS) {
        let prev: [number, number, number, number] | null = null, pz = 0;
        for (let i = 0; i <= SEG; i++) {
          const pr = project(rot(vec(rg.u, rg.v, (i / SEG) * 6.283)));
          if (prev) {
            const front = ((pr[2] + pz) / 2 + 1) / 2;
            g!.lineWidth = 0.5 + front * 0.7;
            g!.strokeStyle = `rgba(${THEME.star},${(rg.a * (0.22 + 0.78 * front)).toFixed(3)})`;
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
            g!.lineWidth = (0.6 + front) * (1 + eclLit * 0.5);
            g!.strokeStyle = `rgba(${THEME.acc},${(lit * (0.25 + 0.75 * front)).toFixed(3)})`;
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
            const front = ((A.pr[2] + B.pr[2]) / 2 + 1) / 2, a = resolve * (1 - d3 / 0.5) * 0.28 * (0.3 + 0.7 * front);
            if (a < 0.01) continue;
            g!.strokeStyle = `rgba(${THEME.star},${a.toFixed(3)})`;
            g!.beginPath(); g!.moveTo(A.pr[0], A.pr[1]); g!.lineTo(B.pr[0], B.pr[1]); g!.stroke();
          }
        }
      }
      const proj = dots.map((d) => [project(rot(d)), d] as const).sort((a, b) => a[0][2] - b[0][2]);
      for (const [pr, d] of proj) {
        const front = (pr[2] + 1) / 2;
        let a = 0.12 + 0.88 * front, size = d.s * pr[3] * (0.55 + 0.45 * front);
        a *= d.their ? 1 : 1 - resolve * 0.82;
        const warm = d.their ? resolve * Math.max(d.prox, 0.4) : 0;
        if (d.their && resolve > 0) {
          const halo = size * (2.6 + resolve * 3.4 * Math.max(d.prox, 0.4));
          g!.globalCompositeOperation = "lighter";
          const hg = g!.createRadialGradient(pr[0], pr[1], 0, pr[0], pr[1], halo);
          hg.addColorStop(0, `rgba(${THEME.bright},${(0.16 * resolve * Math.max(d.prox, 0.4)).toFixed(3)})`); hg.addColorStop(1, `rgba(${THEME.bright},0)`);
          g!.fillStyle = hg; g!.beginPath(); g!.arc(pr[0], pr[1], halo, 0, 6.283); g!.fill();
          g!.globalCompositeOperation = "source-over";
          size *= 1 + resolve * 0.5 * Math.max(d.prox, 0.4);
        }
        g!.beginPath(); g!.arc(pr[0], pr[1], Math.max(0.4, size), 0, 6.283);
        g!.fillStyle = warm > 0 ? `rgba(${THEME.bright},${Math.min(1, a + warm * 0.4).toFixed(3)})` : `rgba(${THEME.star},${a.toFixed(3)})`;
        g!.fill();
      }
      if (sunV) {
        const pr = project(rot(sunV)), front = (pr[2] + 1) / 2, a = eclLit * (0.35 + 0.65 * front);
        g!.globalCompositeOperation = "lighter";
        const gr = g!.createRadialGradient(pr[0], pr[1], 0, pr[0], pr[1], 28 * pr[3]);
        gr.addColorStop(0, `rgba(255,250,238,${a.toFixed(3)})`); gr.addColorStop(0.4, `rgba(${THEME.bright},${(a * 0.5).toFixed(3)})`); gr.addColorStop(1, `rgba(${THEME.bright},0)`);
        g!.fillStyle = gr; g!.beginPath(); g!.arc(pr[0], pr[1], 28 * pr[3], 0, 6.283); g!.fill();
        g!.globalCompositeOperation = "source-over";
        g!.beginPath(); g!.arc(pr[0], pr[1], Math.max(1.6, 3.2 * pr[3]), 0, 6.283); g!.fillStyle = `rgba(255,250,238,${Math.min(1, a + 0.2).toFixed(3)})`; g!.fill();
      }
    }
    let raf = 0, last = performance.now();
    function loop(now: number) { const dt = Math.min(64, now - last); last = now; step(now, dt); draw(now); raf = requestAnimationFrame(loop); }
    const el = cv;
    function size() {
      W = innerWidth; H = innerHeight; CX = W / 2; CY = H * THEME.cy; R = Math.min(W, H) * 0.3;
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
      removeEventListener("pointermove", onPtr);
      document.removeEventListener("visibilitychange", vis);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // the emblem lives — terminator waxes, eclipse drifts, the small sun climbs
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const node = embRef.current;
      if (node && !reduceRef.current) {
        const t = performance.now();
        if (door.emblem === "moon") { const k = 10 * Math.sin(t / 9000); node.setAttribute("d", `M42 13 c${k.toFixed(2)} 4.5 ${k.toFixed(2)} 29.5 0 34`); }
        else if (door.emblem === "eclipse") node.setAttribute("cx", (46 + 2.6 * Math.sin(t / 11000)).toFixed(2));
        else node.setAttribute("cy", (23 + 4 * Math.sin(t / 10000)).toFixed(2));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---- the funnel ---- */
  const reduce = () => reduceRef.current;
  function beginQuiz() { answersRef.current = {}; setQi(0); setQVal(""); setStep("question"); setTimeout(() => qInputRef.current?.focus(), reduce() ? 0 : 950); }
  function nextQuestion() {
    const v = qVal.trim();
    if (!v) { qInputRef.current?.focus(); return; }
    answersRef.current[cfg.funnelQuestions[qi].key] = v;
    if (qi < 2) {
      setTimeout(() => { setQi(qi + 1); setQVal(""); setTimeout(() => qInputRef.current?.focus(), reduce() ? 0 : 350); }, reduce() ? 0 : 250);
    } else {
      setQi(3);
      setTimeout(() => { setStep("moment"); setTimeout(() => segRefs[0].current?.focus(), reduce() ? 0 : 950); }, reduce() ? 0 : 600);
    }
  }
  const seg = (i: number, key: keyof typeof vals, max: number) => ({
    ref: segRefs[i], value: vals[key], maxLength: max, inputMode: "numeric" as const, type: "text" as const,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value.replace(/\D/g, "");
      setVals((s) => ({ ...s, [key]: v }));
      if (v.length >= max && i < 4) segRefs[i + 1].current?.focus();
    },
    onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") submitMoment(false);
      else if (e.key === "Backspace" && e.currentTarget.value === "" && i > 0) { segRefs[i - 1].current?.focus(); e.preventDefault(); }
    },
  });
  function submitMoment(hourUnknown: boolean) {
    const d = +vals.d, m = +vals.m, y = +vals.y;
    if (!(y >= 1 && m >= 1 && m <= 12 && d >= 1 && d <= 31)) {
      (!vals.d ? segRefs[0] : !vals.m ? segRefs[1] : segRefs[2]).current?.focus();
      return;
    }
    // hour unknown: solar noon stands in — the written reading notes the
    // horizon cannot be fixed (timeUnknown travels with the payload)
    const blank = hourUnknown || vals.h === "";
    const hh = blank ? 12 : +vals.h, mm = blank ? 0 : +(vals.mi || 0);
    const pad = (n: number) => String(n).padStart(2, "0");
    birthRef.current = { iso: `${y}-${pad(m)}-${pad(d)}T${pad(hh)}:${pad(mm)}`, hourKnown: !blank };
    const s = signsFor(new Date(y, m - 1, d, hh, mm));
    setSigns(s);
    sphereRef.current.reveal(s.sunLon);
    // the desire moment: a LIVE micro-analysis of their own answers races the
    // resolve; if it loses (or fails) the config template stands in — never blocks
    const live = fetch("/api/door/preview", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_type: cfg.productId, answers: answersRef.current, signs: { sunSign: s.sunSign, venusSign: s.venusSign, saturnSign: s.saturnSign } }),
    }).then((r) => r.json()).then((d) => (typeof d.preview === "string" && d.preview.length > 40 ? d.preview : null)).catch(() => null);
    const settle = Promise.race([live, new Promise<null>((res) => setTimeout(() => res(null), reduce() ? 0 : 3300))]);
    const minWait = new Promise((res) => setTimeout(res, reduce() ? 0 : 1900));
    Promise.all([settle, minWait]).then(([text]) => { setStep("preview"); renderPreview(s, text as string | null); });
  }
  // the preview writes itself — the live analysis when it arrived, else the template
  function renderPreview(s: Signs, liveText: string | null) {
    const text = liveText
      ? liveText.replace(/(['‘’][^'‘’]{2,60}['‘’])/g, "<b>$1</b>")
      : cfg.previewTemplate
        .replaceAll("{sunSign}", `<b>${s.sunSign}</b>`)
        .replaceAll("{venusSign}", `<b>${s.venusSign}</b>`)
        .replaceAll("{saturnSign}", `<b>${s.saturnSign}</b>`);
    const parts = text.split(/(<b>.*?<\/b>|\s+)/g).filter((p) => p !== "" && !/^\s+$/.test(p));
    const spans = parts.map((html) => ({ html, in: false }));
    setPreviewSpans(spans); setCutIn(false); setCtaIn(false);
    if (reduce()) { setPreviewSpans(parts.map((html) => ({ html, in: true }))); setCutIn(true); setCtaIn(true); return; }
    let i = 0;
    const inkOn = () => {
      if (i < spans.length) {
        i++;
        setPreviewSpans((prev) => prev.map((sp, j) => (j < i ? { ...sp, in: true } : sp)));
        setTimeout(inkOn, 90);
      } else {
        setTimeout(() => { setCutIn(true); setTimeout(() => setCtaIn(true), 700); }, 600);
      }
    };
    inkOn();
  }
  // the wire point — the checkout that already sells
  async function checkout() {
    if (busy || !birthRef.current) return;
    setBusy(true);
    try {
      const res = await fetch("/api/create-checkout-session", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_type: cfg.productId,
          source: "door",
          utm_source: search.get("utm_source") ?? undefined,
          utm_campaign: search.get("utm_campaign") ?? undefined,
          payload: {
            birth_data: { birthISO: birthRef.current.iso, ...(birthRef.current.hourKnown ? {} : { timeUnknown: true }) },
            quiz_answers: answersRef.current,
            signs,
            language: "en",
          },
        }),
      });
      const data = await res.json();
      if (data.url) { window.location.href = data.url; return; }
      setBusy(false);
    } catch { setBusy(false); }
  }

  const t = door.theme;
  const q = cfg.funnelQuestions[Math.min(qi, 2)];
  const maskVars = {
    "--acc": t.acc, "--acc-bright": t.accBright, "--acc-deep": t.accDeep,
    "--rule": `rgba(${t.accRGB},.20)`, "--rule-soft": `rgba(${t.accRGB},.09)`,
    background: `radial-gradient(135% 120% at 50% 48%, ${t.ground[0]} 0%, ${t.ground[1]} 36%, ${t.ground[2]} 64%, ${t.ground[3]} 100%)`,
  } as React.CSSProperties;

  return (
    <main className="doorway" style={maskVars}>
      <style>{DW_CSS}</style>
      <canvas id="dw-sky" ref={cvRef} />
      <div className="dw-vignette" />
      <div className="dw-grain" />

      <a className="dw-mark" href="/"><span className="seal" /><span className="wm">Astrolab</span><span className="sub">readings drawn from the real sky</span></a>
      <div className="dw-now" aria-hidden>
        <div className="t">{now?.t ?? "—"}</div>
        <div className="s">{now?.s ?? "—"}</div>
      </div>

      <div className={`dw-prog${step === "question" ? " show" : ""}`} aria-hidden>
        {[0, 1, 2].map((i) => (
          <svg key={i} viewBox="0 0 12 12" className={i < qi ? "lit" : ""}><path className="st" d="M6 .8 L7.3 4.7 L11.2 6 L7.3 7.3 L6 11.2 L4.7 7.3 L.8 6 L4.7 4.7 Z" /></svg>
        ))}
      </div>

      <div className="dw-heart">
        {/* 1 · ARRIVAL */}
        <section className={`dw-step${step === "arrival" ? " on" : ""}`}>
          <div className="emblem">
            {door.emblem === "moon" && <svg viewBox="0 0 84 60"><circle cx="42" cy="30" r="17" /><path ref={embRef as React.Ref<SVGPathElement>} d="M42 13 c10 4.5 10 29.5 0 34" /></svg>}
            {door.emblem === "eclipse" && <svg viewBox="0 0 84 60"><circle cx="40" cy="30" r="16" /><circle ref={embRef as React.Ref<SVGCircleElement>} cx="46" cy="30" r="16" /></svg>}
            {door.emblem === "mountain" && <svg viewBox="0 0 84 60"><path d="M14 46 L32 18 L42 32 L52 12 L70 46" /><path d="M8 46 L76 46" /><circle ref={embRef as React.Ref<SVGCircleElement>} cx="63" cy="24" r="3.5" /></svg>}
          </div>
          <p className="door-name">{cfg.displayName}</p>
          <p className="door-arch">{cfg.visualTheme.archetype}</p>
          <p className="door-tag">{door.tag}</p>
          <p className="door-purpose">{door.purpose}</p>
          <button className="plaque" onClick={beginQuiz}><span>Begin</span><span className="ar">→</span></button>
        </section>

        {/* 2 · THE THREE QUESTIONS */}
        <section className={`dw-step${step === "question" ? " on" : ""}`}>
          <p className="q-label">{q.label}</p>
          <p className="q-text">{q.q}</p>
          <div className="q-row">
            <input className="q-input" ref={qInputRef} type="text" autoComplete="off" placeholder="write it as it comes"
              aria-label="Your answer" value={qVal} onChange={(e) => setQVal(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") nextQuestion(); }} />
            <button className="q-next" onClick={nextQuestion} aria-label="Next">→</button>
          </div>
        </section>

        {/* 3 · WHEN DID YOU ARRIVE? */}
        <section className={`dw-step${step === "moment" ? " on" : ""}`}>
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
            <button className="plaque" onClick={() => submitMoment(false)}><span>Reveal my sky</span><span className="ar">→</span></button>
          </div>
          <button className="no-hour" onClick={() => submitMoment(true)}>the hour is unknown</button>
        </section>

        {/* 4 · THE PREVIEW */}
        <section className={`dw-step${step === "preview" ? " on" : ""}`}>
          <p className="prev-label">{door.prevLabel}</p>
          <p className="preview">
            {previewSpans.map((sp, i) => (
              <span key={i}><span className={`w${sp.in ? " in" : ""}`} dangerouslySetInnerHTML={{ __html: sp.html }} />{" "}</span>
            ))}
          </p>
          <div className={`cut${cutIn ? " in" : ""}`}>
            <div className="rule" />
            <p className="hand">— the rest is written by hand.</p>
          </div>
          <div className={`cta-row${ctaIn ? " in" : ""}`}>
            <button className="plaque" onClick={checkout} disabled={busy}><span>{busy ? "…" : `Have it written — ${cfg.priceLabel}`}</span></button>
          </div>
        </section>

        {/* 5 · SEALED */}
        <section className={`dw-step${step === "sealed" ? " on" : ""}`}>
          <p className="sealed-line">It is being written.</p>
          <p className="sealed-sub">It will reach <b>the address from your payment</b></p>
          <p className="sealed-note">Confirm that email, and the Cabinet opens it.</p>
          <a className="back-sky" href="/">return to the sky</a>
        </section>
      </div>
    </main>
  );
}

void EMBLEMS;

// ported from design/The Doorway - Alive.html — scoped under .doorway/dw-
const DW_CSS = `
  .doorway{position:relative;height:100vh;height:100dvh;overflow:hidden;color:var(--ivory);transition:background 1.6s linear}
  #dw-sky{position:fixed;inset:0;z-index:0;display:block}
  .dw-vignette{position:fixed;inset:0;z-index:2;pointer-events:none;
    background:radial-gradient(125% 105% at 50% 48%, transparent 44%, rgba(3,5,13,.55) 80%, rgba(1,2,6,.95) 100%)}
  .dw-grain{position:fixed;inset:0;z-index:3;pointer-events:none;opacity:.045;mix-blend-mode:overlay;
    background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")}
  .dw-mark{position:fixed;top:30px;left:34px;z-index:6;display:flex;align-items:center;gap:13px;opacity:.85;text-decoration:none}
  .dw-mark .seal{width:6px;height:6px;border-radius:50%;background:var(--ivory-dim)}
  .dw-mark .wm{font-family:var(--mono);font-size:10px;letter-spacing:.46em;text-transform:uppercase;color:var(--slate-dim)}
  .dw-mark .sub{font-family:var(--serif);font-style:italic;font-size:13px;color:var(--slate);white-space:nowrap;
    opacity:0;transform:translateX(-5px);transition:opacity .8s var(--ease),transform .8s var(--ease)}
  .dw-mark:hover .sub{opacity:.9;transform:none}
  .dw-now{position:fixed;top:28px;right:34px;z-index:6;text-align:right;pointer-events:none;
    font-family:var(--mono);font-size:10px;letter-spacing:.24em;text-transform:uppercase;color:var(--slate-dim);line-height:1.85}
  .dw-now .t{color:var(--slate)} .dw-now .s{color:var(--acc-deep)}
  .dw-heart{position:fixed;inset:0;z-index:5;display:grid;place-items:center;padding:24px;pointer-events:none}
  .dw-step{grid-area:1/1;width:min(660px,93vw);text-align:center;pointer-events:auto;
    opacity:0;transform:translateY(14px);visibility:hidden;
    transition:opacity .9s var(--ease),transform .9s var(--ease),visibility 0s linear .9s}
  .dw-step.on{opacity:1;transform:none;visibility:visible;transition-delay:0s}
  .dw-prog{position:fixed;left:50%;top:34px;transform:translateX(-50%);z-index:6;display:flex;gap:16px;pointer-events:none;
    opacity:0;transition:opacity .8s var(--ease)}
  .dw-prog.show{opacity:1}
  .dw-prog svg{width:11px;height:11px;display:block}
  .dw-prog .st{fill:none;stroke:var(--slate-dim);stroke-width:1;transition:stroke .8s var(--ease),fill .8s var(--ease)}
  .dw-prog .lit .st{stroke:var(--acc-bright);fill:rgba(227,200,132,.25)}
  .doorway .emblem{display:flex;justify-content:center;margin-bottom:26px}
  .doorway .emblem svg{width:84px;height:60px;overflow:visible}
  .doorway .emblem *{fill:none;stroke:var(--acc);stroke-width:1.1;stroke-linecap:round;stroke-linejoin:round}
  .doorway .door-name{font-family:var(--mono);font-size:13px;letter-spacing:.6em;text-transform:uppercase;color:var(--acc-bright);margin-bottom:18px;padding-left:.6em}
  .doorway .door-arch{font-family:var(--mono);font-size:9.5px;letter-spacing:.34em;text-transform:uppercase;color:var(--slate-dim);margin-bottom:26px}
  .doorway .door-tag{font-family:var(--serif);font-style:italic;font-size:clamp(24px,3vw,34px);color:var(--ivory);line-height:1.3;text-wrap:balance;margin-bottom:18px}
  .doorway .door-purpose{font-family:var(--serif);font-size:clamp(14px,1.5vw,16.5px);font-style:italic;color:var(--slate);line-height:1.5;max-width:46ch;margin:0 auto 36px;text-wrap:pretty}
  .doorway .plaque{background:transparent;border:1px solid var(--acc);color:var(--acc-bright);cursor:pointer;
    font-family:var(--mono);font-size:11px;letter-spacing:.3em;text-transform:uppercase;
    padding:15px 30px;display:inline-flex;align-items:center;gap:12px;
    transition:color .6s var(--ease),border-color .6s var(--ease),background .6s var(--ease)}
  .doorway .plaque .ar{transition:transform .6s var(--ease)}
  .doorway .plaque:hover{background:rgba(194,162,95,.07);border-color:var(--acc-bright)}
  .doorway .plaque:hover .ar{transform:translateX(5px)}
  .doorway .plaque:disabled{opacity:.6;cursor:default}
  .doorway .q-label{font-family:var(--mono);font-size:10px;letter-spacing:.36em;text-transform:uppercase;color:var(--acc-deep);margin-bottom:20px}
  .doorway .q-text{font-family:var(--serif);font-style:italic;font-size:clamp(24px,3vw,34px);color:var(--ivory);line-height:1.3;text-wrap:balance;margin-bottom:40px}
  .doorway .q-row{position:relative;display:flex;align-items:baseline;gap:14px;max-width:520px;margin:0 auto;padding-bottom:14px}
  .doorway .q-row::after{content:"";position:absolute;left:0;right:0;bottom:0;height:1px;background:var(--rule)}
  .doorway .q-row::before{content:"";position:absolute;left:0;right:0;bottom:0;height:1px;z-index:1;
    background:linear-gradient(90deg,var(--acc),var(--acc-deep) 60%,transparent);
    transform:scaleX(0);transform-origin:left;transition:transform .6s var(--ease)}
  .doorway .q-row:focus-within::before{transform:scaleX(1)}
  .doorway .q-input{flex:1;background:transparent;border:0;outline:none;color:var(--ivory);
    font-family:var(--serif);font-style:italic;font-size:clamp(18px,2.2vw,24px);letter-spacing:.3px;min-width:0}
  .doorway .q-input::placeholder{color:var(--slate-dim);font-size:.85em}
  .doorway .q-next{background:none;border:0;cursor:pointer;color:var(--acc-deep);font-family:var(--mono);font-size:17px;
    transition:color .5s var(--ease),transform .5s var(--ease)}
  .doorway .q-next:hover{color:var(--acc-bright);transform:translateX(4px)}
  .doorway .ask-line{font-family:var(--serif);font-style:italic;font-size:clamp(24px,3vw,34px);color:var(--ivory);margin-bottom:28px}
  .doorway .moment{display:flex;align-items:flex-end;justify-content:center;gap:clamp(20px,3vw,40px);flex-wrap:wrap}
  .doorway .seg-group{display:flex;flex-direction:column;gap:13px}
  .doorway .seg-group>label{font-family:var(--mono);font-size:9.5px;color:var(--acc-deep);letter-spacing:.32em;text-transform:uppercase;text-align:left}
  .doorway .seg-row{position:relative;display:flex;align-items:baseline;gap:7px;padding:2px 2px 12px}
  .doorway .seg-row::after{content:"";position:absolute;left:0;right:0;bottom:0;height:1px;background:var(--rule)}
  .doorway .seg-row::before{content:"";position:absolute;left:0;right:0;bottom:0;height:1px;z-index:1;
    background:linear-gradient(90deg,var(--acc),var(--acc-deep) 60%,transparent);transform:scaleX(0);transform-origin:left;transition:transform .6s var(--ease)}
  .doorway .seg-row:focus-within::before{transform:scaleX(1)}
  .doorway .seg{background:transparent;border:0;outline:none;color:var(--ivory);font-family:var(--serif);font-weight:500;
    font-size:clamp(26px,3.4vw,36px);line-height:1;text-align:center;letter-spacing:.5px;-webkit-appearance:none}
  .doorway .seg::placeholder{color:var(--acc-deep);opacity:.5;font-style:italic;font-size:.66em;letter-spacing:.14em}
  .doorway .seg.d,.doorway .seg.m,.doorway .seg.h,.doorway .seg.mi{width:1.8em} .doorway .seg.y{width:2.8em}
  .doorway .sep{font-family:var(--serif);font-size:clamp(22px,2.9vw,30px);color:var(--acc-deep);opacity:.55}
  .doorway .no-hour{display:block;margin:26px auto 0;background:none;border:0;cursor:pointer;
    font-family:var(--serif);font-style:italic;font-size:15px;color:var(--slate-dim);text-decoration:underline;text-underline-offset:4px;text-decoration-color:var(--rule);
    transition:color .5s var(--ease)}
  .doorway .no-hour:hover{color:var(--slate)}
  .doorway .prev-label{font-family:var(--mono);font-size:10px;letter-spacing:.36em;text-transform:uppercase;color:var(--acc-deep);margin-bottom:26px}
  .doorway .preview{font-family:var(--serif);font-size:clamp(20px,2.4vw,27px);line-height:1.62;color:var(--ivory);
    text-align:left;max-width:560px;margin:0 auto;text-wrap:pretty;min-height:5.2em}
  .doorway .preview .w{opacity:0;transition:opacity .5s var(--ease)}
  .doorway .preview .w.in{opacity:1}
  .doorway .preview b{font-weight:500;color:var(--acc-bright)}
  .doorway .cut{max-width:560px;margin:26px auto 0;text-align:left;opacity:0;transition:opacity 1.2s var(--ease)}
  .doorway .cut.in{opacity:1}
  .doorway .cut .rule{width:64px;height:1px;background:linear-gradient(90deg,var(--acc),transparent);margin-bottom:14px;
    transform:scaleX(0);transform-origin:left;transition:transform 1.2s var(--ease)}
  .doorway .cut.in .rule{transform:scaleX(1)}
  .doorway .cut .hand{font-family:var(--serif);font-style:italic;font-size:clamp(16px,1.8vw,19px);color:var(--ivory-dim)}
  .doorway .cta-row{margin-top:38px;opacity:0;transition:opacity 1.2s var(--ease) .4s}
  .doorway .cta-row.in{opacity:1}
  .doorway .sealed-line{font-family:var(--serif);font-style:italic;font-size:clamp(30px,4vw,46px);color:var(--ivory);margin-bottom:26px}
  .doorway .sealed-sub{font-family:var(--mono);font-size:11px;letter-spacing:.22em;text-transform:uppercase;color:var(--slate);line-height:2.2}
  .doorway .sealed-sub b{color:var(--acc-bright);font-weight:400;letter-spacing:.12em}
  .doorway .sealed-note{font-family:var(--serif);font-style:italic;font-size:clamp(17px,1.9vw,20px);color:var(--ivory-dim);margin-top:22px}
  .doorway .back-sky{display:inline-block;margin-top:40px;background:none;border:0;cursor:pointer;text-decoration:none;
    font-family:var(--mono);font-size:9.5px;letter-spacing:.28em;text-transform:uppercase;color:var(--slate-dim);transition:color .5s var(--ease)}
  .doorway .back-sky:hover{color:var(--slate)}
  @media (prefers-reduced-motion:reduce){
    .dw-step{transition:none}
    .doorway{transition:none}
    .doorway .preview .w{transition:none}
    .doorway .cut,.doorway .cut .rule,.doorway .cta-row{transition:none}
  }
  @media (max-width:640px){
    .dw-now{display:none}
    .dw-mark{top:22px;left:22px}
    .doorway .q-input{font-size:18px}
    .doorway .seg{font-size:26px}
  }
`;
