"use client";

// The freshness discipline. Any surface that says "tonight" or "today" must keep
// being right without a reload — including across local midnight. This hook is the
// single clock those surfaces share: it ticks on an interval (and immediately when
// the tab returns), and exposes a local dayKey that flips exactly at midnight so
// heavy recomputation can depend on the day, not the minute.
import { useEffect, useState } from "react";

const localDayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;

export function useSkyNow(tickMs = 60_000): { now: Date; dayKey: string } {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const tick = () => setNow(new Date());
    const id = setInterval(tick, tickMs);
    const vis = () => { if (!document.hidden) tick(); };
    document.addEventListener("visibilitychange", vis);
    return () => { clearInterval(id); document.removeEventListener("visibilitychange", vis); };
  }, [tickMs]);
  return { now, dayKey: localDayKey(now) };
}
