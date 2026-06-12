# STUDIO_ENGINE — v1 build brief

**Target:** Claude Code session in the AstroLab repo.
**Upstream:** `ATLAS_VISUAL.md` (the constitution). Read it first. Every parameter and rendering choice in this engine must obey it.
**Companion:** `VOICE_FR.md` (voice law). Studio inherits the voice register for any UI text.

---

## I. Mission

Build a **parametric, real-time, audio-reactive cosmological field** as a new route `/studio` in the existing AstroLab Next.js app. The engine is an *instrument*, not a generator — Mars plays it, captures frames and clips, and the output feeds AstroLab's reading PDFs and social Reels.

Same Supabase. Same hosting. Same auth. The Studio is a private surface — not yet user-facing.

---

## II. Architectural decisions (non-negotiable)

- **Three.js** for rendering. Single WebGL scene, parametric materials, GPU particles. Not Canvas 2D — depth and camera travel are first-class.
- **Tone.js** for audio analysis. Mic input + file input + Fable 5 voice output all routed through the same `AnalyserNode`.
- **MediaRecorder** for capture. Records the canvas with the audio track baked in. Export as `.webm` client-side. No server-side video processing.
- **No external creative-coding framework.** No TouchDesigner, no Hydra, no Cables. Sovereign code in the repo.
- **No LLM at runtime.** The engine is deterministic. LLMs only touch parameter presets (offline, by Mars).

---

## III. Route and file structure

```
app/studio/
  page.tsx                    # The Studio interface
  components/
    Scene.tsx                  # Three.js canvas
    ControlPanel.tsx           # Faders, sign selector, time, capture
    AudioInput.tsx             # Mic / file / Fable pipeline
  engine/
    field.ts                   # Particle field + filaments + constellations
    geometry.ts                # Sacred geometry overlay (rings, spokes, mandala)
    camera.ts                  # Orbit + dolly + travel-through rigs
    palette.ts                 # ATLAS_VISUAL palette tokens, single source
    calibrations.ts            # The 12 sign parameter sets
    audio.ts                   # AnalyserNode → reactive multipliers
    capture.ts                 # MediaRecorder, audio mux, export
    time.ts                    # Time control (speed multiplier, shutter)
```

---

## IV. The calibration table

`engine/calibrations.ts` is the contract between `ATLAS_VISUAL.md` Section IX and the engine. TypeScript shape:

```ts
export type Filament = 'sharp' | 'soft' | 'paired' | 'branching' | 'spoke' | 'lattice' | 'vector';
export type Motion = 'burst' | 'concentric' | 'oscillation' | 'tidal' | 'bloom' | 'crystalline' | 'equilibrium' | 'infall' | 'trajectory' | 'ascent' | 'network' | 'vortex';

export type SignCalibration = {
  id: 'aries' | 'taurus' | 'gemini' | 'cancer' | 'leo' | 'virgo' | 'libra' | 'scorpio' | 'sagittarius' | 'capricorn' | 'aquarius' | 'pisces';
  density: number;                // 0..1 — particle count relative to max
  flow: number;                   // 0..1 — drift force on particles
  filaments: Filament;            // line behavior between particles
  motion: Motion;                 // global motion pattern
  goldRatio: number;              // 0..1 — fraction of particles drawn in Or
  constellationThreshold: number; // 0..1 — distance for line drawing
  geometryOpacity: number;        // 0..1 — sacred geometry overlay strength
  cameraMode: 'orbit' | 'dolly-through' | 'static-radial';
};
```

**v1 ships with four signs filled in: Aries, Virgo, Aquarius, Pisces.** These span the parameter range (burst / lattice / network / vortex) and let us stress-test the engine before extending to twelve.

The other eight signs ship as TypeScript stubs with TODO comments. Calibrating them is a creative pass with Mars, not engineering work.

---

## V. The engine layers (rendering order)

Each frame, draw in this order:

1. **Ink ground** — solid `#0A0E1A`, full clear
2. **Sacred geometry overlay** — concentric rings + 12 spokes + axes, drawn in `Or` at `geometryOpacity * 0.15` (very faint)
3. **Filaments / constellation lines** — connections between particles closer than `constellationThreshold`, drawn in `Ivoire` with distance-based opacity
4. **Particles** — `density * MAX_PARTICLES` points, each drawn in `Ivoire` or `Or` based on `goldRatio` lottery
5. **Atmospheric dust** — sparse low-opacity points outside the main field, parallax with camera

No bloom shaders. No glow filters. No post-processing. The light comes from density of marks, per the constitution.

---

## VI. Audio reactivity

Wire the `AnalyserNode` to expose four bands every frame:

| Band | Frequency range | Modulates |
|---|---|---|
| Sub | 20–80 Hz | `density` (×0.7..1.3 multiplier) |
| Bass | 80–250 Hz | global motion amplitude |
| Mid | 250–2k Hz | `flow` (×0.5..1.5) |
| Treble | 2k–8k Hz | `constellationThreshold` pulse |
| Voice formant (1k–3k) | — | `goldRatio` pulse (Fable voice → gold blooms) |

**Audio modulates parameters, never palette and never camera.** Palette is sovereign law. Camera is Mars's hand.

Inputs (toggleable in `AudioInput.tsx`):
- Mic
- File upload (drag a track)
- Fable 5 output (route the reading's TTS through the same analyser — visual breathes with the voice)

---

## VII. Time control

A single time multiplier `speed: number` (range 0.1..4.0, default 1.0).

- 0.1..0.5 — slow motion. Frame-blend trails enabled for shutter-angle feel.
- 1.0 — ritual pace (the default — slow adagio per ATLAS_VISUAL Section VII).
- 1.5..4.0 — acceleration. Use sparingly. Mostly for transitions between signs.

`speed` modulates all time-based animations: particle drift, geometry rotation, camera orbit, audio analyser smoothing.

A second control, `shutter: number` (range 0..1), controls motion blur amount via accumulated framebuffer blending. Default 0.18 (gentle).

---

## VIII. Camera rigs

Three modes, switchable per sign and at any moment:

- **`orbit`** — slow auto-orbit around the field center. The default ritual mode. Rotation speed `0.02 rad/s × speed`.
- **`dolly-through`** — the camera travels *through* the field along a Bezier path. Used for Pisces (currents), Sagittarius (vector trajectory). Loop point: re-enter from the opposite side.
- **`static-radial`** — fixed camera, field rotates. Used for Virgo (lattice should not parallax — the precision *is* the stillness).

Manual override at any time: drag to orbit, scroll to dolly. Releasing returns to the sign's default after a 4-second ease.

---

## IX. Control panel UI

Eight faders + one sign selector + time controls + capture button. Single column on the right edge of the canvas. Use the existing AstroLab type system (Cormorant Garamond italic for labels, mono for values). Palette: `Ink` panel, `Or` accents, `Ivoire` text.

Faders:
1. Density
2. Flow
3. Filaments (categorical — radio chip group, not a fader)
4. Motion (categorical — radio chip group)
5. Gold ratio
6. Constellation threshold
7. Geometry opacity
8. Time (speed)

Plus:
- Sign selector (12 chips, 4 active in v1, 8 disabled with TODO tooltip)
- Audio source toggle (mic / file / fable / none)
- Shutter slider
- Camera mode dropdown
- **Capture** button (records to MediaRecorder until pressed again, then exports `.webm`)
- **Wander** button (auto-randomizes parameters within sign-appropriate bounds every 8s — Mars's "play in random while recording")

---

## X. Capture and export

- Capture button starts MediaRecorder on `canvas.captureStream(60)` + audio track from the active analyser source.
- Record continues until pressed again. No max length (Mars decides).
- On stop: blob → download as `astrolab-studio-{sign}-{timestamp}.webm`.
- File goes to local downloads. No upload, no cloud. Sovereign.

Bonus (v1.1, not v1): a **frame** button that captures the current canvas as PNG (full resolution) for PDF compositing.

---

## XI. v1 scope — IN

- `/studio` route, behind auth (Mars only — gate via existing Supabase auth)
- Three.js scene rendering the five engine layers in ATLAS_VISUAL palette
- 4 signs fully calibrated (Aries, Virgo, Aquarius, Pisces), 8 stubbed
- Faders + sign selector + audio source toggle + time/shutter + camera mode + wander
- Audio reactivity from mic / file / Fable
- Recording with audio track → webm download
- Respects mobile *not at all* — desktop instrument

---

## XII. v1 scope — OUT (build later, not now)

- Lucy compositing (separate engine layer, will arrive as image plate overlaid on the field — separate task)
- Symbol library (the Layer 2 from Mars's three-layer thesis — separate)
- Public surface / sharing / marketplace
- Agent automation (Layer 3 — reading → scene config → capture → publish)
- All 12 signs polished
- Mobile or tablet UI
- LLM-generated parameter presets

If you find yourself adding any of the above to v1, stop and ask Mars.

---

## XIII. Acceptance criteria (Mars's eval)

Ship v1 when ALL true:

1. Mars can open `/studio`, pick Pisces, hit play, and feel a vortex breathing in the AstroLab palette.
2. Mars can speak into the mic and see the field respond — `density` pulses with sub-bass, gold blooms with formants.
3. Mars can pull the time fader to 0.2× and the world becomes a slow-motion revelation, not a freeze.
4. Mars can switch to dolly-through camera and the camera moves *into* the field.
5. Mars can press Capture, play for 15 seconds while pulling faders and humming, press stop, and the downloaded `.webm` plays back with synced audio.
6. Aries, Virgo, Aquarius, Pisces feel like four *calibrations of one world* — not four different visualizers.

---

## XIV. Discipline notes

- **The engine has no LLM.** Determinism is the value. LLMs upstream (calibration design) and downstream (agent automation, later), never in the render loop.
- **The engine is private.** Not a SaaS, not a "creative tool for astrologers." If a future business reflex appears, refuse — this is AstroLab's content surface, period.
- **The constitution is upstream.** When any choice is unclear, re-read `ATLAS_VISUAL.md`. Do not invent palette colors, do not add motion modes the constitution forbids, do not bring in cyberpunk aesthetics because the model defaults that way.
- **No premature 12.** Four signs working perfectly beats twelve signs working OK.

---

*v1 — 12 June 2026. Iterate freely on implementation; iterate cautiously on architecture; never iterate on the constitution without a separate conversation.*
