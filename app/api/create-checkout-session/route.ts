import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getProduct } from "@/lib/products/registry";
import { durableLimit, clientKey } from "@/lib/ratelimit";
import { PRODUCT_DOMAIN } from "@/lib/brand";

export const runtime = "nodejs";

// One reusable checkout for every doorway. Same Stripe account, same €60 —
// the product travels as metadata, never as separate payment plumbing.
// The quiz answers + birth data are stored on the LEDGER row before redirect,
// so the webhook can generate the report with nobody watching.

interface Body {
  product_type?: string;
  email?: string;
  payload?: Record<string, unknown>; // { birth_data, quiz_answers } from the funnel
  source?: string;
  utm_source?: string;
  utm_campaign?: string;
}

const svc = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? { url, key } : null;
};

async function ledgerInsert(row: Record<string, unknown>): Promise<string | null> {
  const s = svc();
  if (!s) return null;
  try {
    const res = await fetch(`${s.url}/rest/v1/astrolabe_ledger`, {
      method: "POST",
      headers: { apikey: s.key, Authorization: `Bearer ${s.key}`, "Content-Type": "application/json", Prefer: "return=representation" },
      body: JSON.stringify(row),
    });
    if (!res.ok) { console.error("[checkout] ledger insert refused:", res.status, await res.text()); return null; }
    const rows = (await res.json()) as { id?: string }[];
    return rows?.[0]?.id ?? null;
  } catch (e) {
    console.error("[checkout] ledger insert failed:", e);
    return null;
  }
}

async function ledgerPatch(id: string, fields: Record<string, unknown>): Promise<void> {
  const s = svc();
  if (!s) return;
  try {
    await fetch(`${s.url}/rest/v1/astrolabe_ledger?id=eq.${id}`, {
      method: "PATCH",
      headers: { apikey: s.key, Authorization: `Bearer ${s.key}`, "Content-Type": "application/json" },
      body: JSON.stringify(fields),
    });
  } catch (e) {
    console.error("[checkout] ledger patch failed:", e);
  }
}

export async function POST(req: Request) {
  const rl = await durableLimit(`checkout:${clientKey(req)}`, 10, 60 * 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: "rate_limited" }, { status: 429, headers: { "retry-after": String(rl.retryAfter) } });

  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) return NextResponse.json({ error: "not_configured" }, { status: 503 });

  let body: Body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "bad_request" }, { status: 400 }); }

  // the registry is the law: unknown or dark products do not sell
  const cfg = getProduct(body.product_type);
  if (!cfg || !cfg.live) return NextResponse.json({ error: "unknown_product" }, { status: 400 });

  const email = typeof body.email === "string" && body.email.includes("@") ? body.email.trim().toLowerCase() : null;
  const origin = req.headers.get("origin") || PRODUCT_DOMAIN;

  // the ledger row first — the funnel's payload must survive to the webhook
  const ledgerId = await ledgerInsert({
    product_type: cfg.productId,
    source: body.source ?? null,
    email,
    utm_source: body.utm_source ?? null,
    utm_campaign: body.utm_campaign ?? null,
    payload: body.payload ?? {},
    checkout_started: new Date().toISOString(),
  });

  try {
    const stripe = new Stripe(secret);
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      ...(email ? { customer_email: email } : {}),
      line_items: [{
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: cfg.priceEur * 100,
          product_data: { name: `${cfg.displayName} — The AstroLab` },
        },
      }],
      metadata: {
        product_type: cfg.productId,
        doorway: cfg.doorway,
        funnel_version: cfg.funnelVersion,
        ...(ledgerId ? { ledger_id: ledgerId } : {}),
      },
      success_url: `${origin}${cfg.successRedirect}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cfg.productId === "core" ? `${origin}/checkout` : `${origin}/door/${cfg.productId}`,
    });

    if (ledgerId && session.id) await ledgerPatch(ledgerId, { stripe_session_id: session.id });
    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error("[checkout] session create failed:", e);
    return NextResponse.json({ error: "checkout_failed" }, { status: 500 });
  }
}
