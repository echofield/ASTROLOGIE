# The AstroLab — Go-Live Checklist

The product is shippable. This is the flip-list to start charging. Do it top to bottom.

## 1. Vercel — Environment Variables (Project → Settings → Environment Variables)
| Var | Value / note |
|---|---|
| `ANTHROPIC_API_KEY` | your Claude key — powers the Genius + the Read |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://uwwquvnvxcmahsweuywl.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `sb_publishable_ZCdUlZ10iprmay-GMbQDqQ_q0EctA9Q` |
| `SUPABASE_SERVICE_ROLE_KEY` | cityflow service-role key — webhook order writes + email gate |
| `READ_ACCESS_SECRET` | generate: `openssl rand -hex 32` — signs the access cookie |
| `STRIPE_SECRET_KEY` | **rotated** key (the old one was exposed in chat) |
| `STRIPE_WEBHOOK_SECRET` | from the Stripe webhook you create in step 3 |
| `NEXT_PUBLIC_SITE_URL` | `https://the-astrolab.app` |
| `READ_OPEN` | `true` while testing → **`false`** to charge |
| `NEXT_PUBLIC_READ_OPEN` | same as READ_OPEN (controls the in-app test button) |

Changing env requires a **redeploy** to take effect.

## 2. Supabase (cityflow)
- **Authentication → Sign In / Providers → Anonymous sign-ins → ENABLE.** (Without it, nothing persists.)
- Tables already applied ✓: `astrolabe_profiles / stars / messages / reads / orders / star_ledger`.

## 3. Stripe
- **Rotate** the live key → put the new one in Vercel `STRIPE_SECRET_KEY`.
- **Payment Link → after payment → redirect to** `https://the-astrolab.app/success`.
- **Developers → Webhooks → Add endpoint:** URL `https://the-astrolab.app/api/stripe/webhook`, event **`checkout.session.completed`** → copy the **signing secret** into Vercel `STRIPE_WEBHOOK_SECRET`.

## 4. Domain
- Confirm `the-astrolab.app` is attached to the Vercel project and DNS resolves.

## 5. Pick the homepage
- Choose A / B / C from `Desktop\AstroLab-Homepage-Directions\` and tell the build which to use.

## 6. THE FLIP (start charging)
- Set `READ_OPEN=false` and `NEXT_PUBLIC_READ_OPEN=false` → **redeploy.**
- Now the free instrument stays open; the **Complete Read requires payment.**

## 7. Smoke the live paid path
- Onboard (use a real city → confirms the Ascendant/Rising), seal a star, buy via the link, land on `/success`, confirm the paid email → the read generates with the arrival ceremony.

## Fallbacks / notes
- **Manual fulfilment** (before the webhook is set, or for a one-off): either keep `READ_OPEN=true`, or insert a row in `astrolabe_orders` (email = buyer's email) in Supabase — the `/success` email match will then unlock.
- Small race: if a buyer confirms email on `/success` before Stripe's webhook lands (seconds), the match can miss — they retry and it works.

## Legal before a public launch
- Fill the legal-page placeholders (operator identity, registered address, support email, VAT if applicable); have the entity in place. Pages exist at `/legal/{privacy,terms,refund,notice}`.
