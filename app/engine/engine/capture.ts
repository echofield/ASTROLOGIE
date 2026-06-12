// STUDIO_ENGINE §X — capture. Canvas stream at 60fps + the live audio track,
// recorded until stopped, exported client-side as .webm to local downloads.
// No upload, no cloud. Sovereign.
export class Capture {
  private recorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  recording = false;

  start(canvas: HTMLCanvasElement, audio: MediaStream | null) {
    if (this.recording) return;
    const stream = canvas.captureStream(60);
    if (audio) for (const track of audio.getAudioTracks()) stream.addTrack(track);
    const mime = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
      ? "video/webm;codecs=vp9,opus"
      : "video/webm";
    this.chunks = [];
    this.recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 12_000_000 });
    this.recorder.ondataavailable = (e) => { if (e.data.size) this.chunks.push(e.data); };
    this.recorder.start(500);
    this.recording = true;
  }

  stop(sign: string): Promise<void> {
    return new Promise((resolve) => {
      const rec = this.recorder;
      if (!rec) { this.recording = false; resolve(); return; }
      rec.onstop = () => {
        const blob = new Blob(this.chunks, { type: rec.mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
        a.href = url;
        a.download = `astrolab-studio-${sign}-${ts}.webm`;
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 2000);
        this.recorder = null; this.chunks = []; this.recording = false;
        resolve();
      };
      rec.stop();
    });
  }
}
