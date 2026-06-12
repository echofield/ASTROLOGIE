// The field — particles, filaments, constellation lines, atmospheric dust.
// One world, calibrated per sign; the light is density of marks, never glow
// (ATLAS_VISUAL §V — no bloom shaders, no post-processing).
import * as THREE from "three";
import type { AudioBands } from "./audio";
import type { Filament, Motion, SignCalibration } from "./calibrations";
import { ARGENT, IVOIRE, OR } from "./palette";

const MAX_PARTICLES = 14000;
const LINKABLE = 900;       // the filament subset — O(n²) on the full field is death
const MAX_SEGMENTS = 2600;  // preallocated line budget
const DUST = 700;

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
  private points: THREE.Points;
  private pGeo: THREE.BufferGeometry;
  private pMat: THREE.PointsMaterial;
  private goldAssign: Float32Array; // 0..1 lottery per particle
  private lines: THREE.LineSegments;
  private lGeo: THREE.BufferGeometry;
  private lPos: Float32Array;
  private lCol: Float32Array;
  private dust: THREE.Points;
  private t = 0;
  params: FieldParams;

  constructor(initial: FieldParams) {
    this.params = { ...initial };
    this.pos = new Float32Array(MAX_PARTICLES * 3);
    this.home = new Float32Array(MAX_PARTICLES * 3);
    this.vel = new Float32Array(MAX_PARTICLES * 3);
    this.seed = new Float32Array(MAX_PARTICLES);
    this.goldAssign = new Float32Array(MAX_PARTICLES);
    this.colors = new Float32Array(MAX_PARTICLES * 3);
    this.seedField();

    this.pGeo = new THREE.BufferGeometry();
    this.pGeo.setAttribute("position", new THREE.BufferAttribute(this.pos, 3));
    this.pGeo.setAttribute("color", new THREE.BufferAttribute(this.colors, 3));
    this.pMat = new THREE.PointsMaterial({
      size: 0.012, vertexColors: true, transparent: true, opacity: 0.95,
      sizeAttenuation: true, depthWrite: false,
    });
    this.points = new THREE.Points(this.pGeo, this.pMat);
    this.group.add(this.points);

    this.lPos = new Float32Array(MAX_SEGMENTS * 6);
    this.lCol = new Float32Array(MAX_SEGMENTS * 6);
    this.lGeo = new THREE.BufferGeometry();
    this.lGeo.setAttribute("position", new THREE.BufferAttribute(this.lPos, 3));
    this.lGeo.setAttribute("color", new THREE.BufferAttribute(this.lCol, 3));
    const lMat = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.55, depthWrite: false });
    this.lines = new THREE.LineSegments(this.lGeo, lMat);
    this.group.add(this.lines);

    // atmospheric dust — sparse, beyond the field, parallax for free in world space
    const dPos = new Float32Array(DUST * 3);
    for (let i = 0; i < DUST; i++) {
      const r = 2.2 + Math.random() * 3.5;
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      dPos[i * 3] = r * Math.sin(ph) * Math.cos(th);
      dPos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th);
      dPos[i * 3 + 2] = r * Math.cos(ph);
    }
    const dGeo = new THREE.BufferGeometry();
    dGeo.setAttribute("position", new THREE.BufferAttribute(dPos, 3));
    this.dust = new THREE.Points(dGeo, new THREE.PointsMaterial({
      color: ARGENT, size: 0.008, transparent: true, opacity: 0.22, depthWrite: false,
    }));
    this.group.add(this.dust);
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
    }
  }

  /** Crystalline rest grid for lattice motion. */
  private latticeHome(i: number, out: THREE.Vector3) {
    const side = 26;
    const ix = i % side, iy = Math.floor(i / side) % side, iz = Math.floor(i / (side * side)) % 8;
    out.set((ix / (side - 1) - 0.5) * 2.4, (iy / (side - 1) - 0.5) * 2.4, (iz / 7 - 0.5) * 0.5);
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
      this.colors[i3] = g.r; this.colors[i3 + 1] = g.g; this.colors[i3 + 2] = g.b;
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
        const w = 1 - Math.sqrt(d2) / threshold; // distance-based presence
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
  }
}
