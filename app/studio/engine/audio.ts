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
  level: number;   // overall, for the capture meter
}

export const SILENT: AudioBands = { sub: 0, bass: 0, mid: 0, treble: 0, formant: 0, level: 0 };

export class AudioEngine {
  private analyser: Tone.Analyser | null = null;
  private mic: Tone.UserMedia | null = null;
  private player: Tone.Player | null = null;
  private recordDest: MediaStreamAudioDestinationNode | null = null;
  private smoothed: AudioBands = { ...SILENT };
  source: AudioSource = "none";

  /** The audio track for capture — silent stream when source is none. */
  get captureStream(): MediaStream | null {
    return this.recordDest?.stream ?? null;
  }

  private async ensureGraph() {
    await Tone.start();
    if (!this.analyser) {
      this.analyser = new Tone.Analyser("fft", 256);
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
    this.smoothed = { ...SILENT };
  }

  /** Per-frame bands, smoothed (speed scales the smoothing per §VII). */
  read(speed: number): AudioBands {
    if (!this.analyser || this.source === "none") return this.smoothed;
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
    const raw: AudioBands = {
      sub: band(20, 80),
      bass: band(80, 250),
      mid: band(250, 2000),
      treble: band(2000, 8000),
      formant: band(1000, 3000),
      level: band(20, 8000),
    };
    const k = Math.min(0.5, 0.12 * speed + 0.06);
    for (const key of Object.keys(raw) as (keyof AudioBands)[]) {
      this.smoothed[key] += (raw[key] - this.smoothed[key]) * k;
    }
    return this.smoothed;
  }

  dispose() {
    this.off();
    this.analyser?.dispose(); this.analyser = null;
  }
}
