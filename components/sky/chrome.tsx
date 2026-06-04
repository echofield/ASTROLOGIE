"use client";

import type { CSSProperties, ReactNode } from "react";
import { type Palette, FD, FT, FG, FN } from "@/lib/theme";

export function Cap({ pal, children, style }: { pal: Palette; children: ReactNode; style?: CSSProperties }) {
  return (
    <div style={{ fontFamily: FT, fontWeight: 500, letterSpacing: 3, textTransform: "uppercase",
      fontSize: 11, color: pal.brass, ...style }}>{children}</div>
  );
}

export function Btn({ pal, children, solid, onClick, disabled, style }: {
  pal: Palette; children: ReactNode; solid?: boolean; onClick?: () => void; disabled?: boolean; style?: CSSProperties;
}) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      appearance: "none", cursor: disabled ? "not-allowed" : "pointer", display: "inline-flex",
      alignItems: "center", justifyContent: "center", padding: "13px 32px", borderRadius: 30,
      border: `1px solid ${solid ? "transparent" : pal.accent}`,
      background: solid ? pal.accent : "transparent", color: solid ? pal.btnInk : pal.accent,
      fontFamily: FT, fontWeight: 500, letterSpacing: 3, textTransform: "uppercase", fontSize: 12,
      opacity: disabled ? 0.4 : 1,
      boxShadow: pal.theme === "night" && solid && !disabled ? `0 0 26px ${pal.accent}55` : "none", ...style,
    }}>{children}</button>
  );
}

export function StatusBar({ pal, date }: { pal: Palette; date: Date }) {
  const t = date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 14,
      fontSize: 13, color: pal.ink, flexShrink: 0 }}>
      <span style={{ fontFamily: FN, fontVariantNumeric: "tabular-nums" }}>{t}</span>
      <span style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: FD, fontSize: 15 }}>
        <span style={{ width: 6, height: 6, borderRadius: 4, background: pal.brass }} />Astrolabe
      </span>
    </div>
  );
}

export function ModeToggle({ night, onToggle, pal }: { night: boolean; onToggle: () => void; pal: Palette }) {
  return (
    <button onClick={onToggle} title="Day / Night" style={{
      appearance: "none", cursor: "pointer", width: 52, height: 28, borderRadius: 16,
      border: `1px solid ${pal.panelLine}`, background: pal.panel, position: "relative", flexShrink: 0,
    }}>
      <span style={{ position: "absolute", top: 2, left: night ? 26 : 2, width: 22, height: 22, borderRadius: 12,
        background: night ? pal.brass : pal.accent, transition: "left .35s cubic-bezier(.4,0,.2,1)",
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: pal.btnInk,
        fontFamily: FG }}>{night ? "☽" : "☉"}</span>
    </button>
  );
}

export type TabId = "cabinet" | "theme" | "star" | "genius";

export function TabBar({ pal, active, onTab }: { pal: Palette; active: TabId; onTab: (t: TabId) => void }) {
  const tabs: [TabId, string, string][] = [
    ["cabinet", "⌂", "Cabinet"], ["theme", "◉", "Theme"],
    ["star", "★", "Star"], ["genius", "◎", "Genius"],
  ];
  return (
    <div style={{ display: "flex", borderTop: `1px solid ${pal.panelLine}`,
      background: pal.theme === "night" ? "rgba(0,0,0,.25)" : "rgba(255,255,255,.18)", flexShrink: 0 }}>
      {tabs.map(([id, ic, label]) => {
        const on = id === active;
        return (
          <button key={id} onClick={() => onTab(id)} style={{ appearance: "none", background: "none", border: "none",
            cursor: "pointer", flex: 1, textAlign: "center", padding: "10px 0 16px", color: on ? pal.accent : pal.inkSoft }}>
            <div style={{ fontFamily: FG, fontSize: 16, lineHeight: 1 }}>{ic}</div>
            <div style={{ fontFamily: FD, fontStyle: "italic", fontSize: 12.5, marginTop: 3 }}>{label}</div>
            {on && <div style={{ width: 14, height: 2, background: pal.accent, margin: "4px auto 0", borderRadius: 2 }} />}
          </button>
        );
      })}
    </div>
  );
}
