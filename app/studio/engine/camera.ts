// STUDIO_ENGINE §VIII — three rigs. Orbit (the ritual default), dolly-through
// (the camera travels INTO the field), static-radial (the field turns, the
// camera holds — Virgo's stillness). Manual drag/scroll overrides; releasing
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
  private path: THREE.CatmullRomCurve3;
  fieldSpin = 0; // static-radial rotates the WORLD; the scene reads this

  constructor(aspect: number) {
    this.camera = new THREE.PerspectiveCamera(46, aspect, 0.05, 50);
    this.camera.position.set(0, 0.4, 3.2);
    // the travel-through path — enters, threads the center, leaves, re-enters opposite
    this.path = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.2, 3.0),
      new THREE.Vector3(0.6, 0.1, 1.2),
      new THREE.Vector3(0.1, -0.1, 0.0),
      new THREE.Vector3(-0.7, 0.05, -1.3),
      new THREE.Vector3(-0.1, 0.25, -3.0),
    ], false, "catmullrom", 0.4);
  }

  setAspect(aspect: number) {
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }

  /** Pointer drag — Mars's hand outranks every rig. */
  drag(dx: number, dy: number) {
    this.manual = true;
    this.manualUntil = performance.now() + 4000;
    this.yaw -= dx * 0.005;
    this.pitch = Math.min(1.2, Math.max(-1.2, this.pitch + dy * 0.004));
  }
  scroll(dz: number) {
    this.manual = true;
    this.manualUntil = performance.now() + 4000;
    this.dist = Math.min(8, Math.max(0.4, this.dist + dz * 0.0016));
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
        const target = new THREE.Vector3(
          Math.sin(this.orbitAngle) * 3.1,
          0.42 + Math.sin(this.orbitAngle * 0.4) * 0.12,
          Math.cos(this.orbitAngle) * 3.1,
        );
        this.camera.position.lerp(target, Math.min(1, dt * 1.4));
        this.camera.lookAt(0, 0, 0);
        break;
      }
      case "dolly-through": {
        this.dollyT = (this.dollyT + 0.018 * speed * dt) % 1; // loop: re-enter opposite
        const pos = this.path.getPointAt(this.dollyT);
        const ahead = this.path.getPointAt(Math.min(1, this.dollyT + 0.02));
        this.camera.position.lerp(pos, Math.min(1, dt * 2.2));
        this.camera.lookAt(ahead);
        break;
      }
      case "static-radial": {
        const target = new THREE.Vector3(0, 0.25, 3.4);
        this.camera.position.lerp(target, Math.min(1, dt * 1.2));
        this.camera.lookAt(0, 0, 0);
        this.fieldSpin += 0.035 * speed * dt; // the field rotates instead
        break;
      }
    }
  }
}
