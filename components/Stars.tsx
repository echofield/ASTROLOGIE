"use client";

import { useMemo } from "react";

export default function Stars({ count = 46 }: { count?: number }) {
  const stars = useMemo(
    () =>
      Array.from({ length: count }).map(() => ({
        left: Math.random() * 100,
        top: Math.random() * 70,
        delay: (Math.random() * 4).toFixed(1),
      })),
    [count],
  );
  return (
    <div className="stars" aria-hidden>
      {stars.map((s, i) => (
        <i key={i} style={{ left: `${s.left}%`, top: `${s.top}%`, animationDelay: `${s.delay}s` }} />
      ))}
    </div>
  );
}
