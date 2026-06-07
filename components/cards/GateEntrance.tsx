"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { prefersReducedMotion, sec } from "@/lib/motion";

// Passing through the gate: the arch-card arrives, then the camera zooms THROUGH
// the arch while the cover fades — revealing the territory waiting behind it.
export default function GateEntrance({ src, onDone }: { src: string; onDone: () => void }) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const el = root.current;
    if (!el) return;
    if (prefersReducedMotion()) { onDone(); return; }
    const img = el.querySelector(".gate-img");
    const tl = gsap.timeline({ onComplete: onDone });
    tl.fromTo(img,
      { scale: 0.86, opacity: 0, filter: "brightness(0.6)" },
      { scale: 1, opacity: 1, filter: "brightness(1)", duration: sec("contemplative"), ease: "power2.out" })
      .to(img, { scale: 3.4, opacity: 0, filter: "brightness(1.4)", duration: sec("contemplative"), ease: "power2.in" }, "+=0.3")
      .to(el, { backgroundColor: "rgba(3,11,30,0)", duration: sec("contemplative"), ease: "power1.in" }, "<");
  }, { scope: root });

  return (
    <div ref={root} onClick={onDone} style={{
      position: "fixed", inset: 0, zIndex: 50, background: "#030B1E",
      display: "grid", placeItems: "center", cursor: "pointer",
    }}>
      <div className="gate-img" style={{
        height: "86vh", aspectRatio: "2 / 3", backgroundImage: `url(${src})`,
        backgroundSize: "cover", backgroundPosition: "center", borderRadius: 8,
        boxShadow: "0 30px 90px rgba(0,0,0,0.6)",
      }} />
    </div>
  );
}
