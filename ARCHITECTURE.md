# The AstroLab — Architecture Invariants

One page. These govern everything. (Discipline borrowed from ARCHÉ.)

## 1. No gamified metrics
- Never render scores, levels, percentages, streaks, or point totals.
- Progress is shown as *state and consequence*, not counts. "You found your first artifact here," never "1/3."
- If you are tempted to display a number to motivate, you are breaking the instrument.

## 2. Screens are layers, not dashboards
- The path is one descent: **Atlas → Territory → Artifact → Meaning.**
- One screen = one layer of perception = one primary action. No tab-hubs, no multi-CTA blocks.
- The minimap keeps the user located; it is navigation, not a dashboard.

## 3. Gold is for the earned, only
- Gold marks the **sealed Star, a discovered artifact, a verified proof, the one primary action.**
- Everything structural — rings, dividers, schematics, metadata — stays quiet (silver / ink).
- Use `intent(pal)` from `lib/theme.ts`; do not reach for `brass` directly in chrome.

## 4. Meaning passes through one layer
- Raw signals (ephemeris angles, star age, discovery counts) become language only in `lib/meaning.ts`.
- The UI imports meaning, never raw numbers.
- Genius voice: **consequence, not instruction; no numbers; present/past, not promises.**

## 5. Motion is a language, not magic numbers
- Durations and easings come from `lib/motion.ts` (named speeds/eases), never inline ms.
- `prefers-reduced-motion` is honored automatically via `ms()` / `sec()`.

## 6. Whispers feel instant
- Meaning text never shows a spinner. Precompute or cache.
- The casting/arrival ceremony is the *deliberate* exception — anticipation is the value there.

## 7. One gate, one accessor
- The paid-access cookie is read from a single util. No duplicate cookie/localStorage parsing elsewhere.
- Server secrets stay server-side; clients import types only.

## 8. Naming is world-building
- Name rituals and places, never UI features: Atlas, Territory, Artifact, the Read, the Cabinet, the seal.
- No generic SaaS labels ("Dashboard," "Settings hub," "Profile completion").

---
*Roadmap, not invariant:* the **Aura** — a living personal field derived from behavior and rendered as an evolving signature (never numbers) — is the eventual centerpiece of the Codex. See ARCHÉ's `aura-geometry.ts` for the technique.
