"use client";

import Link from "next/link";
import { SIGN_NAMES } from "@/lib/sky";
import { MOON_GLOSS, HOUR_GLOSS, SUN_GLOSS, degreesInWords } from "@/lib/atlas/gloss";
import { phaseWord, type SkyTonightData } from "@/lib/atlas/use-sky-tonight";

// THE SKY TONIGHT — the observation log panel. Three live entries (computed,
// never frozen) and the fourth entry that is the door. Each entry binds back
// to the wheel on hover: the panel and the wheel are one organism.
export type Bind = "moon" | "hour" | "sun" | null;

export default function SkyTonight({ sky, onBind }: { sky: SkyTonightData; onBind: (b: Bind) => void }) {
  const date = sky.now.toLocaleDateString("en-GB", { day: "numeric", month: "long" });
  const moonStatement = `${phaseWord(sky.moon.phaseIdx, sky.moon.waxing)} in ${SIGN_NAMES[sky.moon.signIdx]}, ${degreesInWords(sky.moon.degInSign)} degrees.`;
  const hourStatement = `${sky.hour.ruler} holds this hour.`;
  const sunStatement = `The Sun stands at ${Math.floor(sky.sun.degInSign)}° ${SIGN_NAMES[sky.sun.signIdx]}.`;

  const entry = (bind: Bind, label: string, statement: string, gloss: string) => (
    <div className="skp-entry" onMouseEnter={() => onBind(bind)} onMouseLeave={() => onBind(null)}>
      <span className="skp-label">{label}</span>
      <p className="skp-statement">{statement}</p>
      <p className="skp-gloss">{gloss}</p>
    </div>
  );

  return (
    <aside className="skp" aria-label="The sky tonight">
      <header className="skp-head">
        <span>The Sky Tonight</span>
        <span className="skp-date">{date}</span>
      </header>
      {entry("moon", "The Moon", moonStatement, MOON_GLOSS[sky.moon.phaseIdx])}
      {entry("hour", "The Hour", hourStatement, HOUR_GLOSS[sky.hour.ruler])}
      {entry("sun", "Today", sunStatement, SUN_GLOSS[sky.sun.signIdx])}
      {/* the fourth entry is the door — same typographic system, and it converts */}
      <Link href="/reading" className="skp-entry skp-door">
        <span className="skp-label">The Rest</span>
        <p className="skp-statement">is written by hand. <span className="ar">→</span></p>
      </Link>
    </aside>
  );
}
