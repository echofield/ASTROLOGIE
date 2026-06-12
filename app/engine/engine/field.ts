// The field — particles, filaments, constellation lines, atmospheric dust.
// One world, calibrated per sign; the light is density of marks, never glow
// (ATLAS_VISUAL §V — no bloom shaders, no post-processing). Each mark is a
// round grain: a dense core with a short film skirt, sized and weighted per
// particle. Luminance lives at the center and dies toward the limb (§V bloom
// mode) — the falloff is in the marks, not in a filter.
import * as THREE from "three";
import type { AudioBands } from "./audio";
import type { Filament, Motion, SignCalibration } from "./calibrations";
import { ARGENT, IVOIRE, OR } from "./palette";

const MAX_PARTICLES = 14000;
const LINKABLE = 900;       // the filament subset — O(n²) on the full field is death
const MAX_SEGMENTS = 2600;  // preallocated line budget
const DUST = 700;
const LIMB = 1.55;          // where the world's light dies (§III: the periphery breathes)

// Round grain, drawn by the GPU: hard core, quick quadratic skirt. The skirt is
// the grain's own edge — film falloff, not a glow filter.
const GRAIN_VERT = /* glsl */ `
  uniform float uPx;
  uniform float uPulse;
  attribute float aSize;
  varying vec3 vColor;
  void main() {
    vColor = color;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = clamp(aSize * uPulse * uPx / -mv.z, 0.75, 24.0);
    gl_Position = projectionMatrix * mv;
  }
`;
const GRAIN_FRAG = /* glsl */ `
  varying vec3 vColor;
  void main() {
    vec2 q = gl_PointCoord - 0.5;
    float d = length(q) * 2.0;
    if (d > 1.0) discard;
    float core = smoothstep(0.5, 0.0, d);
    float skirt = (1.0 - d) * (1.0 - d) * 0.3;
    gl_FragColor = vec4(vColor, min(1.0, core + skirt));
  }
`;

/** Soft round sprite for the dust — drawn once on a small canvas. */
function grainTexture(): THREE.CanvasTexture {
  const cv = document.createElement("canvas");
  cv.width = cv.height = 64;
  const g = cv.getContext("2d")!;
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.45, "rgba(255,255,255,.5)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(cv);
}

export interface FieldParams {
  density: number;
  flow: number;
  filaments: Filament;
  motion: Motion;
  goldRatio: number;
  constellationThreshold: number;
}

export function paramsFrom(c: SignCalibration): FieldParams {
  return {
    density: c.density, flow: c.flow, filaments: c.filaments, motion: c.motion,
    goldRatio: c.goldRatio, constellationThreshold: c.constellationThreshold,
  };
}

export class Field {
  group = new THREE.Group();
  private pos: Float32Array;
  private home: Float32Array;     // the lattice / rest positions
  private vel: Float32Array;
  private seed: Float32Array;
  private colors: Float32Array;
  private sizes: Float32Array;    // world-unit grain size, per particle
  private bright: Float32Array;   // per-particle weight — no two marks identical
  private points: THREE.Points;
  private pGeo: THREE.BufferGeometry;
  private pMat: THREE.ShaderMaterial;
  private goldAssign: Float32Array; // 0..1 lottery per particle
  private lines: THREE.LineSegments;
  private lGeo: THREE.BufferGeometry;
  private lPos: Float32Array;
  private lCol: Float32Array;
  private dust!: THREE.Points;
  private dustFar!: THREE.Points;
  private dustTex: THREE.CanvasTexture;
  private t = 0;
  private pulse = 0;
  params: FieldParams;

  constructor(initial: FieldParams) {
    this.params = { ...initial };
    this.pos = new Float32Array(MAX_PARTICLES * 3);
    this.home = new Float32Array(MAX_PARTICLES * 3);
    this.vel = new Float32Array(MAX_PARTICLES * 3);
    this.seed = new Float32Array(MAX_PARTICLES);
    this.goldAssign = new Float32Array(MAX_PARTICLES);
    this.colors = new Float32Array(MAX_PARTICLES * 3);
    this.sizes = new Float32Array(MAX_PARTICLES);
    this.bright = new Float32Array(MAX_PARTICLES);
    this.seedField();

    this.pGeo = new THREE.BufferGeometry();
    this.pGeo.setAttribute("position", new THREE.BufferAttribute(this.pos, 3));
    this.pGeo.setAttribute("color", new THREE.BufferAttribute(this.colors, 3));
    this.pGeo.setAttribute("aSize", new THREE.BufferAttribute(this.sizes, 1));
    this.pMat = new THREE.ShaderMaterial({
      uniforms: { uPx: { value: 900 }, uPulse: { value: 1 } },
      vertexShader: GRAIN_VERT,
      fragmentShader: GRAIN_FRAG,
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      // over the Ink ground, addition IS density-of-marks: overlapping grains
      // build light where the field is dense — §V, literally
      blending: THREE.AdditiveBlending,
    });
    this.points = new THREE.Points(this.pGeo, this.pMat);
    this.group.add(this.points);

    this.lPos = new Float32Array(MAX_SEGMENTS * 6);
    this.lCol = new Float32Array(MAX_SEGMENTS * 6);
    this.lGeo = new THREE.BufferGeometry();
    this.lGeo.setAttribute("position", new THREE.BufferAttribute(this.lPos, 3));
    this.lGeo.setAttribute("color", new THREE.BufferAttribute(this.lCol, 3));
    // filaments are barely-there — the threads under the field, never a web
    const lMat = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.3, depthWrite: false });
    this.lines = new THREE.LineSegments(this.lGeo, lMat);
    this.group.add(this.lines);

    // atmospheric dust — two shells beyond the field. The near shell carries
    // parallax; the far shell is the deep ground the world floats in.
    this.dustTex = grainTexture();
    const shell = (count: number, rMin: number, rMax: number, size: number, opacity: number) => {
      const dPos = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        const r = rMin + Math.random() * (rMax - rMin);
        const th = Math.random() * Math.PI * 2;
        const ph = Math.acos(2 * Math.random() - 1);
        dPos[i * 3] = r * Math.sin(ph) * Math.cos(th);
        dPos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th);
        dPos[i * 3 + 2] = r * Math.cos(ph);
      }
      const dGeo = new THREE.BufferGeometry();
      dGeo.setAttribute("position", new THREE.BufferAttribute(dPos, 3));
      const pts = new THREE.Points(dGeo, new THREE.PointsMaterial({
        color: ARGENT, size, map: this.dustTex, transparent: true,
        opacity, depthWrite: false, sizeAttenuation: true,
      }));
      this.group.add(pts);
      return pts;
    };
    this.dust = shell(DUST, 2.2, 5.7, 0.016, 0.16);
    this.dustFar = shell(1100, 5.5, 11, 0.026, 0.09);
  }

  /** Perspective pixel factor — Scene calls this on resize so grain size tracks the viewport. */
  setViewport(drawingBufferHeight: number, fovDeg: number) {
    this.pMat.uniforms.uPx.value = drawingBufferHeight / (2 * Math.tan(THREE.MathUtils.degToRad(fovDeg) / 2));
  }

  /** Rest positions: a disc-biased sphere; Virgo's lattice snaps to a grid. */
  private seedField() {
    for (let i = 0; i < MAX_PARTICLES; i++) {
      const th = Math.random() * Math.PI * 2;
      const rr = Math.pow(Math.random(), 0.62);    // center carries weight (§III)
      const z = (Math.random() - 0.5) * 0.55 * (1 - rr * 0.4);
      const r = rr * 1.35;
      this.home[i * 3] = Math.cos(th) * r;
      this.home[i * 3 + 1] = Math.sin(th) * r;
      this.home[i * 3 + 2] = z;
      this.pos[i * 3] = this.home[i * 3];
      this.pos[i * 3 + 1] = this.home[i * 3 + 1];
      this.pos[i * 3 + 2] = this.home[i * 3 + 2];
      this.seed[i] = Math.random() * Math.PI * 2;
      this.goldAssign[i] = Math.random();
      // no two marks identical — varied grain, a rare handful of brighter stars
      this.sizes[i] = 0.009 + Math.random() * 0.012;
      if (Math.random() < 0.02) this.sizes[i] *= 2.3;
      this.bright[i] = 0.6 + Math.random() * 0.4;
    }
  }

  /** Crystalline rest positions — a DISC of lattice, never a cube (§III: the
   *  world inside is always circular; the precision lives inside the limb). */
  private latticeCells: THREE.Vector3[] | null = null;
  private latticeHome(i: number, out: THREE.Vector3) {
    if (!this.latticeCells) {
      this.latticeCells = [];
      const side = 30;
      for (let iz = 0; iz < 8; iz++) {
        for (let iy = 0; iy < side; iy++) {
          for (let ix = 0; ix < side; ix++) {
            const x = (ix / (side - 1) - 0.5) * 2.9;
            const y = (iy / (side - 1) - 0.5) * 2.9;
            if (Math.hypot(x, y) > 1.38) continue;
            this.latticeCells.push(new THREE.Vector3(x, y, (iz / 7 - 0.5) * 0.5));
          }
        }
      }
    }
    out.copy(this.latticeCells[i % this.latticeCells.length]);
  }

  private v3 = new THREE.Vector3();

  update(dt: number, speed: number, bands: AudioBands, wanderPhase: number) {
    this.t += dt * speed;
    const p = this.params;
    const densityMul = 0.7 + 0.6 * bands.sub;             // §VI sub → density
    const count = Math.floor(Math.min(1, p.density * densityMul) * MAX_PARTICLES);
    const flow = p.flow * (0.5 + bands.mid);              // mid → flow
    const amp = 0.5 + bands.bass * 1.1;                   // bass → motion amplitude
    const goldPulse = Math.min(1, p.goldRatio + bands.formant * 0.25); // voice → gold blooms
    // a struck note swells every grain for a breath, then lets go
    this.pulse = Math.max(bands.flux, this.pulse - dt * 2.2);
    this.pMat.uniforms.uPulse.value = 1 + this.pulse * 0.65;
    const t = this.t + wanderPhase;

    const ivo = new THREE.Color(IVOIRE);
    const or = new THREE.Color(OR);
    const arg = new THREE.Color(ARGENT);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      let x = this.pos[i3], y = this.pos[i3 + 1], z = this.pos[i3 + 2];
      const s = this.seed[i];
      const r = Math.hypot(x, y) + 1e-5;

      switch (p.motion) {
        case "burst": {
          // sparks reborn at the center, thrown outward
          const sp = (0.25 + (s % 1) * 0.5) * flow * amp;
          x += (x / r) * sp * dt; y += (y / r) * sp * dt;
          z += Math.sin(s + t) * 0.02 * dt;
          if (r > 1.5) { const a = s + t; x = Math.cos(a) * 0.02; y = Math.sin(a) * 0.02; z = (Math.random() - 0.5) * 0.1; }
          break;
        }
        case "crystalline": {
          // the lattice breathes by microns — precision is the stillness
          this.latticeHome(i, this.v3);
          const jx = Math.sin(t * 0.7 + s) * 0.004 * (1 + bands.bass);
          const jy = Math.cos(t * 0.6 + s * 1.7) * 0.004 * (1 + bands.bass);
          x += (this.v3.x + jx - x) * Math.min(1, dt * (0.8 + flow));
          y += (this.v3.y + jy - y) * Math.min(1, dt * (0.8 + flow));
          z += (this.v3.z - z) * Math.min(1, dt * 0.8);
          break;
        }
        case "network": {
          // distributed nodes drifting slowly; information lives in the links
          const hx = this.home[i3], hy = this.home[i3 + 1], hz = this.home[i3 + 2];
          x += (Math.sin(t * 0.3 + s) * 0.12 * flow + (hx - x) * 0.4) * dt * amp;
          y += (Math.cos(t * 0.26 + s * 2.1) * 0.12 * flow + (hy - y) * 0.4) * dt * amp;
          z += ((hz - z) * 0.4 + Math.sin(t * 0.2 + s) * 0.03) * dt;
          break;
        }
        case "concentric": {
          // cymatic standing waves — particles settle onto rings, and the
          // rings carry slow wave-nodes around them. Mineral. (Taurus)
          const hx = this.home[i3], hy = this.home[i3 + 1];
          const hr = Math.hypot(hx, hy) + 1e-5;
          const th0 = Math.atan2(hy, hx);
          const ringW = 0.16;
          const ring = (Math.floor(hr / ringW) + 0.5) * ringW;
          const wave = Math.sin(th0 * 8 + t * 0.5) * Math.sin(t * 0.35 + s) * 0.024 * amp;
          const drift = th0 + t * 0.02 * flow * (i % 2 ? 1 : -1);
          x += (Math.cos(drift) * (ring + wave) - x) * Math.min(1, dt * 1.6);
          y += (Math.sin(drift) * (ring + wave) - y) * Math.min(1, dt * 1.6);
          z += (this.home[i3 + 2] * 0.5 - z) * dt;
          break;
        }
        case "bloom": {
          // solar radiation — grains stream outward along their spoke and are
          // reborn at the heart. Gold-heavy within the accent budget. (Leo)
          const SPOKES = 24;
          const spoke = Math.floor((s / (Math.PI * 2)) * SPOKES) / SPOKES * Math.PI * 2;
          const a = spoke + Math.sin(s * 7) * 0.05;
          const nr = r + (0.1 + (s % 1) * 0.25) * (0.4 + flow) * amp * dt;
          x = Math.cos(a) * nr; y = Math.sin(a) * nr;
          z += (Math.sin(s) * 0.06 - z) * dt * 0.5;
          if (nr > 1.5) { x = Math.cos(a) * 0.03; y = Math.sin(a) * 0.03; }
          break;
        }
        case "trajectory": {
          // the plume — a thin stream enters from the left and flares open
          // rightward, a CONE of long vectors leaving the frame. (Sagittarius)
          const spread = ((s % Math.PI) / Math.PI - 0.5) * 2.4;
          const spreadZ = Math.sin(s * 3) * 0.55;
          const open = Math.min(1, Math.max(0, (x + 0.5) / 1.2));
          const phi = spread * open;
          const sp = (0.25 + (s % 1) * 0.5) * flow * amp;
          x += Math.cos(phi) * sp * dt;
          y += Math.sin(phi) * sp * dt;
          z += spreadZ * open * sp * dt * 0.5 + Math.sin(s + t * 0.3) * 0.01 * dt;
          if (Math.hypot(x, y) > 1.5) {
            x = -1.3 + Math.random() * 0.2;
            y = (Math.random() - 0.5) * 0.06;
            z = (Math.random() - 0.5) * 0.06;
          }
          break;
        }
        case "vortex": {
          // currents; boundaries dissolve; slow spiral with gentle infall/outflow
          const ang = (0.35 + 0.5 / (r + 0.3)) * flow * amp * dt;
          const ca = Math.cos(ang), sa = Math.sin(ang);
          const nx = x * ca - y * sa, ny = x * sa + y * ca;
          x = nx; y = ny;
          const breathe = Math.sin(t * 0.4 + s) * 0.05 * dt;
          x += (x / r) * breathe; y += (y / r) * breathe;
          z += Math.sin(t * 0.5 + s * 3) * 0.015 * dt;
          if (r > 1.6) { x *= 0.2; y *= 0.2; }
          break;
        }
        default: {
          // stubs: gentle home-seeking drift until their creative pass
          const hx = this.home[i3], hy = this.home[i3 + 1], hz = this.home[i3 + 2];
          x += ((hx - x) * 0.5 + Math.sin(t * 0.4 + s) * 0.05 * flow) * dt;
          y += ((hy - y) * 0.5 + Math.cos(t * 0.36 + s) * 0.05 * flow) * dt;
          z += (hz - z) * 0.5 * dt;
        }
      }

      this.pos[i3] = x; this.pos[i3 + 1] = y; this.pos[i3 + 2] = z;

      // color lottery — Or within the accent budget, Argent for depth, Ivoire carries
      const g = this.goldAssign[i] < goldPulse ? or : (this.goldAssign[i] > 0.86 ? arg : ivo);
      // §V bloom: luminance dies toward the limb — the falloff is per mark
      const limb = Math.max(0, 1 - Math.hypot(x, y) / LIMB);
      const lum = (0.3 + 0.7 * Math.pow(limb, 0.85)) * this.bright[i];
      this.colors[i3] = g.r * lum; this.colors[i3 + 1] = g.g * lum; this.colors[i3 + 2] = g.b * lum;
    }
    // park the unused tail far away (cheap density control)
    for (let i = count; i < MAX_PARTICLES; i++) {
      this.pos[i * 3] = 9999; this.pos[i * 3 + 1] = 9999; this.pos[i * 3 + 2] = 9999;
    }

    this.pGeo.attributes.position.needsUpdate = true;
    this.pGeo.attributes.color.needsUpdate = true;

    this.updateLines(Math.min(count, LINKABLE), bands);
  }

  /** Constellation lines on the linkable subset — §V mode 3, accumulating shape. */
  private updateLines(linkable: number, bands: AudioBands) {
    const p = this.params;
    const threshold = (p.constellationThreshold + bands.treble * 0.12) * 0.6; // treble pulses reach
    const t2 = threshold * threshold;
    let seg = 0;
    const ivo = new THREE.Color(IVOIRE);
    const or = new THREE.Color(OR);
    const stride = p.filaments === "lattice" ? 1 : 2; // lattice reads denser
    outer:
    for (let i = 0; i < linkable; i += stride) {
      const i3 = i * 3;
      const ax = this.pos[i3], ay = this.pos[i3 + 1], az = this.pos[i3 + 2];
      if (ax > 999) continue;
      for (let j = i + 1; j < linkable; j += stride) {
        const j3 = j * 3;
        const bx = this.pos[j3], by = this.pos[j3 + 1], bz = this.pos[j3 + 2];
        if (bx > 999) continue;
        const dx = ax - bx, dy = ay - by, dz = az - bz;
        const d2 = dx * dx + dy * dy + dz * dz;
        if (d2 > t2) continue;
        const o = seg * 6;
        this.lPos[o] = ax; this.lPos[o + 1] = ay; this.lPos[o + 2] = az;
        this.lPos[o + 3] = bx; this.lPos[o + 4] = by; this.lPos[o + 5] = bz;
        // presence falls hard with distance — only true neighbors thread together,
        // and the thread dims toward the limb like every other mark
        let w = 1 - Math.sqrt(d2) / threshold;
        w *= w;
        const limb = Math.max(0, 1 - Math.hypot((ax + bx) / 2, (ay + by) / 2) / LIMB);
        w *= 0.3 + 0.7 * limb;
        w *= 0.8 + this.pulse * 0.5; // notes briefly wake the threads too
        const c = (this.goldAssign[i] < p.goldRatio && p.filaments !== "lattice") ? or : ivo;
        this.lCol[o] = c.r * w; this.lCol[o + 1] = c.g * w; this.lCol[o + 2] = c.b * w;
        this.lCol[o + 3] = c.r * w; this.lCol[o + 4] = c.g * w; this.lCol[o + 5] = c.b * w;
        seg++;
        if (seg >= MAX_SEGMENTS) break outer;
      }
    }
    // collapse the unused tail
    for (let s = seg; s < MAX_SEGMENTS; s++) {
      const o = s * 6;
      for (let k = 0; k < 6; k++) this.lPos[o + k] = 9999;
    }
    this.lGeo.attributes.position.needsUpdate = true;
    this.lGeo.attributes.color.needsUpdate = true;
  }

  dispose() {
    this.pGeo.dispose(); this.pMat.dispose(); this.lGeo.dispose();
    (this.lines.material as THREE.Material).dispose();
    this.dust.geometry.dispose(); (this.dust.material as THREE.Material).dispose();
    this.dustFar.geometry.dispose(); (this.dustFar.material as THREE.Material).dispose();
    this.dustTex.dispose();
  }
}
