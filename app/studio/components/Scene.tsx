"use client";

// The Three.js heart — one WebGL scene, five layers in order (ATLAS_VISUAL):
// ink ground → sacred geometry → filaments → particles → dust. Trails come
// from accumulated Ink-fade, never post-processing: the renderer keeps the
// previous frame and a translucent ink veil settles over it each pass.
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { AudioEngine } from "../engine/audio";
import { CALIBRATIONS, type Filament, type Motion, type SignCalibration, type SignId } from "../engine/calibrations";
import { CameraRig, type CameraMode } from "../engine/camera";
import { Capture } from "../engine/capture";
import { Field, paramsFrom } from "../engine/field";
import { buildGeometryOverlay } from "../engine/geometry";
import { INK_CLEAR } from "../engine/palette";
import { clampShutter, clampSpeed, DEFAULT_TIME } from "../engine/time";

export interface StudioState {
  sign: SignId;
  density: number; flow: number; goldRatio: number; constellationThreshold: number;
  geometryOpacity: number; filaments: Filament; motion: Motion;
  cameraMode: CameraMode; speed: number; shutter: number;
  audioSource: "none" | "mic" | "file"; recording: boolean; wander: boolean;
}

export interface StudioAPI {
  setSign: (id: SignId) => StudioState;
  set: <K extends keyof StudioState>(k: K, v: StudioState[K]) => StudioState;
  useMic: () => Promise<boolean>;
  useFile: (f: File) => Promise<boolean>;
  audioOff: () => void;
  toggleCapture: () => Promise<boolean>;
  state: () => StudioState;
}

export default function Scene({ onReady }: { onReady: (api: StudioAPI) => void }) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    renderer.autoClearColor = false; // the veil does the clearing
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const rig = new CameraRig(1);

    // the ink veil — a fullscreen quad in an ortho pass; opacity 1 = hard clear
    const veilScene = new THREE.Scene();
    const veilCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const veilMat = new THREE.MeshBasicMaterial({ color: INK_CLEAR, transparent: true, opacity: 1 - DEFAULT_TIME.shutter * 0.92, depthTest: false, depthWrite: false });
    veilScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), veilMat));

    const start: SignCalibration = CALIBRATIONS.pisces;
    const field = new Field(paramsFrom(start));
    scene.add(field.group);
    const overlay = buildGeometryOverlay();
    overlay.setOpacity(start.geometryOpacity);
    scene.add(overlay.group);

    const audio = new AudioEngine();
    const capture = new Capture();

    const st: StudioState = {
      sign: start.id,
      density: start.density, flow: start.flow, goldRatio: start.goldRatio,
      constellationThreshold: start.constellationThreshold, geometryOpacity: start.geometryOpacity,
      filaments: start.filaments, motion: start.motion, cameraMode: start.cameraMode,
      speed: DEFAULT_TIME.speed, shutter: DEFAULT_TIME.shutter,
      audioSource: "none", recording: false, wander: false,
    };
    rig.mode = st.cameraMode;

    const applyToField = () => {
      field.params.density = st.density;
      field.params.flow = st.flow;
      field.params.goldRatio = st.goldRatio;
      field.params.constellationThreshold = st.constellationThreshold;
      field.params.filaments = st.filaments;
      field.params.motion = st.motion;
      overlay.setOpacity(st.geometryOpacity);
      veilMat.opacity = Math.max(0.04, 1 - st.shutter * 0.92);
    };

    // wander — every 8s, drift parameters within sign-appropriate bounds
    let wanderPhase = 0;
    let wanderTimer = 0;
    const wanderStep = () => {
      const base = CALIBRATIONS[st.sign];
      const around = (v: number, span: number) => Math.min(1, Math.max(0, v + (Math.random() - 0.5) * span));
      st.density = around(base.density, 0.4);
      st.flow = around(base.flow, 0.4);
      st.goldRatio = around(base.goldRatio, 0.12);
      st.constellationThreshold = around(base.constellationThreshold, 0.25);
      st.geometryOpacity = around(base.geometryOpacity, 0.3);
      wanderPhase += Math.random() * 10;
      applyToField();
    };

    const api: StudioAPI = {
      setSign(id) {
        const c = CALIBRATIONS[id];
        st.sign = id;
        st.density = c.density; st.flow = c.flow; st.goldRatio = c.goldRatio;
        st.constellationThreshold = c.constellationThreshold; st.geometryOpacity = c.geometryOpacity;
        st.filaments = c.filaments; st.motion = c.motion; st.cameraMode = c.cameraMode;
        rig.mode = c.cameraMode;
        applyToField();
        return { ...st };
      },
      set(k, v) {
        (st as unknown as Record<string, unknown>)[k] = v as unknown;
        if (k === "speed") st.speed = clampSpeed(st.speed);
        if (k === "shutter") st.shutter = clampShutter(st.shutter);
        if (k === "cameraMode") rig.mode = st.cameraMode;
        applyToField();
        return { ...st };
      },
      async useMic() { const ok = await audio.useMic(); st.audioSource = audio.source; return ok; },
      async useFile(f) { const ok = await audio.useFile(f); st.audioSource = audio.source; return ok; },
      audioOff() { audio.off(); st.audioSource = "none"; },
      async toggleCapture() {
        if (capture.recording) { await capture.stop(st.sign); st.recording = false; return false; }
        capture.start(renderer.domElement, audio.captureStream);
        st.recording = true;
        return true;
      },
      state: () => ({ ...st }),
    };

    // pointer — Mars's hand
    let dragging = false, lx = 0, ly = 0;
    const onDown = (e: PointerEvent) => { dragging = true; lx = e.clientX; ly = e.clientY; };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      rig.drag(e.clientX - lx, e.clientY - ly);
      lx = e.clientX; ly = e.clientY;
    };
    const onUp = () => { dragging = false; };
    const onWheel = (e: WheelEvent) => { e.preventDefault(); rig.scroll(e.deltaY); };
    renderer.domElement.addEventListener("pointerdown", onDown);
    addEventListener("pointermove", onMove);
    addEventListener("pointerup", onUp);
    renderer.domElement.addEventListener("wheel", onWheel, { passive: false });

    const size = () => {
      const w = host.clientWidth, h = host.clientHeight;
      renderer.setSize(w, h, false);
      rig.setAspect(w / h);
    };
    size();
    const ro = new ResizeObserver(size);
    ro.observe(host);

    renderer.setClearColor(INK_CLEAR, 1);
    renderer.clear();

    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.07, (now - last) / 1000);
      last = now;
      const bands = audio.read(st.speed);
      if (st.wander) {
        wanderTimer += dt;
        if (wanderTimer >= 8) { wanderTimer = 0; wanderStep(); }
      }
      field.update(dt, st.speed, bands, wanderPhase);
      rig.update(dt, st.speed);
      // static-radial turns the world, not the camera
      field.group.rotation.z = rig.mode === "static-radial" ? rig.fieldSpin : field.group.rotation.z;
      overlay.group.rotation.z = field.group.rotation.z * 0.6;

      renderer.render(veilScene, veilCam); // the ink settles over the last frame
      renderer.render(scene, rig.camera);  // the world is drawn into it
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    onReady(api);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      renderer.domElement.removeEventListener("pointerdown", onDown);
      removeEventListener("pointermove", onMove);
      removeEventListener("pointerup", onUp);
      renderer.domElement.removeEventListener("wheel", onWheel);
      audio.dispose();
      field.dispose();
      renderer.dispose();
      host.removeChild(renderer.domElement);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={hostRef} style={{ position: "absolute", inset: 0 }} />;
}
