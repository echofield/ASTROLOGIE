"use client";

interface Props {
  ticks?: number;
  dormant?: boolean;
  wake?: boolean;
  pulse?: boolean;
  onClick?: () => void;
}

export default function Genius({ ticks = 5, dormant, wake, pulse, onClick }: Props) {
  const cls = `genius${dormant ? " dormant" : ""}${wake ? " wake" : ""}${pulse ? " pulse" : ""}`;
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
