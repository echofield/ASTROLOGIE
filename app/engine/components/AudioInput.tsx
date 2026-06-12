"use client";

// STUDIO_ENGINE §VI inputs — mic / file / fable / none, one analyser behind all.
// Fable ships disabled: lib/tts is dormant (the voice seam); when it wakes, its
// output routes through the same pipeline — no caller change. TODO(tts).
import { useRef } from "react";

export default function AudioInput({
  source, onMic, onFile, onOff,
}: {
  source: "none" | "mic" | "file";
  onMic: () => void;
  onFile: (f: File) => void;
  onOff: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const chip = (on: boolean): React.CSSProperties => ({
    background: "none", border: "1px solid", borderColor: on ? "var(--st-or)" : "rgba(217,201,138,.18)",
    color: on ? "var(--st-or)" : "var(--st-argent)", fontFamily: "var(--mono)", fontSize: 9,
    letterSpacing: ".22em", textTransform: "uppercase", padding: "6px 10px", cursor: "pointer",
  });
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      <button style={chip(source === "none")} onClick={onOff}>None</button>
      <button style={chip(source === "mic")} onClick={onMic}>Mic</button>
      <button style={chip(source === "file")} onClick={() => fileRef.current?.click()}>File</button>
      <button style={{ ...chip(false), opacity: 0.35, cursor: "default" }} title="TODO: the voice seam (lib/tts) is dormant — wires here when it wakes" disabled>Fable</button>
      <input ref={fileRef} type="file" accept="audio/*" hidden
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.currentTarget.value = ""; }} />
    </div>
  );
}
