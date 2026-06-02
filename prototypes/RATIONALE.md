# Astrolabe — Phase 3 rationale

> Direction: **less astrology, more meaning. Less coaching, more ritual. Less feature, more object permanence.**
> This is a *personal celestial instrument* — Natal Sky × Moving Sky × Human Intention — not a horoscope/coaching app.

## The flows

### 1. Onboarding (reordered)
`Threshold → Birth → Theme → North Star → Genius emerges`
The Genius is no longer handed to you up front. It is the *last* thing to appear, because it is born of the chart **and** the moving sky **and** a necessity you named. Until you seal a star, the orb sits **dormant** (greyed, not breathing) and the tab bar is hidden — there is almost nothing to do but look. That emptiness is intentional.

### 2. North Star (rebuilt from scratch)
- **Removed entirely:** the 7-domain picker (Begin / Feel / Speak / Love / Act / Grow / Commit). It read as a workshop. It made a sacred act feel like a form.
- **Silence screen:** one line of verse — *"A star may be named. Not today. Not tomorrow. Only when something becomes necessary."* — and a single button, *Seal a Star*. No explanation.
- **The ritual (one thing per screen):**
  1. *What must happen?* — one open field. No categories, no multiple choice.
  2. *Name it.* — one word/phrase.
  3. *Seal it.* — framed as irreversible (*"This cannot be undone tonight"*), then a wax-stamp seal.
- **The intention becomes an object.** On seal the system derives — deterministically from the words — a **glyph**, a **longitude** (a real place on the zodiac), a **planetary ruler**, a **house**, and a one-line **resonance**. It is now a thing that stands in your sky.

### 3. Genius emergence
After the seal the overlay dissolves directly into the Genius, which **wakes** (a one-time brightening). Copy is three fragments: *born of your fixed sky / the moving heavens / what you found necessary.* One line of what it does. Nothing more.

### 4. The kept idea, developed
*"The Moon will reach your star in 17°"* is now the centre of gravity. The Star screen shows the figure huge, the sky wheel beneath it with **your star on the rim, the Moon, and the arc still to travel** drawn between them. The star is permanent: name, the words you sealed, ruler, house, date. You return to watch the distance close.

## Screen-by-screen removals & simplifications

| Screen | What changed | Why |
|---|---|---|
| **Threshold** | Trimmed to orb + title + one line + *Enter*. Removed the date stamp and extra copy. | Atmosphere over information. |
| **Birth** | Two quiet fields on hairline underlines; no labels, just ghosted examples. | A form should not feel like a form. |
| **Theme** | Kept the natal wheel; reduced text to one handwritten line. Detail-on-tap retained but optional. | The chart speaks; words shouldn't crowd it. |
| **North Star** | **Domain framework deleted.** Replaced by silence + one button. | Core of the correction — restore mystery and weight. |
| **Ritual** | New: 3 single-question steps + seal. | Naming a star is a rite, not data entry. |
| **The Star** | New centre: the "reach in N°" readout + the star as a drawn object the Moon travels toward. | Object permanence; the one unique idea. |
| **Genius** | Moved to *after* the seal; dormant until then; ~60% less text. | It emerges from necessity, not from setup. |
| **Reading / Journal / Dialogue** | Dropped from the core loop (not deleted conceptually). | "Do not add screens; refine." These diluted the instrument into an app. They can return later as *the Genius speaking*, not as features. |
| **Tab bar** | Hidden until a star exists; 4 items (Cabinet · Star · Genius · Theme). | Before necessity, there is nowhere to go. |

## Conceptual room left for SYMIONE (not built)
The seal is deliberately modelled as a **commitment object**, not a note. The `makeStar()` output is a self-contained artifact (words + derived celestial coordinates + timestamp). When ready, that artifact is the natural place to attach SYMIONE infrastructure: cryptographic sealing, proof-of-creation timestamp, verifiable milestone, ownership of a personal celestial object. Nothing here assumes a backend yet, but nothing blocks one.

## Word count, deliberately
If a screen could lose half its words, it did. The instrument should feel quiet, material, and a little withholding — so that naming a star costs something.
