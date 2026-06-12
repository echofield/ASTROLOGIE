# ASTROLAB STUDIO — Roadmap & Vision

**From reactive visualizer to motion-design instrument.**
Companion to `ATLAS_VISUAL.md` (the constitution) and `STUDIO_ENGINE.md` (the v1 brief), both in `lodestar/docs/`. This document is the road after v1. Updated 12 June 2026.

---

## The diagnosis

Where the engine stands today, it is a *very good Windows Media Player visualizer* — better palette, better law, real grain. That lineage is the problem to outgrow:

- A **visualizer** reacts. Sound goes in, motion comes out, nobody decided anything.
- A **motion-design instrument** performs. Every move has anticipation, arrival, and rest. The camera is a narrator, not a turntable. A 9-second clip has a beginning, a build, and a release.

The gap is not particle count. The gap is **intention**. Everything below serves that one conversion.

---

## Phase 1 — The hand (controls maturity)

*The instrument answers Mars's hand without friction.*

- [x] Arrow keys turn, +/− and PageUp/PageDown travel, R recenters
- [x] Zoom persists — the rigs respect the working distance
- [x] Random throw within sign bounds
- [ ] **Inertia** — drag releases into a decaying glide, never a dead stop
- [ ] **Framing presets** — three keyed camera framings per sign: FACE (the disc full), HEART (close on the center), LIMB (the rim and ticks as foreground). Keys 1 / 2 / 3.
- [ ] **Camera bookmarks** — hold a key to store the current view, tap to return with an eased move (the move itself is the shot)
- [ ] **FOV fader** — wide lens for travel, long lens for plates

## Phase 2 — Choreography (the core conversion)

*Phrases, not loops. This is the phase that kills the WMP ghost.*

- [ ] **The phrase** — a named, timed sequence of parameter + camera moves with easing curves (`anticipate → strike → settle`). JSON in the repo, hand-written first.
- [ ] **Phrase player** — fire a phrase from the panel; it drives faders and camera over 3–15 s, then hands control back
- [ ] **Beat-aware transitions** — sign morphs and phrase starts quantize to the next spectral-flux onset, so cuts land ON the note
- [ ] **The arc** — a meta-phrase for Reels: intro (sparse, slow) → build (density + flow rise) → release (gold bloom, camera pulls back to the full disc). One button: perform 9 seconds.
- [ ] **Easing law** — one shared easing vocabulary (slow-in/slow-out, held frames at extremes); no linear interpolation anywhere a human will see

## Phase 3 — Worlds and moons (celestial bodies)

*The field gains inhabitants. Cosmology subjects per ATLAS §VIII.*

- [ ] **The world** — a central body built of marks: latitude/longitude shells of grains, engraved meridians, never a textured ball. The field becomes its atmosphere.
- [ ] **Moons** — one to three small bodies in true elliptical orbits, each dragging a thin trail of dust; orbital periods locked to the time fader
- [ ] **The ring** — a Saturn-band of grains in the equatorial plane, density-modulated by audio
- [ ] **The eclipse** — the reference image: a bright ring behind a dark body, dunes of particles catching the edge light. A staged moment, fired as a phrase.
- [ ] **The lab sphere joins** — the celestial sphere study (`app/lab`) becomes a Studio body: constellations at true RA/dec on a turning globe, sidereal phase
- [ ] Bodies are *subjects*, parameters choose which is on stage: field alone / world + field / world + moons / eclipse

## Phase 4 — The matter library (remaining forms)

*Five signs left, each one a structure from the reference bank.*

- [ ] **Gemini** — paired filaments, fast oscillation, mirroring across the axis
- [ ] **Cancer** — tidal expansion/contraction, lunar emphasis (pairs with the moons of Phase 3)
- [ ] **Libra** — paired masses in equilibrium, slow oscillation
- [ ] **Scorpio** — deep center, recursive infall, sparse outer field
- [ ] **Capricorn** — slow vertical ascent, structural, few particles
- [ ] **Branching growth** — L-system filaments that GROW over seconds (the inverted-tree reference); a filament mode, not a sign
- [ ] **Dune sheets** — particle waves with crest light (the eclipse reference's terrain)
- [ ] **Cymatic plate modes** — true Chladni figures (m,n modes) for the concentric family

## Phase 5 — Pro capture

*The output stops being a screen recording and becomes a master.*

- [ ] **Deterministic replay** — seed every random; a captured take can be re-rendered identically
- [ ] **Offline render** — replay a take frame-by-frame at 4K/60 regardless of live framerate, mux the audio after
- [ ] **Frame button** — current canvas to full-resolution PNG for PDF plates (v1.1 promise, still open)
- [ ] **MP4/ProRes out** — convert in-browser (ffmpeg.wasm) or via a local script; webm is a working format, not a deliverable
- [ ] **MIDI in** — faders on a physical controller; the instrument earns the name

## Phase 6 — Scale and fluidity

*Only after choreography. Speed in service of intention, never instead of it.*

- [ ] **GPU particle physics** — move integration into a compute/transform-feedback pass; 100k+ grains at 60 fps
- [ ] **Curl-noise flow fields** — the drift gains coherent currents (vortex and tidal signs feel like FLUID, not arithmetic)
- [ ] **Instanced filament geometry** — ribbons with width and taper instead of 1-px GL lines
- [ ] **Density-adaptive linking** — spatial hash so constellation lines scale past the 900-particle subset

## Phase 7 — The agent loop (Layer 3, last)

*Per STUDIO_ENGINE §XII — built only when the instrument is worth automating.*

- [ ] Reading → scene configuration (sign, phrase, arc) chosen offline by the model
- [ ] Unattended capture of the arc, deterministic seed logged
- [ ] Output filed for the reading PDF and the day's Reel
- [ ] Mars approves every publish; the agent prepares, never ships

---

## Order of march

```
1 (hand) ──► 2 (choreography) ──► 3 (worlds & moons)
                                  4 (matter library)   ← parallel with 3
                                          │
                                  5 (pro capture)
                                          │
                                  6 (scale) ──► 7 (agent)
```

Phase 2 is the heart. If only one phase ships this season, it is that one — a single performed 9-second arc is worth more than every other line in this file.

## The test (unchanged)

Before any phase ships, the constitution's question still rules: **does it belong to the same museum as the rest?** A moon that bounces, a camera that whips, an easing that pops — refuse them. Reverent, slow, measured. A manuscript made of light that now knows how to *perform*.
