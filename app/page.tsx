"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Stars from "@/components/Stars";
import Onboarding from "@/components/Onboarding";
import AstrolabeWheel from "@/components/AstrolabeWheel";
import TimeScrubber from "@/components/TimeScrubber";
import Constellation from "@/components/Constellation";
import { paletteAt } from "@/lib/palette";
import { ASPECTS, contact, liveSky, lonOf, nextWindow } from "@/lib/sky";
import { stageForSealed, toNextStage } from "@/lib/stage";
import { DOMAIN_BY_ID } from "@/lib/domains";
import type { NorthStar, Passage, Profile } from "@/lib/types";
import {
  addPassage,
  getActiveNorthStar,
  getPassages,
  getProfile,
  resetAll,
  saveNorthStar,
  saveProfile,
  uid,
} from "@/lib/storage";

const MAX_HOURS = 48;

function pad(n: number) {
  return String(n).padStart(2, "0");
}

/** Smallest distance from the Moon to an exact *harmonious* aspect with the anchor. */
function harmoniousOrb(sep: number): number {
  let best = Infinity;
  for (const a of ASPECTS) {
    if (a.tone !== "harmony") continue;
    best = Math.min(best, Math.abs(sep - a.angle));
  }
  return best;
}

export default function Page() {
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [star, setStar] = useState<NorthStar | null>(null);
  const [passages, setPassages] = useState<Passage[]>([]);
  const [view, setView] = useState<"sky" | "map">("sky");

  const [baseDate, setBaseDate] = useState<Date>(() => new Date());
  const [offset, setOffset] = useState(0); // hours into the future
  const [justSealed, setJustSealed] = useState<Passage | null>(null);

  // load persisted state after mount (client only)
  useEffect(() => {
    setProfile(getProfile());
    setStar(getActiveNorthStar());
    setPassages(getPassages());
    setReady(true);
  }, []);

  // keep "now" honest — refresh every 60s
  useEffect(() => {
    const id = setInterval(() => setBaseDate(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const currentDate = useMemo(
    () => new Date(baseDate.getTime() + offset * 3_600_000),
    [baseDate, offset],
  );

  const frame = useMemo(
    () => paletteAt(currentDate.getHours() + currentDate.getMinutes() / 60),
    [currentDate],
  );

  // apply diurnal palette to the whole document
  useEffect(() => {
    const root = document.documentElement.style;
    for (const [k, v] of Object.entries(frame.vars)) root.setProperty(k, v);
  }, [frame]);

  const anchor = star?.anchor ?? 0;
  const transit = useMemo(() => liveSky(currentDate), [currentDate]);
  const moonStart = useMemo(() => lonOf("Moon", baseDate), [baseDate]);
  const viewed = useMemo(() => contact(transit.Moon, anchor), [transit, anchor]);
  const live = useMemo(
    () => contact(lonOf("Moon", baseDate), anchor),
    [baseDate, anchor],
  );
  const upcoming = useMemo(
    () => (star && !live.open ? nextWindow(anchor, baseDate) : null),
    [star, live.open, anchor, baseDate],
  );

  const isNow = offset < 0.75;
  const canSeal = isNow && live.open && !justSealed;

  // when the live window closes, allow sealing again next time
  useEffect(() => {
    if (!live.open && justSealed) setJustSealed(null);
  }, [live.open, justSealed]);

  const stage = stageForSealed(passages.length);
  const next = toNextStage(passages.length);

  const seal = useCallback(() => {
    if (!star) return;
    const p: Passage = {
      id: uid(),
      northStarId: star.id,
      intention: star.intention,
      domain: star.domain,
      sealedAt: new Date().toISOString(),
      moonLon: lonOf("Moon", new Date()),
      aspect: live.nearest.name,
    };
    addPassage(p);
    setPassages((prev) => [...prev, p]);
    setJustSealed(p);
  }, [star, live.nearest.name]);

  const onComplete = useCallback((p: Profile, s: NorthStar) => {
    saveProfile(p);
    saveNorthStar(s);
    setProfile(p);
    setStar(s);
  }, []);

  // ---- pre-mount / onboarding shells -----------------------------------------
  if (!ready) {
    return (
      <>
        <div className="deskbg" />
        <div className="app"><Stars /></div>
      </>
    );
  }
  if (!profile || !star) {
    return (
      <>
        <div className="deskbg" />
        <div className="app">
          <Stars />
          <Onboarding onComplete={onComplete} />
        </div>
      </>
    );
  }

  // ---- labels ----------------------------------------------------------------
  const hh = pad(((currentDate.getHours() % 24) + 24) % 24);
  const dayDelta = Math.floor((baseDate.getHours() + offset) / 24);
  const dayWord = ["today", "tomorrow", "in 2 days"][dayDelta] || `+${dayDelta}d`;
  const whenLabel = isNow
    ? `now · ${pad(baseDate.getHours())}h`
    : `+${Math.round(offset)}h · ${dayWord} ${hh}h`;
  const shortClock = isNow ? "now" : `+${Math.round(offset)}h`;

  const hOrb = harmoniousOrb(viewed.separation);
  const dom = DOMAIN_BY_ID[star.domain];

  let stat: string;
  let statGo = false;
  if (justSealed && isNow) {
    stat = "The passage is sealed. The sky witnessed it.";
    statGo = true;
  } else if (viewed.open) {
    stat = isNow
      ? "Aligned. The Moon is touching your star — the threshold is open."
      : "The threshold is open at this hour — return when it arrives to seal.";
    statGo = true;
  } else if (viewed.forming) {
    stat = `The threshold is opening — ${Math.ceil(hOrb)}° until the Moon reaches your star.`;
  } else {
    stat = `The sky isn't ready yet — ${Math.round(hOrb)}° still separate the Moon from your star.`;
  }

  const form = viewed.open
    ? "The Moon touches your star."
    : viewed.forming
      ? `The Moon approaches · ${Math.ceil(hOrb)}°`
      : `Travelling toward your star · ${Math.round(hOrb)}°`;

  const nsClass = `ns${justSealed ? " sealed" : viewed.open ? " lit" : ""}`;

  return (
    <>
      <div className="deskbg" />
      <div className="app">
        <Stars />
        <div className="status">
          <span>{pad(baseDate.getHours())}:{pad(baseDate.getMinutes())}</span>
          <span>{dom.glyph} anchored to {dom.planet}</span>
        </div>

        <div className="content">
          <div className="head">
            <button className="back" onClick={() => setView("sky")} aria-label="Home">
              {view === "map" ? "←" : "✶"}
            </button>
            <span className="t">{view === "map" ? "Your constellation" : "The sky, now"}</span>
            <span className="clock">{view === "map" ? `${passages.length}★` : shortClock}</span>
          </div>

          {/* stage bar */}
          <div className="stagebar">
            <div className="lvl">
              <b>Stage {stage.index} · {stage.title}</b>
              {stage.motto}
            </div>
            <div style={{ textAlign: "right" }}>
              <div className="pips">
                {[1, 2, 3].map((i) => (
                  <i key={i} className={stage.index >= i ? "on" : ""} />
                ))}
              </div>
              {next && (
                <div className="nxt">
                  {next.remaining} more to {next.next.title}
                </div>
              )}
            </div>
          </div>

          <div className="tabs">
            <button className={view === "sky" ? "on" : ""} onClick={() => setView("sky")}>
              The sky
            </button>
            <button className={view === "map" ? "on" : ""} onClick={() => setView("map")}>
              Constellation
            </button>
          </div>

          {view === "map" ? (
            <Constellation passages={passages} colors={frame.colors} />
          ) : (
            <>
              {/* NORTH STAR */}
              <div className={nsClass}>
                <div className="beacon"><b>✶</b></div>
                <div className="k">Your North Star</div>
                <div className="aim">{star.intention}</div>
                <div className={`stat${statGo ? " go" : ""}`}>{stat}</div>

                {justSealed ? (
                  <div className="wax">
                    <div className="s">✦</div>
                    <div className="lbl">
                      Passage sealed
                      <b>
                        {new Date(justSealed.sealedAt).toLocaleString(undefined, {
                          month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                        })}
                      </b>
                    </div>
                  </div>
                ) : canSeal ? (
                  <button className="seal-btn" onClick={seal}>
                    Seal this passage
                  </button>
                ) : upcoming && isNow ? (
                  <div className="stat" style={{ marginTop: 8 }}>
                    Next window opens in {Math.round(upcoming.hoursAway)}h — drag the
                    timeline to see it.
                  </div>
                ) : null}
              </div>

              {/* WHEEL */}
              <div className="wheel">
                <AstrolabeWheel
                  natal={profile.natal.positions}
                  transit={transit}
                  moonStart={moonStart}
                  anchor={anchor}
                  contact={viewed}
                  colors={frame.colors}
                />
              </div>
              <div className="legend">
                <span><i style={{ background: "var(--planet)" }} />Natal · your fixed sky</span>
                <span><i style={{ background: "var(--accent)" }} />Transit · the moving sky</span>
                <span><i style={{ background: "var(--harm)" }} />Harmony</span>
                <span><i style={{ background: "var(--hard)" }} />Tension</span>
              </div>

              {/* SCRUBBER */}
              <div className="scrub">
                <div className="top">
                  <span className="lab">The sky, hour by hour</span>
                  <span className="phase">{frame.phase}</span>
                </div>
                <TimeScrubber offset={offset} max={MAX_HOURS} glyph={frame.glyph} onChange={setOffset} />
                <div className="marks">
                  <span>now</span><span>+12h</span><span>+24h</span><span>+36h</span><span>+48h</span>
                </div>
                <div className="readout">
                  <span className="when">{whenLabel}</span>
                  <span className="form">{form}</span>
                </div>
              </div>
              <div className="hint">⟷ drag to move through time</div>

              <div style={{ textAlign: "center", marginTop: 18 }}>
                <button
                  className="linkish"
                  onClick={() => {
                    if (confirm("Reset Lodestar? This clears your sky and all sealed passages.")) {
                      resetAll();
                      setProfile(null);
                      setStar(null);
                      setPassages([]);
                    }
                  }}
                >
                  reset
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
