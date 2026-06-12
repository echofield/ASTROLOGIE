"use client";

// STUDIO_ENGINE §IX — the instrument's controls. Eight faders, sign selector,
// audio toggle, time/shutter, camera mode, capture, wander. One column on the
// right edge. Cormorant italic labels, mono values, Ink panel, Or accents.
import type { Filament, Motion, SignId } from "../engine/calibrations";
import { CALIBRATIONS, SIGN_ORDER } from "../engine/calibrations";
import type { CameraMode } from "../engine/camera";
import type { StudioState } from "./Scene";
import AudioInput from "./AudioInput";

const FILAMENTS: Filament[] = ["sharp", "soft", "paired", "branching", "spoke", "lattice", "vector"];
const MOTIONS: Motion[] = ["burst", "concentric", "oscillation", "tidal", "bloom", "crystalline", "equilibrium", "infall", "trajectory", "ascent", "network", "vortex"];
const CAMERAS: CameraMode[] = ["orbit", "dolly-through", "static-radial"];

function Fader({ label, value, min = 0, max = 1, step = 0.01, onChange }: {
  label: string; value: number; min?: number; max?: number; step?: number; onChange: (v: number) => void;
}) {
  return (
    <label style={{ display: "block", marginBottom: 14 }}>
      <span style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
        <em style={{ fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 13.5, color: "var(--st-ivoire)" }}>{label}</em>
        <span style={{ fontFamily: "var(--mono)", fontSize: 9.5, color: "var(--st-or)", letterSpacing: ".08em" }}>{value.toFixed(2)}</span>
      </span>
      <input className="st-fader" type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))} />
    </label>
  );
}

function Chips<T extends string>({ items, value, onPick, disabled }: { items: T[]; value: T; onPick: (v: T) => void; disabled?: (v: T) => boolean }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 14 }}>
      {items.map((it) => {
        const off = disabled?.(it) ?? false;
        const on = it === value;
        return (
          <button key={it} disabled={off}
            title={off ? "TODO: awaits its creative pass" : undefined}
            onClick={() => onPick(it)}
            style={{
              background: on ? "rgba(217,201,138,.10)" : "none",
              border: "1px solid", borderColor: on ? "var(--st-or)" : "rgba(217,201,138,.16)",
              color: off ? "rgba(201,197,184,.35)" : on ? "var(--st-or)" : "var(--st-argent)",
              fontFamily: "var(--mono)", fontSize: 8.5, letterSpacing: ".16em", textTransform: "uppercase",
              padding: "5px 8px", cursor: off ? "default" : "pointer",
            }}>{it}</button>
        );
      })}
    </div>
  );
}

const H = ({ children }: { children: React.ReactNode }) => (
  <p style={{ fontFamily: "var(--mono)", fontSize: 8.5, letterSpacing: ".3em", textTransform: "uppercase", color: "rgba(217,201,138,.65)", margin: "18px 0 8px" }}>{children}</p>
);

export default function ControlPanel({ st, onSign, onSet, onMic, onFile, onAudioOff, onCapture, onRandom, onRecenter, onZoom, busy }: {
  st: StudioState;
  onSign: (s: SignId) => void;
  onSet: <K extends keyof StudioState>(k: K, v: StudioState[K]) => void;
  onMic: () => void;
  onFile: (f: File) => void;
  onAudioOff: () => void;
  onCapture: () => void;
  onRandom: () => void;
  onRecenter: () => void;
  onZoom: (factor: number) => void;
  busy: boolean;
}) {
  return (
    <aside style={{
      position: "absolute", top: 0, right: 0, bottom: 0, width: 248, overflowY: "auto",
      background: "rgba(10,14,26,.88)", borderLeft: "1px solid rgba(217,201,138,.14)",
      padding: "18px 16px 28px", zIndex: 5,
    }}>
      <p style={{ fontFamily: "var(--mono)", fontSize: 9, letterSpacing: ".4em", textTransform: "uppercase", color: "var(--st-or)", marginBottom: 4 }}>Studio</p>
      <p style={{ fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 12.5, color: "var(--st-argent)", marginBottom: 14 }}>the field, played by hand</p>

      <H>The sign</H>
      <Chips items={SIGN_ORDER} value={st.sign} onPick={onSign} disabled={(s) => !CALIBRATIONS[s].ready} />

      <H>The field</H>
      <Fader label="Density" value={st.density} onChange={(v) => onSet("density", v)} />
      <Fader label="Flow" value={st.flow} onChange={(v) => onSet("flow", v)} />
      <Fader label="Gold ratio" value={st.goldRatio} onChange={(v) => onSet("goldRatio", v)} />
      <Fader label="Constellation" value={st.constellationThreshold} onChange={(v) => onSet("constellationThreshold", v)} />
      <Fader label="Geometry" value={st.geometryOpacity} onChange={(v) => onSet("geometryOpacity", v)} />

      <H>Filaments</H>
      <Chips items={FILAMENTS} value={st.filaments} onPick={(v) => onSet("filaments", v)} />
      <H>Motion</H>
      <Chips items={MOTIONS} value={st.motion} onPick={(v) => onSet("motion", v)} />

      <H>Time</H>
      <Fader label="Speed" value={st.speed} min={0.1} max={4} step={0.05} onChange={(v) => onSet("speed", v)} />
      <Fader label="Shutter" value={st.shutter} onChange={(v) => onSet("shutter", v)} />

      <H>Camera</H>
      <Chips items={CAMERAS} value={st.cameraMode} onPick={(v) => onSet("cameraMode", v)} />
      <div style={{ display: "flex", gap: 5, marginTop: -6, marginBottom: 6 }}>
        {([["− out", 1.18], ["Recenter · R", 0], ["+ in", 0.85]] as [string, number][]).map(([label, f]) => (
          <button key={label} onClick={() => (f === 0 ? onRecenter() : onZoom(f))} style={{
            flex: label.startsWith("Recenter") ? 1.6 : 1, background: "none",
            border: "1px solid rgba(201,197,184,.25)", color: "var(--st-argent)",
            fontFamily: "var(--mono)", fontSize: 8.5, letterSpacing: ".18em",
            textTransform: "uppercase", padding: "7px 4px", cursor: "pointer",
          }}>{label}</button>
        ))}
      </div>

      <H>Audio</H>
      <AudioInput source={st.audioSource} onMic={onMic} onFile={onFile} onOff={onAudioOff} />

      <H>Session</H>
      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
        <button onClick={onCapture} disabled={busy} style={{
          flex: 1, background: st.recording ? "rgba(217,201,138,.16)" : "none",
          border: "1px solid var(--st-or)", color: "var(--st-or)",
          fontFamily: "var(--mono)", fontSize: 9.5, letterSpacing: ".24em", textTransform: "uppercase",
          padding: "10px 8px", cursor: "pointer",
        }}>{st.recording ? "■ Stop" : "● Capture"}</button>
        <button onClick={() => onSet("wander", !st.wander)} style={{
          flex: 1, background: st.wander ? "rgba(217,201,138,.16)" : "none",
          border: "1px solid rgba(217,201,138,.3)", color: st.wander ? "var(--st-or)" : "var(--st-argent)",
          fontFamily: "var(--mono)", fontSize: 9.5, letterSpacing: ".24em", textTransform: "uppercase",
          padding: "10px 8px", cursor: "pointer",
        }}>Wander</button>
      </div>
      <button onClick={onRandom} style={{
        width: "100%", marginTop: 8, background: "none",
        border: "1px solid rgba(217,201,138,.3)", color: "var(--st-argent)",
        fontFamily: "var(--mono)", fontSize: 9.5, letterSpacing: ".24em", textTransform: "uppercase",
        padding: "10px 8px", cursor: "pointer",
      }}>Random</button>
    </aside>
  );
}
