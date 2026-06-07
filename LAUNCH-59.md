# The €59 Reading — launch checklist

The Year (Standing) is parked. This is the one-time €59 Reading, live.

## 1 · Vercel environment variables

| Var | Purpose | Notes |
|-----|---------|-------|
| `ANTHROPIC_API_KEY` | L1 generation (Opus 4.8) + judge + regen | required, keep funded |
| `NEXT_PUBLIC_SUPABASE_URL` | client mirror, events, Cabinet | cityflow project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | client anon session | cityflow anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | webhook order-persist + admin deliver | **server-only**, never `NEXT_PUBLIC_` |
| `READ_ACCESS_SECRET` | signs the paid-access HMAC cookie | any long random string; rotate if leaked |
| `STRIPE_SECRET_KEY` | webhook signature verify | live key for launch (test key while testing) |
| `STRIPE_WEBHOOK_SECRET` | webhook signature | from the Stripe webhook endpoint |
| `ADMIN_SECRET` | gates `/admin/held` + `/api/admin/deliver` | long random string; the `?key=` value |
| `READ_OPEN` | **`false`** for the real gate | `true` only bypasses the paywall for testing |
| `NEXT_PUBLIC_SITE_URL` | absolute URLs | `https://the-astrolab.app` (or the live domain) |

Optional: `GENIUS_PROVIDER` (default `anthropic`), `GENIUS_MODEL` (Genius/daily only).

## 2 · Stripe dashboard

1. **Payment Link — €59**, one-time. Put the link in `lib/brand.ts` → `PAYMENT_LINK`.
2. **After-payment redirect** → `https://<domain>/success` (Payment Link → After payment → Redirect).
3. **Webhook endpoint** → `https://<domain>/api/stripe/webhook`, event `checkout.session.completed`. Copy its **Signing secret** → `STRIPE_WEBHOOK_SECRET`.
4. Use `STRIPE_SECRET_KEY` from the same mode (test while testing, live for launch).

## 3 · The flow (how the gate actually works)

```
pay (Stripe Payment Link)
  → Stripe fires checkout.session.completed → /api/stripe/webhook
      → recordPaid() writes { email } to astrolabe_orders (service role)
  → Stripe redirects buyer → /success
      → buyer confirms the email they paid with → /api/access
          → matches astrolabe_orders → signs HMAC cookie (READ_ACCESS_SECRET)
  → /api/read sees the cookie → generates (Opus 4.8 → judge → reading)
```
With `READ_OPEN=false` the cookie is the only way in. The webhook MUST be armed or `astrolabe_orders` stays empty and `/api/access` denies every email.

## 4 · Test path BEFORE charging real money

Use **Stripe TEST mode** end-to-end so you exercise the real gate without spending €59:
1. Set the test Payment Link in `PAYMENT_LINK`, `STRIPE_SECRET_KEY`/`STRIPE_WEBHOOK_SECRET` = test, `READ_OPEN=false`.
2. Pay with test card `4242 4242 4242 4242`, any future expiry/CVC.
3. Confirm: webhook 200 in Stripe → a row in `astrolabe_orders` → `/success` email unlocks → a real reading generates and lands in the Cabinet.
4. Then swap `PAYMENT_LINK` + the three Stripe/`READ_*` values to **live** and do one real €59 (refundable) to confirm live mode.

## 5 · Judge-fail (operator) — test tomorrow

- Force a fail (test env, `READ_OPEN=true`): POST `/api/read` with `"forceJudgeFail": true` (or hit the flow) → the customer sees the **held state**, the read is logged to the ledger.
- Catch it: open `https://<domain>/admin/held?key=<ADMIN_SECRET>` → edit the flagged sections against the judge's reasons → **Deliver to Cabinet** → it lands in that customer's Cabinet on return.

## 6 · Supabase

- Anonymous sign-ins: already enabled on cityflow (in use).
- Tables in use: `astrolabe_profiles`, `astrolabe_stars`, `astrolabe_star_ledger`, `astrolabe_reads`, `astrolabe_orders`, `astrolabe_events` (all present). No new migration for this launch.
