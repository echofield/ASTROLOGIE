"use client";

import { Cap, Btn } from "@/components/sky/chrome";
import { FD, FT, type Palette } from "@/lib/theme";
import type { CompleteRead } from "@/lib/storage";

interface Section {
  key: keyof CompleteRead;
  title: string;
}

interface Props {
  pal: Palette;
  read: CompleteRead;
  sections: Section[];
  savePdf: string;
}

export default function ReadArtifact({ pal, read, sections, savePdf }: Props) {
  const panel = {
    padding: "16px 18px",
    background: pal.panel,
    border: `1px solid ${pal.panelLine}`,
    borderRadius: 3,
  };

  return (
    <div id="read-artifact" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {sections.map(({ key, title }) => {
        const body = read[key];
        if (typeof body !== "string" || !body) return null;
        return (
          <div key={key} style={panel}>
            <Cap pal={pal}>{title}</Cap>
            <div style={{ fontFamily: FT, fontSize: 15, lineHeight: 1.65, color: pal.ink, marginTop: 12, whiteSpace: "pre-wrap" }}>
              {body}
            </div>
          </div>
        );
      })}
      <div style={{ fontFamily: FD, fontStyle: "italic", fontSize: 13, color: pal.inkSoft, marginTop: 4 }}>
        {read.generatedAt.slice(0, 10)}
      </div>
      <div>
        <Btn pal={pal} onClick={() => window.print()}>{savePdf}</Btn>
      </div>
    </div>
  );
}
