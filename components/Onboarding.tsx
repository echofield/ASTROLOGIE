"use client";

import { useState } from "react";
import type { DomainId, NorthStar, Profile } from "@/lib/types";
import { DOMAINS, planetForDomain } from "@/lib/domains";
import { natalChart } from "@/lib/sky";
import { uid } from "@/lib/storage";

interface Props {
  onComplete: (profile: Profile, star: NorthStar) => void;
}

export default function Onboarding({ onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [domain, setDomain] = useState<DomainId | null>(null);
  const [intention, setIntention] = useState("");

  const canStep0 = date.trim().length > 0;
  const canFinish = domain !== null && intention.trim().length > 0;

  function finish() {
    if (!domain) return;
    const birthISO = `${date}T${time || "12:00"}`;
    const birth = new Date(birthISO);
    const natal = natalChart(birth, birthISO);
    const profile: Profile = {
      name: name.trim() || "Traveller",
      birthISO,
      natal,
      createdAt: new Date().toISOString(),
    };
    const star: NorthStar = {
      id: uid(),
      intention: intention.trim(),
      domain,
      anchor: natal.positions[planetForDomain(domain)],
      createdAt: new Date().toISOString(),
      active: true,
    };
    onComplete(profile, star);
  }

  return (
    <div className="center-col">
      {step === 0 && (
        <>
          <span className="kicker">Lodestar · the living sky</span>
          <h1 className="display-h">First, your fixed sky.</h1>
          <p className="lede">
            Your birth moment sets the stars you were born under — the quiet inner
            ring you&apos;ll always carry. The moving sky is read against it.
          </p>
          <div className="field">
            <label htmlFor="nm">Your name</label>
            <input id="nm" value={name} placeholder="optional"
              onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="bd">Date of birth</label>
            <input id="bd" type="date" value={date}
              onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="bt">Time of birth (if you know it)</label>
            <input id="bt" type="time" value={time}
              onChange={(e) => setTime(e.target.value)} />
          </div>
          <div style={{ marginTop: 24 }}>
            <button className="btn full" disabled={!canStep0} onClick={() => setStep(1)}>
              Cast my sky →
            </button>
          </div>
        </>
      )}

      {step === 1 && (
        <>
          <span className="kicker">Name your North Star</span>
          <h1 className="display-h">What are you reaching for?</h1>
          <p className="lede">
            Choose the kind of move it is. That anchors your star to a real point in
            your sky — and the Moon&apos;s passage to it becomes your window.
          </p>
          <div className="domains">
            {DOMAINS.map((d) => (
              <button
                key={d.id}
                className={`domain${domain === d.id ? " sel" : ""}`}
                onClick={() => setDomain(d.id)}
              >
                <span className="g">{d.glyph}</span>
                <span>
                  <span className="tt">{d.title}</span>
                  <span className="bb">{d.blurb}</span>
                </span>
              </button>
            ))}
          </div>
          <div className="field">
            <label htmlFor="int">In your words</label>
            <input id="int" value={intention}
              placeholder="Launch the thing I keep putting off…"
              onChange={(e) => setIntention(e.target.value)} />
          </div>
          <div style={{ marginTop: 22, display: "flex", gap: 10 }}>
            <button className="btn" onClick={() => setStep(0)}>←</button>
            <button className="btn full" disabled={!canFinish} onClick={finish}>
              Light my star ✶
            </button>
          </div>
        </>
      )}
    </div>
  );
}
