// STUDIO_ENGINE §VIII — three rigs. Orbit precesses around the disc's NORMAL
// (the world stays face-on; the radial composition never collapses edge-on),
// dolly-through glides INSIDE the particle slab, static-radial holds while the
// field turns — Virgo's stillness. Manual drag/scroll/keys override; releasing
// eases back to the sign's rig after four seconds. Audio never touches this.
import * as THREE from "three";

export type CameraMode = "orbit" | "dolly-through" | "static-radial";

export class CameraRig {
  camera: THREE.PerspectiveCamera;
  mode: CameraMode = "orbit";
  private orbitAngle = 0;
  private manual = false;
  private manualUntil = 0;
  private yaw = 0;
  private pitch = 0.12;
  private dist = 3.2;
  private dollyT = 0;
  private samples: THREE.Vector3[];
  fieldSpin = 0; // static-radial rotates the WORLD; the scene reads this

  constructor(aspect: number) {
    this.camera = new THREE.PerspectiveCamera(46, aspect, 0.05, 50);
    this.camera.position.set(0, 0.4, 3.2);
    // the travel path lives INSIDE the particle slab — an in-plane loop with a
    // soft vertical weave, so the field surrounds the camera the whole way
    this.samples = [];
    for (let i = 0; i < 512; i++) {
      const a = (i / 512) * Math.PI * 2;
      this.samples.push(new THREE.Vector3(
        Math.cos(a) * 1.05,
        Math.sin(a) * 0.78,
        Math.sin(a * 2) * 0.16,
      ));
    }
  }

  setAspect(aspect: number) {
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }

  private takeManual() {
    this.manual = true;
    this.manualUntil = performance.now() + 4000;
  }

  /** Pointer drag — Mars's hand outranks every rig. */
  drag(dx: number, dy: number) {
    this.takeManual();
    this.yaw -= dx * 0.005;
    this.pitch = Math.min(1.2, Math.max(-1.2, this.pitch + dy * 0.004));
  }
  /** Scroll and zoom set the working distance — it PERSISTS; the rigs read it. */
  scroll(dz: number) {
    this.dist = Math.min(8, Math.max(0.4, this.dist + dz * 0.0016));
  }
  /** Arrow keys — one step of turn per press/repeat. */
  nudge(dx: number, dy: number) {
    this.takeManual();
    this.yaw -= dx * 0.055;
    this.pitch = Math.min(1.2, Math.max(-1.2, this.pitch + dy * 0.045));
  }
  /** +/− travel. */
  zoom(factor: number) {
    this.dist = Math.min(8, Math.max(0.4, this.dist * factor));
  }
  /** Home — drop the hand, face the world again, from the top of its loop. */
  recenter() {
    this.manual = false;
    this.yaw = 0;
    this.pitch = 0.12;
    this.dist = 3.2;
    this.orbitAngle = 0;
    this.dollyT = 0;
  }

  update(dt: number, speed: number) {
    const now = performance.now();
    if (this.manual && now > this.manualUntil) this.manual = false;

    if (this.manual) {
      const cp = Math.cos(this.pitch), sp = Math.sin(this.pitch);
      this.camera.position.set(
        Math.sin(this.yaw) * cp * this.dist,
        sp * this.dist,
        Math.cos(this.yaw) * cp * this.dist,
      );
      this.camera.lookAt(0, 0, 0);
      return;
    }

    switch (this.mode) {
      case "orbit": {
        this.orbitAngle += 0.02 * speed * dt; // §VIII: 0.02 rad/s × speed
        // precession around the disc normal — the inclination breathes but the
        // face never turns away; the vortex stays legible the whole orbit
        const incl = 0.5 + Math.sin(this.orbitAngle * 0.4) * 0.14;
        const target = new THREE.Vector3(
          Math.sin(incl) * Math.cos(this.orbitAngle) * this.dist,
          Math.sin(incl) * Math.sin(this.orbitAngle) * this.dist,
          Math.cos(incl) * this.dist,
        );
        this.camera.position.lerp(target, Math.min(1, dt * 1.4));
        this.camera.lookAt(0, 0, 0);
        break;
      }
      case "dolly-through": {
        // Euclidean wrap — JS % keeps the sign, and a negative dollyT indexes
        // samples[-1] and kills the loop
        this.dollyT = ((this.dollyT + 0.018 * speed * dt) % 1 + 1) % 1; // loop: re-enter opposite
        const n = this.samples.length;
        const ft = this.dollyT * n;
        const i = Math.floor(ft) % n;
        const frac = ft - Math.floor(ft);
        const pos = this.samples[i].clone().lerp(this.samples[(i + 1) % n], frac);
        const ahead = this.samples[(i + 10) % n];
        this.camera.position.lerp(pos, Math.min(1, dt * 2.2));
        this.camera.lookAt(ahead);
        break;
      }
      case "static-radial": {
        const target = new THREE.Vector3(0, 0.25, this.dist + 0.2);
        this.camera.position.lerp(target, Math.min(1, dt * 1.2));
        this.camera.lookAt(0, 0, 0);
        this.fieldSpin += 0.035 * speed * dt; // the field rotates instead
        break;
      }
    }
  }
}
