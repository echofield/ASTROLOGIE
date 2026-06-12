"use client";

// THE STUDIO — a private instrument, not a product surface. Mars plays the
// field, captures frames and clips; the output feeds reading PDFs and Reels.
// Desktop only by design (STUDIO_ENGINE §XI). Gated by the operator key.
import dynamic from "next/dynamic";
import { useCallback, useRef, useState } from "react";
import type { SignId } from "./engine/calibrations";
import type { StudioAPI, StudioState } from "./components/Scene";
import ControlPanel from "./components/ControlPanel";

const Scene = dynamic(() => import("./components/Scene"), { ssr: false });

const TOKENS = `
  .studio{--st-ink:#0A0E1A;--st-ivoire:#F8F5EB;--st-argent:#C9C5B8;--st-or:#D9C98A;
    --serif:'Cormorant Garamond',Georgia,serif;--mono:'IBM Plex Mono',ui-monospace,monospace}
  .st-fader{-webkit-appearance:none;appearance:none;width:100%;height:2px;background:rgba(217,201,138,.22);outline:none}
  .st-fader::-webkit-slider-thumb{-webkit-appearance:none;width:11px;height:11px;border-radius:50%;
    background:var(--st-or);border:1px solid var(--st-ink);cursor:pointer}
  .st-fader::-moz-range-thumb{width:11px;height:11px;border-radius:50%;background:var(--st-or);border:1px solid var(--st-ink);cursor:pointer}
`;

export default function StudioPage() {
  const [key, setKey] = useState("");
  const [authed, setAuthed] = useState(false);
  const [denied, setDenied] = useState(false);
  const apiRef = useRef<StudioAPI | null>(null);
  const [st, setSt] = useState<StudioState | null>(null);
  const [busy, setBusy] = useState(false);

  async function enter() {
    const k = key.trim();
    if (!k) return;
    try {
      const res = await fetch("/api/studio/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key: k }) });
      const data = await res.json();
      if (data.ok) { setAuthed(true); return; }
    } catch { /* fall through */ }
    setDenied(true);
  }

  const onReady = useCallback((api: StudioAPI) => {
    apiRef.current = api;
    setSt(api.state());
  }, []);

  const onSign = (s: SignId) => { const a = apiRef.current; if (a) setSt(a.setSign(s)); };
  const onSet = <K extends keyof StudioState>(k: K, v: StudioState[K]) => { const a = apiRef.current; if (a) setSt(a.set(k, v)); };

  if (!authed) {
    return (
      <main className="studio" style={{ minHeight: "100svh", background: "#0A0E1A", color: "#F8F5EB", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--mono)" }}>
        <style>{TOKENS}</style>
        <div style={{ width: 320 }}>
          <p style={{ fontSize: 10, letterSpacing: ".4em", textTransform: "uppercase", color: "#D9C98A", marginBottom: 6 }}>Studio</p>
          <p style={{ fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 15, color: "#C9C5B8", marginBottom: 18 }}>operator access</p>
          <input type="password" value={key} onChange={(e) => { setKey(e.target.value); setDenied(false); }}
            onKeyDown={(e) => { if (e.key === "Enter") enter(); }}
            placeholder="the key"
            style={{ width: "100%", background: "transparent", border: 0, borderBottom: "1px solid rgba(217,201,138,.3)", color: "#F8F5EB", fontFamily: "var(--mono)", fontSize: 14, padding: "8px 2px", outline: "none" }} />
          <button onClick={enter} style={{ marginTop: 18, background: "none", border: "1px solid #D9C98A", color: "#D9C98A", fontFamily: "var(--mono)", fontSize: 10, letterSpacing: ".3em", textTransform: "uppercase", padding: "11px 22px", cursor: "pointer" }}>
            Enter →
          </button>
          {denied && <p style={{ marginTop: 14, fontSize: 11, color: "#C9C5B8" }}>refused.</p>}
        </div>
      </main>
    );
  }

  return (
    <main className="studio" style={{ position: "fixed", inset: 0, background: "#0A0E1A", overflow: "hidden" }}>
      <style>{TOKENS}</style>
      <Scene onReady={onReady} />
      {st && (
        <ControlPanel
          st={st}
          onSign={onSign}
          onSet={onSet}
          onMic={async () => { const a = apiRef.current; if (!a) return; await a.useMic(); setSt(a.state()); }}
          onFile={async (f) => { const a = apiRef.current; if (!a) return; await a.useFile(f); setSt(a.state()); }}
          onAudioOff={() => { const a = apiRef.current; if (!a) return; a.audioOff(); setSt(a.state()); }}
          onCapture={async () => {
            const a = apiRef.current; if (!a || busy) return;
            setBusy(true);
            await a.toggleCapture();
            setSt(a.state());
            setBusy(false);
          }}
          busy={busy}
        />
      )}
      <p style={{ position: "absolute", left: 18, bottom: 14, zIndex: 5, fontFamily: "var(--mono)", fontSize: 8.5, letterSpacing: ".3em", textTransform: "uppercase", color: "rgba(201,197,184,.4)", pointerEvents: "none" }}>
        Astrolab Studio · private · drag to turn, scroll to travel
      </p>
    </main>
  );
}
