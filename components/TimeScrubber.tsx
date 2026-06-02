"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface Props {
  offset: number; // hours
  max: number; // hours
  glyph: string;
  onChange: (hours: number) => void;
}

export default function TimeScrubber({ offset, max, glyph, onChange }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const measure = () => setWidth(el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const fromClientX = useCallback(
    (clientX: number) => {
      const el = trackRef.current;
      if (!el) return offset;
      const b = el.getBoundingClientRect();
      const x = Math.max(0, Math.min(b.width, clientX - b.left));
      return (x / b.width) * max;
    },
    [max, offset],
  );

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: PointerEvent) => {
      e.preventDefault();
      onChange(fromClientX(e.clientX));
    };
    const onUp = () => setDragging(false);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [dragging, fromClientX, onChange]);

  const left = max > 0 ? (offset / max) * width : 0;

  return (
    <div
      className="track"
      ref={trackRef}
      onPointerDown={(e) => {
        setDragging(true);
        onChange(fromClientX(e.clientX));
      }}
    >
      <div className="rail" />
      <div className="ticks">
        {Array.from({ length: 25 }).map((_, i) => (
          <b key={i} />
        ))}
      </div>
      <div className="thumb" style={{ left: `${left}px` }}>
        <b>{glyph}</b>
      </div>
    </div>
  );
}
