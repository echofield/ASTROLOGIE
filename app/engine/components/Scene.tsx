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
import { INK_CLEAR, INK_DEEP, INK_LIFT, PALETTE } from "../engine/palette";
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
  random: () => StudioState;
  recenter: () => void;
  zoom: (factor: number) => void;
  state: () => StudioState;
}

type MorphKey = "density" | "flow" | "goldRatio" | "constellationThreshold" | "geometryOpacity";
const MORPH_KEYS: MorphKey[] = ["density", "flow", "goldRatio", "constellationThreshold", "geometryOpacity"];

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

    // the ink veil — a fullscreen quad in an ortho pass; opacity 1 = hard clear.
    // The veil carries the ground's depth: Ink lifted where the world lives,
    // deepened at the edges. Trails settle toward that gradient each frame.
    const groundCv = document.createElement("canvas");
    groundCv.width = groundCv.height = 512;
    {
      const g = groundCv.getContext("2d")!;
      const grad = g.createRadialGradient(256, 238, 40, 256, 256, 365);
      grad.addColorStop(0, INK_LIFT);
      grad.addColorStop(0.55, PALETTE.ink);
      grad.addColorStop(1, INK_DEEP);
      g.fillStyle = grad;
      g.fillRect(0, 0, 512, 512);
    }
    const groundTex = new THREE.CanvasTexture(groundCv);
    groundTex.colorSpace = THREE.SRGBColorSpace; // untagged, the ink gamma-lifts to slate
    const veilScene = new THREE.Scene();
    const veilCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const veilMat = new THREE.MeshBasicMaterial({ map: groundTex, transparent: true, opacity: 1 - DEFAULT_TIME.shutter * 0.92, depthTest: false, depthWrite: false });
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

    // sign changes glide — §VII, never cuts. Numbers ease over ~2.4s; the
    // categorical switches (filaments, motion, camera) land at the midpoint.
    let morph: { t: number; mid: boolean; from: Record<MorphKey, number>; to: SignCalibration; fromCam: CameraMode } | null = null;

    // wander — every 8s, drift parameters within sign-appropriate bounds
    let wanderPhase = 0;
    let wanderTimer = 0;
    const wanderStep = () => {
      if (morph) return; // never fight a glide
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
        morph = {
          t: 0, mid: false, to: c, fromCam: st.cameraMode,
          from: {
            density: st.density, flow: st.flow, goldRatio: st.goldRatio,
            constellationThreshold: st.constellationThreshold, geometryOpacity: st.geometryOpacity,
          },
        };
        // the panel shows the destination; the field glides there
        return {
          ...st,
          density: c.density, flow: c.flow, goldRatio: c.goldRatio,
          constellationThreshold: c.constellationThreshold, geometryOpacity: c.geometryOpacity,
          filaments: c.filaments, motion: c.motion, cameraMode: c.cameraMode,
        };
      },
      set(k, v) {
        if (MORPH_KEYS.includes(k as MorphKey)) morph = null; // the hand outranks the glide
        (st as unknown as Record<string, unknown>)[k] = v as unknown;
        if (k === "speed") st.speed = clampSpeed(st.speed);
        if (k === "shutter") st.shutter = clampShutter(st.shutter);
        if (k === "cameraMode") rig.mode = st.cameraMode;
        applyToField();
        return { ...st };
      },
      random() { wanderStep(); return { ...st }; },
      recenter() { rig.recenter(); },
      zoom(factor) { rig.zoom(factor); },
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
    // keyboard — arrows turn, +/− travel, R comes home
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "SELECT" || el.tagName === "TEXTAREA")) return;
      switch (e.key) {
        case "ArrowLeft": rig.nudge(-1, 0); break;
        case "ArrowRight": rig.nudge(1, 0); break;
        case "ArrowUp": rig.nudge(0, 1); break;
        case "ArrowDown": rig.nudge(0, -1); break;
        case "+": case "=": case "PageUp": rig.zoom(0.93); break;
        case "-": case "_": case "PageDown": rig.zoom(1.075); break;
        case "r": case "R": case "Home": rig.recenter(); break;
        default: return;
      }
      e.preventDefault();
    };
    renderer.domElement.addEventListener("pointerdown", onDown);
    addEventListener("pointermove", onMove);
    addEventListener("pointerup", onUp);
    addEventListener("keydown", onKey);
    renderer.domElement.addEventListener("wheel", onWheel, { passive: false });

    const size = () => {
      const w = host.clientWidth, h = host.clientHeight;
      renderer.setSize(w, h, false);
      rig.setAspect(w / h);
      field.setViewport(renderer.domElement.height, rig.camera.fov);
    };
    size();
    const ro = new ResizeObserver(size);
    ro.observe(host);

    renderer.setClearColor(INK_CLEAR, 1);
    renderer.clear();

    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      // rAF's timestamp can precede the performance.now() taken at setup —
      // a negative dt walks time backwards and breaks every rig
      const dt = Math.max(0, Math.min(0.07, (now - last) / 1000));
      last = now;
      const bands = audio.read(st.speed);
      if (morph) {
        morph.t = Math.min(1, morph.t + dt / 2.4);
        const e = 0.5 - 0.5 * Math.cos(Math.PI * morph.t);
        for (const k of MORPH_KEYS) st[k] = morph.from[k] + (morph.to[k] - morph.from[k]) * e;
        if (!morph.mid && morph.t >= 0.5) {
          morph.mid = true;
          st.filaments = morph.to.filaments;
          st.motion = morph.to.motion;
          // unless the hand already chose a camera during the glide
          if (st.cameraMode === morph.fromCam) {
            st.cameraMode = morph.to.cameraMode;
            rig.mode = st.cameraMode;
          }
        }
        applyToField();
        if (morph.t >= 1) morph = null;
      }
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
      removeEventListener("keydown", onKey);
      renderer.domElement.removeEventListener("wheel", onWheel);
      audio.dispose();
      field.dispose();
      groundTex.dispose();
      renderer.dispose();
      host.removeChild(renderer.domElement);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={hostRef} style={{ position: "absolute", inset: 0 }} />;
}
