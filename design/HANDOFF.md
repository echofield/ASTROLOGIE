# ASTROLAB — Claude Code integration brief

## The canonical set (everything else = design exploration history)
- `Your Sky.html` — front door / landing
- `The Doorway — Alive.html` — conversion funnel (one shell, three masks)
- `Atlas Worlds.html` — the Atlas surface (requires `signs.js`)
- `Genius World.html` — the Genius surface

## Global rules
1. **Engine is validated — never modify.** Same blocks embedded per page (julianDay, sunLongitude/sunLon, moonLon, helioXYZ/geoLon). Extract once into shared `engine.js`, byte-identical math. Sun exact at J2000, ±0.3°.
2. **Self-host fonts**: Cormorant Garamond, EB Garamond, IBM Plex Mono. Replace every Google Fonts link.
3. **Motion is rAF-driven, never CSS-timeline-gated.** Content must never hide behind an animation that might not play. Keep all `prefers-reduced-motion` paths.
4. **Materiality is a door-level token, not a brand constant.** LUCY = lunar ivory #e7e2d8 · SHADOW = ember #b96a44 · PATH = faded brass #b6a47a. Navy/gold survives only as the Sun's reserved warmth (and legacy Atlas/Genius surfaces). Wordmark: slate-dim, .85 opacity, never accent-colored.
5. **No new copy.** Voice = observations about patterns, never predictions. Build a canonical sentence library; all strings come from it. No emoji, no exclamation marks, never the word "unlock". €60 appears exactly once (Doorway CTA).

## Wire points (all marked `CLAUDE CODE →` inline)
### Your Sky.html
- Live clock: client Date each second; sign readout from engine.
- REVEAL submits {d,m,y,hh,mm}; hour blank = solar noon; sign computed client-side.
- "Read it →" carries the moment forward via querystring into the Reading flow.

### The Doorway — Alive.html
1. `DOORS` registry → live product registry; inject one door as `window.DOOR`; remove bottom-left demo switcher.
2. `STATE.answers` = quiz capture — POST with checkout.
3. `signsFor()` fills preview slots {sunSign}/{venusSign}/{saturnSign}.
4. CTA → POST /checkout (Stripe) with {door, answers, birth, signs}.
5. Payment return `?sealed=1` lands on Sealed; email slot from the checkout session.
6. "the hour is unknown" = solar noon; written reading notes the rising sign cannot be fixed.

### Atlas Worlds.html
- Ship with `signs.js` (star tables). Sun-dot + "the Sun stands here tonight" computed live.
- Travel transition follows zodiac order, shortest way around.

### Genius World.html
- Oracle + almanac lines are computed lunar truth; genius engine may overwrite with richer copy, computed line is the fallback.
- Daimon ("Held by the Ouroboros") + tally 3/3 come from the genius engine.
- Record keep() → POST entry; render real history newest-first.

## Routing
Your Sky → Doorway (/door/:id) → Sealed → Cabinet. Atlas/Genius inherit shared header.js nav.
