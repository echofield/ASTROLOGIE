"use client";

import { useEffect, useState } from "react";
import type { Palette } from "@/lib/theme";
import { FD, FT } from "@/lib/theme";
import { Cap, Btn } from "@/components/sky/chrome";
import { speak, cancelSpeech, ttsEnabled } from "@/lib/tts";

interface Sec { title: string; body: string }

// The arrival — the read DESCENDS one movement at a time, paced and grave,
// rather than dumping as a wall. Voice seam wired (silent until enabled).
export default function ReadCeremony({
  pal, sections, labels, onDone,
}: {
  pal: Palette;
  sections: Sec[];
  labels: { cap: string; continue: string; keep: string; of: (a: number, b: number) => string };
  onDone: () => void;
}) {
  const [idx, setIdx] = useState(0);
  const sec = sections[idx];
  useEffect(() => {
    if (ttsEnabled() && sec) void speak(sec.body);
    return () => cancelSpeech();
  }, [idx, sec]);

  const last = idx >= sections.length - 1;
  if (!sec) return null;

  return (
    <div style={{ maxWidth: 580, margin: "0 auto", width: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <Cap pal={pal}>{labels.cap}</Cap>
        <span style={{ fontFamily: FT, fontSize: 11, letterSpacing: 2, color: pal.inkSoft }}>{labels.of(idx + 1, sections.length)}</span>
      </div>
      <div key={idx} className="astro-fade">
        <div style={{ fontFamily: FD, fontStyle: "italic", fontSize: 30, color: pal.brass, marginTop: 18, lineHeight: 1.1 }}>{sec.title}</div>
        <div style={{ fontFamily: FT, fontSize: 16, lineHeight: 1.7, color: pal.ink, marginTop: 14, maxHeight: "48vh", overflowY: "auto", whiteSpace: "pre-wrap" }}>{sec.body}</div>
      </div>
      <div style={{ marginTop: 26 }}>
        <Btn pal={pal} solid onClick={() => (last ? onDone() : setIdx(idx + 1))}>{last ? labels.keep : labels.continue}</Btn>
      </div>
    </div>
  );
}
