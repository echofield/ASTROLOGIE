"use client";

interface Props {
  ticks?: number;
  dormant?: boolean;
  wake?: boolean;
  onClick?: () => void;
}

export default function Genius({ ticks = 5, dormant, wake, onClick }: Props) {
  const cls = `genius${dormant ? " dormant" : ""}${wake ? " wake" : ""}`;
  return (
    <div className={cls} onClick={onClick} aria-hidden>
      <div className="shadow" />
      <div className="ticks">
        {Array.from({ length: ticks }).map((_, i) => (
          <i key={i} style={{ transform: `rotate(${(360 / ticks) * i}deg)` }} />
        ))}
      </div>
      <div className="ring"><i /></div>
      <div className="ring2" />
      <div className="body" />
    </div>
  );
}
