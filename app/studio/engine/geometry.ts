// Sacred geometry overlay — concentric rings, the twelve spokes, the cross of
// axes (ATLAS_VISUAL §III: sometimes drawn, often only felt). Drawn in Or at
// geometryOpacity × 0.15 — very faint, the measurement under the world.
import * as THREE from "three";
import { OR } from "./palette";

export function buildGeometryOverlay(): { group: THREE.Group; setOpacity: (o: number) => void } {
  const group = new THREE.Group();
  const mats: THREE.LineBasicMaterial[] = [];

  const mat = () => {
    const m = new THREE.LineBasicMaterial({ color: OR, transparent: true, opacity: 0.1, depthWrite: false });
    mats.push(m);
    return m;
  };

  // concentric rings
  for (const r of [0.35, 0.7, 1.05, 1.4]) {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 128; i++) {
      const a = (i / 128) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, 0));
    }
    group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), mat()));
  }

  // twelve spokes (the houses)
  {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * 0.12, Math.sin(a) * 0.12, 0));
      pts.push(new THREE.Vector3(Math.cos(a) * 1.4, Math.sin(a) * 1.4, 0));
    }
    group.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), mat()));
  }

  // the cross of axes, slightly beyond the rim
  {
    const pts = [
      new THREE.Vector3(-1.55, 0, 0), new THREE.Vector3(1.55, 0, 0),
      new THREE.Vector3(0, -1.55, 0), new THREE.Vector3(0, 1.55, 0),
    ];
    group.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), mat()));
  }

  const setOpacity = (geometryOpacity: number) => {
    const o = geometryOpacity * 0.15; // §V of the brief — very faint, always
    for (const m of mats) m.opacity = o;
  };

  return { group, setOpacity };
}
