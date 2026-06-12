// STUDIO_ENGINE §VII — time control. One multiplier for every time-based
// animation (drift, geometry rotation, camera, analyser smoothing) and a
// shutter amount for accumulated-frame trails. Ritual pace is the default.
export interface TimeState {
  speed: number;   // 0.1..4.0, default 1.0 (adagio)
  shutter: number; // 0..1 trail amount, default 0.18 (gentle)
}

export const DEFAULT_TIME: TimeState = { speed: 1.0, shutter: 0.18 };

export const clampSpeed = (v: number) => Math.min(4, Math.max(0.1, v));
export const clampShutter = (v: number) => Math.min(1, Math.max(0, v));
