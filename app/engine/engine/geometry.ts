// Sacred geometry overlay — concentric rings, the twelve spokes, the cross of
// axes (ATLAS_VISUAL §III: sometimes drawn, often only felt), drawn in Or at
// geometryOpacity × 0.15. Plus the instrument's limb: an outer rim with its
// measure ticks (§VI — the world is being measured even as it is beautiful),
// held slightly above the inner geometry so the disc reads as a disc.
import * as THREE from "three";
import { OR } from "./palette";

const RIM = 1.5;

export function buildGeometryOverlay(): { group: THREE.Group; setOpacity: (o: number) => void } {
  const group = new THREE.Group();
  const innerMats: THREE.LineBasicMaterial[] = [];
  const rimMats: THREE.LineBasicMaterial[] = [];

  const mat = (bucket: THREE.LineBasicMaterial[]) => {
    const m = new THREE.LineBasicMaterial({ color: OR, transparent: true, opacity: 0.1, depthWrite: false });
    bucket.push(m);
    return m;
  };

  const circle = (r: number, bucket: THREE.LineBasicMaterial[]) => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 192; i++) {
      const a = (i / 192) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, 0));
    }
    group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), mat(bucket)));
  };

  // concentric rings
  for (const r of [0.35, 0.7, 1.05, 1.4]) circle(r, innerMats);

  // twelve spokes (the houses)
  {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * 0.12, Math.sin(a) * 0.12, 0));
      pts.push(new THREE.Vector3(Math.cos(a) * 1.4, Math.sin(a) * 1.4, 0));
    }
    group.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), mat(innerMats)));
  }

  // the cross of axes, slightly beyond the rim
  {
    const pts = [
      new THREE.Vector3(-1.55, 0, 0), new THREE.Vector3(1.55, 0, 0),
      new THREE.Vector3(0, -1.55, 0), new THREE.Vector3(0, 1.55, 0),
    ];
    group.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), mat(innerMats)));
  }

  // the limb — the rim that makes the world a disc, with 72 measure ticks
  // (every sixth one longer: the houses)
  circle(RIM, rimMats);
  {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i < 72; i++) {
      const a = (i / 72) * Math.PI * 2;
      const inner = RIM - (i % 6 === 0 ? 0.085 : 0.032);
      pts.push(new THREE.Vector3(Math.cos(a) * inner, Math.sin(a) * inner, 0));
      pts.push(new THREE.Vector3(Math.cos(a) * RIM, Math.sin(a) * RIM, 0));
    }
    group.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), mat(rimMats)));
  }

  const setOpacity = (geometryOpacity: number) => {
    const inner = geometryOpacity * 0.15; // §V of the brief — very faint, always
    for (const m of innerMats) m.opacity = inner;
    // the rim holds even when the inner geometry is only felt
    const rim = 0.05 + geometryOpacity * 0.22;
    for (const m of rimMats) m.opacity = rim;
  };

  return { group, setOpacity };
}
