# The AstroLab — handoff to Codex

Continuity brief. The AstroLab is a personal celestial instrument (Next.js 16, React 19,
TS) — and, by design, a **commitment instrument disguised as an astrology app**:
Theme says *who*, Star says *what*, Genius keeps you *honest* daily, Cabinet *proves*
you did it. Repo: `github.com/echofield/ASTROLOGIE` (push to `main` → Vercel project
`astrologie`, legacy infra name, auto-deploys). Public domain: `https://the-astrolab.app`.
Local: `C:\Users\echof\Desktop\02_PROJECTS\lodestar`.

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
5. **Proof of doing (Sprint 3, leave seam now).** `fulfilledAt` + optional evidence; phase 1 = DB-immutable timestamps; phase 2 = content-hash verifiable commitment + a public shareable "constellation" reputation page.
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

## Codex update - 2026-06-05 branding/legal
- Public product name is now **The AstroLab** with `https://the-astrolab.app` as canonical metadata/domain.
- English/French copy now lives in `app/page.tsx` for the main shell, onboarding, checkout notice, result/report surfaces, Genius states, loading, and errors. Language preference is stored as `the-astrolab.lang`.
- New legal routes: `/legal/privacy`, `/legal/terms`, `/legal/refund`, `/legal/notice`, each supporting `?lang=en|fr`. Footer legal links point to these pages.
- New `/checkout` route documents the current payment-readiness state and repeats the entertainment/self-reflection disclaimer near purchase context.
- Internal persistence names such as `astrolabe_profiles`, `astrolabe_messages`, and old Supabase migration filenames are intentionally unchanged to avoid a database-breaking rename.
- Before commercial launch, complete the legal notice placeholders for publisher/operator identity, registered address, registration/VAT details if applicable, support email, and final processor/payment-provider terms.

## Claude spec - 2026-06-05 — THE COMPLETE READ (the 59€ paid tier)
Decision: the free instrument is the attraction; the Pass GATES one deep, generated,
KEPT artifact — **The Complete Read**. CTA fires right after a star is sealed (peak intent).
Build in this order. (Stripe/pricing already shipped: `lib/brand.ts` PRICING+PAYMENT_LINK,
`/checkout`, `/success`, dormant `/api/stripe/webhook`, migration `0003_astrolabe_orders`.)

1. **Geocoding → Ascendant/houses (depth foundation, ship dependency for the paid read).**
   - Ascendant/MC math is DONE: `lib/ascendant.ts` (`ascendant`, `midheaven`, `equalHouses`, `meanObliquity`). VERIFY it against a known chart on first use (quadrant bug is classic).
   - Add `/api/geocode` (server, nodejs): proxy Nominatim (`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=`) with a `User-Agent`; cache; bundle a top-~1000-cities JSON for instant offline hits + Nominatim fallback. Returns `{lat, lon, label}`.
   - Onboarding city → geocode → store `lat`/`lon` on `Profile` (extend `lib/storage.ts` Profile; back-compat: optional fields). Pass `asc` + `houses` to `SkyWheel` (already supports both props).
   - Theme leads with the **Big Three signature** `Sun · Moon · Rising` before the explorable wheel.

2. **Intake (3 questions) — the deeper input.** After purchase, before generating: 3 open prompts ("What season are you in? What keeps repeating? What are you afraid to want?"). Store on the read request. Their words are what make it feel personal.

3. **`/api/read` (gated, nodejs).** Input: profile + intake + sealed star. Server-computes: full chart (10 bodies via `lib/chart`), `asc`+equal houses, the 2–3 tightest natal aspects, and **year-ahead transits** (outer-planet + Jupiter/Saturn hits to natal points over 12 months, via `astronomy-engine`). Build ONE structured prompt; call **Claude Sonnet** (`getProvider` with model override; one call per purchase — cost trivial vs 59€); prompt-cache the method/system block. Return six sections as JSON:
   `signature · chart · pattern · star · yearAhead · counsel`.

4. **Persist + render.** New table `astrolabe_reads` (RLS owner). Render the Read in Cabinet as the centerpiece artifact (Celestial Night, long-form, sectioned). Re-viewable, owned.

5. **Identity-lite gate (the only real new plumbing).** No login. Webhook already writes `astrolabe_orders{email, paid}`. On `/success`, user confirms the paid email → server checks `astrolabe_orders` → issues a signed access cookie (HMAC with a server secret) → unlocks `/api/read`. Magic-link email later if needed.

6. **PDF export + share (fast-follow).** The keepsake + growth loop.

Defaults (redirect only if wrong): Read model = Sonnet; daily Genius stays Haiku. Identity = paid-email match, not full auth. Free tier stays open and generous. Don't gate the free instrument — only the Complete Read.
