# Astrolabe — handoff to Codex

Continuity brief. Astrolabe is a personal celestial instrument (Next.js 16, React 19,
TS) — and, by design, a **commitment instrument disguised as an astrology app**:
Theme says *who*, Star says *what*, Genius keeps you *honest* daily, Cabinet *proves*
you did it. Repo: `github.com/echofield/ASTROLOGIE` (push to `main` → Vercel project
`astrologie` auto-deploys). Local: `C:\Users\echof\Desktop\02_PROJECTS\lodestar`.

## Hard rules
- **No new product sections.** Four surfaces only: Cabinet, Theme, Star, Genius. Refine; do not expand mythology.
- **Visual identity is locked** = Celestial Night (palette B). Don't reinvent it. Source of truth: the design handoff at `C:\Users\echof\Downloads\astrolab-handoff\astrolab\project\{proto,celestial,views,constellations,shell}.jsx`.
- **Commit as the local git user** (Martial FOE <echofield@outlook.fr>). No AI/Co-Authored-By trailer; never change git config. Push to `main`.
- **Real ephemeris only** (`astronomy-engine`). No fake astrology data.
- **Server secrets stay server-side.** Anthropic SDK only in `app/api/**`; clients import `lib/llm/types` (type-only).
- Verify before done: `npx tsc --noEmit` && `npm run build` green; smoke `npm run start` → HTTP 200.

## Where everything is
**Engines (logic — don't reskin these):**
- `lib/sky.ts` — 7 classical bodies, natal, aspects, `lonOf`, `norm`, `SIGN_NAMES`.
- `lib/chart.ts` — DISPLAY layer: 10-body longitudes (`displaySky`), `SIGN_GLYPH/NAME/KEY`, `PLANETS`, `signOf/degInSign/degStr/shortPos`, `daysMoonToReach`.
- `lib/star.ts` — `makeStar()` (intention→celestial object: glyph/lon/ruler/house/resonance/sealedAt/`fulfilledAt?`), `reachOf()` (live Moon→star gap/days/headline).
- `lib/archetypes.ts` — hidden 21-archetype voice engine (7×3). `archetypeForStar`, `geniusLine` (templated), `geniusPhase`. Never expose the 21 as a picker.
- `lib/llm/{types,index}.ts` — provider-agnostic LLM (`getProvider()`, default Claude via `ANTHROPIC_API_KEY`/`GENIUS_PROVIDER`/`GENIUS_MODEL`; null when unset).
- `lib/dialogue.ts` / `lib/voice.ts` — client helpers; local-first, dormant-with-fallback.
- `lib/cloud.ts` — Supabase persistence (profile/star/messages), anon auth, all guarded.
- `lib/storage.ts` — localStorage (`Profile`, getStar/saveStar…).
- `lib/ratelimit.ts` — per-IP guard on the genius routes.

**Design system (presentation):**
- `lib/theme.ts` — `DAY`/`NIGHT` palettes (one identity, two modes) + font vars `FD/FT/FG/FN`.
- `lib/constellations.ts` — 12 zodiac figures.
- `components/sky/` — `SkyWheel` (engraved chart: ticks/glyphs/`asc`+`houses`/`sealedLon`+`showArc` transit arc), `PlanetMedallion` (seal hero), `StarField` (parallax), `ConstellationFig`, `primitives` (`lonXY`,`GlyphText`), `chrome` (`Cap/Btn/StatusBar/ModeToggle/TabBar`), `hooks` (`useParallax/useSlowRotation/useSkyClock/useMediaQuery`).
- `app/layout.tsx` — fonts (Cormorant Garamond / Spectral / Noto Sans Symbols 2).
- `app/globals.css` — night base, pulse/fade keyframes, reduced-motion.
- `app/page.tsx` — the whole shell. Each screen yields `{visual, detail}`; mobile stacks in `Frame` (phone), desktop (`>=980px`) renders `DesktopShell` two-pane. Onboarding + ritual handled before the shell.
- `app/api/genius/route.ts` (one-line voice) + `app/api/genius/chat/route.ts` (dialogue). Both rate-limited, dormant→`{line/reply:null}` with `reason` in dev.

**Infra:** Supabase project **cityflow** (`uwwquvnvxcmahsweuywl`), tables `astrolabe_profiles/stars/messages` (RLS, anon auth — must be enabled in dashboard). Shared with two sibling projects; see `C:\Users\echof\Desktop\02_PROJECTS\SHARED-SUPABASE-CONTEXT.md`. Env on Vercel: `ANTHROPIC_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — if unset, Genius/persistence run dormant (UI still works).

## Architecture (the spine)
```
Theme    = identity   (fixed · birth)            → who you are
Star     = intention  (live Moon closing on goal) → what you reach for
Genius   = encounter  (daily reflection, 3/day)   → keeps you honest
Cabinet  = record     (accumulates: journal+ledger+proof) → proves you did it
```
Cabinet is currently the weak tab (repetition) **because it's the only one with nothing to accumulate.** Fix = make it memory+proof.

## Remaining work (priority order)
1. **Cabinet = record.** Replace the home with: (top) one live "today's sky" line — a real transit read; (mid) **journal** of saved Genius reflections; (bottom) **star ledger** — each sealed star + lifecycle `sealed → approaching → reached → kept`, date-stamped. New table `astrolabe_journal` (RLS, anon) or reuse `astrolabe_messages`. Local-first + cloud sync, mirror `lib/cloud.ts` pattern.
2. **Genius 3/day → journal.** Cap to 3 exchanges/day (localStorage + cloud count), then "closed till tomorrow." Each exchange saved to the journal. Caps Claude cost too.
3. **Geocoding → Ascendant → houses + Big-Three Theme.** Onboarding city → lat/long (bundle a city list or a free geocode at onboarding only). Compute Ascendant (sidereal time + obliquity). Then: `SkyWheel` gets real `asc`+`houses`, and **Theme leads with the signature `Sun · Moon · Rising`** before the explorable wheel. This single unlock fixes both personalization and the houses gap.
4. **Theme interpretations** — currently generic (`READ` map in `page.tsx`). Make them specific/psychologically sharp ("how did it know that"); optionally Claude-generated per placement.
5. **Proof of doing (SYMIONE wedge — Sprint 3, leave seam now).** `fulfilledAt` + optional evidence; phase 1 = DB-immutable timestamps; phase 2 = content-hash verifiable commitment + a public shareable "constellation" reputation page.
6. **French localization** — native/literary, not translation. Externalize strings; FR likely default (francophone-first market).
7. **Desktop polish** — the two-pane works; refine per-screen spacing/hierarchy, and consider the living sky scale on wide.

## Don't
- Don't add temples/mysticism/new realms. Don't add a 5th tab. Don't expose the 21 archetypes as UI. Don't put the Anthropic key client-side. Don't deploy a public LLM route without the rate guard.

## Codex update - 2026-06-05
- Cabinet record is implemented in `app/page.tsx`: live Moon/Sun transit line, saved Genius replies as a journal, and a sealed-star ledger with `sealed / approaching / reached / kept` lifecycle labels.
- Genius exchanges are capped at 3 user messages per local day. Each exchange writes the user prompt and the Genius/fallback reply to local storage and, when configured, `astrolabe_messages`.
- New migration `supabase/migrations/0002_astrolabe_records.sql` creates `astrolabe_messages` and `astrolabe_star_ledger` with owner RLS. Apply it to cityflow before expecting cloud journal/ledger persistence on Vercel.
- Current star restore is now local-first, then cloud-backed; cloud hydration is sequenced to avoid racing anonymous sign-in.
- Verification on this slice: `npx tsc --noEmit`, `npm run lint` (one existing font warning only), `npm run build`, and `next start` smoke on port 3100 returned HTTP 200.
- Next priority is now item 3: geocoding -> Ascendant -> houses + Big-Three Theme.
