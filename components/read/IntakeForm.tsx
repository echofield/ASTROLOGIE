"use client";

import { useState, type CSSProperties } from "react";
import { Cap, Btn } from "@/components/sky/chrome";
import { FD, FT, type Palette } from "@/lib/theme";

export interface IntakeAnswers {
  season: string;
  repeating: string;
  afraid: string;
}

interface Props {
  pal: Palette;
  copy: {
    cap: string;
    title: string;
    season: string;
    repeating: string;
    afraid: string;
    submit: string;
    generating: string;
  };
  onSubmit: (answers: IntakeAnswers) => void;
  generating?: boolean;
}

const fieldStyle = (pal: Palette): CSSProperties => ({
  display: "block",
  width: "100%",
  marginTop: 7,
  background: "transparent",
  border: "none",
  borderBottom: `1px solid ${pal.panelLine}`,
  color: pal.ink,
  fontFamily: FT,
  fontSize: 15,
  lineHeight: 1.5,
  padding: "8px 2px",
  outline: "none",
  resize: "vertical",
  minHeight: 72,
});

export default function IntakeForm({ pal, copy, onSubmit, generating }: Props) {
  const [season, setSeason] = useState("");
  const [repeating, setRepeating] = useState("");
  const [afraid, setAfraid] = useState("");

  const ready = season.trim() && repeating.trim() && afraid.trim();

  return (
    <div style={{ width: "100%", maxWidth: 420, margin: "0 auto", textAlign: "left" }} className="astro-fade">
      <Cap pal={pal}>{copy.cap}</Cap>
      <div style={{ fontFamily: FD, fontStyle: "italic", fontSize: 30, marginTop: 14, color: pal.ink, lineHeight: 1.15 }}>
        {copy.title}
      </div>
      {([[copy.season, season, setSeason], [copy.repeating, repeating, setRepeating], [copy.afraid, afraid, setAfraid]] as const).map(([label, val, set]) => (
        <label key={label} style={{ display: "block", marginTop: 22 }}>
          <span style={{ fontFamily: FT, fontSize: 9.5, letterSpacing: 2, textTransform: "uppercase", color: pal.inkSoft }}>{label}</span>
          <textarea value={val} onChange={(e) => set(e.target.value)} style={fieldStyle(pal)} rows={3} />
        </label>
      ))}
      <div style={{ marginTop: 34 }}>
        <Btn pal={pal} solid disabled={!ready || generating} onClick={() => onSubmit({ season: season.trim(), repeating: repeating.trim(), afraid: afraid.trim() })}>
          {generating ? copy.generating : copy.submit}
        </Btn>
      </div>
    </div>
  );
}
