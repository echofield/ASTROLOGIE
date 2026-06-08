"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

// The AstroLab header — ported verbatim from header.js (.topbar styles live in
// astrolab.css). Identity · three muted word-places · the gold invitation. The
// Sky is a real dropdown (Calendar · Atlas). Routes with Next.
export default function Header() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const groupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => { if (groupRef.current && !groupRef.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  const on = (href: string, exact = false) => (exact ? path === href : path.startsWith(href));

  return (
    <header className="topbar">
      <Link className="brand" href="/"><span className="seal" /><span className="name">The AstroLab</span></Link>
      <nav className="nav">
        <div className={`nav-group${open ? " open" : ""}`} ref={groupRef}>
          <button className="place group-label" type="button" onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}>
            The Sky<span className="caret"><svg viewBox="0 0 10 7"><path d="M1 1.5l4 4 4-4" /></svg></span>
          </button>
          <div className="nav-menu">
            <Link className="menu-item" href="/cabinet?screen=calendar" onClick={() => setOpen(false)}>Calendar</Link>
            <Link className="menu-item" href="/atlas" onClick={() => setOpen(false)}>Atlas</Link>
          </div>
        </div>
        <Link className={`place${on("/cabinet") ? " on" : ""}`} href="/cabinet">Cabinet</Link>
        <Link className="place" href="/cabinet?screen=genius">Genius</Link>
        <span className="nav-div" />
        <Link className={`nav-reading${on("/reading") ? " on" : ""}`} href="/reading">The Reading</Link>
      </nav>
    </header>
  );
}
