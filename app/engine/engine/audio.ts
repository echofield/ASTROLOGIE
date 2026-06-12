// STUDIO_ENGINE §VI — the AnalyserNode, four bands + the voice formant, exposed
// as reactive multipliers every frame. Audio modulates PARAMETERS (density,
// motion amplitude, flow, threshold pulse, gold pulse) — never palette, never
// camera. Tone.js routes mic / file / (Fable, later) through one analyser.
import * as Tone from "tone";

export type AudioSource = "none" | "mic" | "file";

export interface AudioBands {
  sub: number;     // 20–80 Hz   → density ×0.7..1.3
  bass: number;    // 80–250 Hz  → motion amplitude
  mid: number;     // 250–2k Hz  → flow ×0.5..1.5
  treble: number;  // 2k–8k Hz   → constellation threshold pulse
  formant: number; // 1k–3k Hz   → gold ratio pulse (the voice → gold blooms)
  flux: number;    // spectral onset — individual notes land as grain pulses
  level: number;   // overall, for the capture meter
}

// With no source the bands sit at NEUTRAL — the multipliers they feed resolve
// to ×1.0, so the silent field runs exactly at its calibration (§VI modulates
// around the calibration, it never redefines it).
export const NEUTRAL: AudioBands = { sub: 0.5, bass: 0.45, mid: 0.5, treble: 0, formant: 0, flux: 0, level: 0 };

export class AudioEngine {
  private analyser: Tone.Analyser | null = null;
  private mic: Tone.UserMedia | null = null;
  private player: Tone.Player | null = null;
  private recordDest: MediaStreamAudioDestinationNode | null = null;
  private smoothed: AudioBands = { ...NEUTRAL };
  source: AudioSource = "none";

  /** The audio track for capture — silent stream when source is none. */
  get captureStream(): MediaStream | null {
    return this.recordDest?.stream ?? null;
  }

  private prevSpec: Float32Array | null = null;

  private async ensureGraph() {
    await Tone.start();
    if (!this.analyser) {
      // 1024 bins — fine enough that single notes register as spectral flux,
      // not just the broad rhythm
      this.analyser = new Tone.Analyser("fft", 1024);
      // the raw context is an AudioContext in the browser (Offline never runs here)
      const raw = Tone.getContext().rawContext as AudioContext;
      this.recordDest = raw.createMediaStreamDestination();
    }
  }

  private disconnectInputs() {
    this.mic?.close(); this.mic?.disconnect(); this.mic = null;
    this.player?.stop(); this.player?.disconnect(); this.player = null;
  }

  async useMic(): Promise<boolean> {
    await this.ensureGraph();
    this.disconnectInputs();
    try {
      this.mic = new Tone.UserMedia();
      await this.mic.open();
      this.mic.connect(this.analyser!);
      this.mic.connect(this.recordDest! as unknown as Tone.InputNode);
      this.source = "mic";
      return true;
    } catch {
      this.source = "none";
      return false;
    }
  }

  async useFile(file: File): Promise<boolean> {
    await this.ensureGraph();
    this.disconnectInputs();
    try {
      const url = URL.createObjectURL(file);
      this.player = new Tone.Player({ url, loop: true, autostart: true });
      this.player.connect(this.analyser!);
      this.player.toDestination(); // the room hears the track
      this.player.connect(this.recordDest! as unknown as Tone.InputNode);
      this.source = "file";
      return true;
    } catch {
      this.source = "none";
      return false;
    }
  }

  off() {
    this.disconnectInputs();
    this.source = "none";
  }

  /** Per-frame bands, smoothed (speed scales the smoothing per §VII). */
  read(speed: number): AudioBands {
    if (!this.analyser || this.source === "none") {
      // ease home to neutral so cutting the source never snaps the field
      for (const key of Object.keys(this.smoothed) as (keyof AudioBands)[]) {
        this.smoothed[key] += (NEUTRAL[key] - this.smoothed[key]) * 0.06;
      }
      return this.smoothed;
    }
    const values = this.analyser.getValue() as Float32Array;
    const n = values.length; // 256 bins over ~0–22050 Hz → ~86 Hz/bin
    const hzPerBin = 22050 / n;
    const band = (lo: number, hi: number) => {
      const a = Math.max(0, Math.floor(lo / hzPerBin));
      const b = Math.min(n - 1, Math.ceil(hi / hzPerBin));
      let sum = 0;
      for (let i = a; i <= b; i++) sum += values[i];
      const db = sum / Math.max(1, b - a + 1); // dB, ~-100..0
      return Math.min(1, Math.max(0, (db + 90) / 70));
    };
    // spectral flux — the sum of every bin that just got louder. A struck note
    // lights bins its neighbors didn't; the broad rhythm doesn't.
    let flux = 0;
    if (this.prevSpec && this.prevSpec.length === n) {
      for (let i = 0; i < n; i++) {
        const v = Math.min(1, Math.max(0, (values[i] + 90) / 70));
        const pv = Math.min(1, Math.max(0, (this.prevSpec[i] + 90) / 70));
        if (v > pv) flux += v - pv;
      }
      flux = Math.min(1, (flux / n) * 26);
    }
    if (!this.prevSpec || this.prevSpec.length !== n) this.prevSpec = new Float32Array(n);
    this.prevSpec.set(values);

    const raw: AudioBands = {
      sub: band(20, 80),
      bass: band(80, 250),
      mid: band(250, 2000),
      treble: band(2000, 8000),
      formant: band(1000, 3000),
      flux,
      level: band(20, 8000),
    };
    const k = Math.min(0.5, 0.12 * speed + 0.06);
    for (const key of Object.keys(raw) as (keyof AudioBands)[]) {
      // flux strikes fast and lets go slow — that's what makes a note FELT
      const kk = key === "flux" ? (raw.flux > this.smoothed.flux ? 0.7 : 0.1) : k;
      this.smoothed[key] += (raw[key] - this.smoothed[key]) * kk;
    }
    return this.smoothed;
  }

  dispose() {
    this.off();
    this.analyser?.dispose(); this.analyser = null;
  }
}
