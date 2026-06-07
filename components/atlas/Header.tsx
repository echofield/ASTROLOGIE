"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// The AstroLab header — one component, the muted word-places + one gold invitation.
// No clock, no language switch, no day/night toggle, no nav icons (per the design's
// header.js). Routes with Next instead of in-page surface swaps.
export default function Header() {
  const path = usePathname();
  const on = (href: string, exact = false) => (exact ? path === href : path.startsWith(href));
  return (
    <>
      <style>{`
        .alab-bar{position:fixed;top:0;left:0;right:0;z-index:60;display:flex;align-items:center;justify-content:space-between;
          padding:clamp(18px,3vw,30px) clamp(20px,4vw,56px);
          background:linear-gradient(180deg,rgba(5,8,15,.96) 32%,rgba(5,8,15,.82) 68%,rgba(5,8,15,0) 100%);
          backdrop-filter:blur(7px);-webkit-backdrop-filter:blur(7px)}
        .alab-brand{display:flex;align-items:center;gap:13px;text-decoration:none}
        .alab-seal{width:7px;height:7px;background:#c2a25f;border-radius:50%;box-shadow:0 0 10px rgba(226,200,132,.7);flex:none}
        .alab-name{font-family:var(--font-display),'Cormorant Garamond',serif;font-size:23px;letter-spacing:.5px;color:#ece4d2;font-weight:500}
        .alab-nav{display:flex;align-items:center;gap:clamp(16px,3vw,30px)}
        .alab-place{font-family:var(--font-mono),'IBM Plex Mono',ui-monospace,monospace;font-size:11.5px;letter-spacing:.24em;text-transform:uppercase;
          color:#6f7894;text-decoration:none;transition:color .5s cubic-bezier(.165,.84,.44,1)}
        .alab-place:hover{color:#ece4d2}
        .alab-place.on{color:#e3c884}
        .alab-div{width:1px;height:18px;background:rgba(194,162,95,.18);flex:none}
        .alab-reading{font-family:var(--font-mono),'IBM Plex Mono',ui-monospace,monospace;font-size:11px;letter-spacing:.22em;text-transform:uppercase;
          color:#e3c884;border:1px solid #c2a25f;padding:8px 17px;text-decoration:none;
          transition:background .5s cubic-bezier(.165,.84,.44,1),color .5s,border-color .5s}
        .alab-reading:hover{background:rgba(194,162,95,.07);color:#f3e3bd;border-color:#e3c884}
        .alab-reading.on{border-color:#e3c884;color:#f3e3bd}
        @media(max-width:760px){.alab-bar{flex-wrap:wrap;gap:12px 0;padding:16px 20px}
          .alab-brand{order:1}.alab-name{font-size:20px}
          .alab-nav{order:3;width:100%;justify-content:flex-start;gap:14px 18px;flex-wrap:wrap}
          .alab-place{font-size:10.5px;letter-spacing:.14em}.alab-div{display:none}
          .alab-reading{font-size:10px;padding:6px 12px;letter-spacing:.16em}}
      `}</style>
      <header className="alab-bar">
        <Link className="alab-brand" href="/"><span className="alab-seal" /><span className="alab-name">The AstroLab</span></Link>
        <nav className="alab-nav">
          <Link className={`alab-place${on("/", true) ? " on" : ""}`} href="/">The Sky</Link>
          <Link className={`alab-place${on("/cabinet") ? " on" : ""}`} href="/cabinet">Cabinet</Link>
          <Link className="alab-place" href="/cabinet">Genius</Link>
          <span className="alab-div" />
          <Link className={`alab-reading${on("/reading") ? " on" : ""}`} href="/reading">The Reading</Link>
        </nav>
      </header>
    </>
  );
}
