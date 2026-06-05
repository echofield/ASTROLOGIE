import { NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Stripe webhook — dormant until env is set:
//   STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
// Optional persistence (mark the order paid) when also set:
//   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY  (→ table astrolabe_orders)
//
// On checkout.session.completed: verify signature, confirm payment_status=paid,
// record { email, session_id, amount, paid_at }. Configure the endpoint at
// /api/stripe/webhook in the Stripe dashboard and paste its signing secret.

async function recordPaid(o: { email: string | null; sessionId: string; amount: number | null; currency: string | null }) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return; // persistence dormant — manual fulfilment for now
  try {
    await fetch(`${url}/rest/v1/astrolabe_orders`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates",
      },
      body: JSON.stringify({
        session_id: o.sessionId, email: o.email, amount: o.amount, currency: o.currency, paid_at: new Date().toISOString(),
      }),
    });
  } catch (e) {
    console.error("[stripe] order persist failed:", e);
  }
}

export async function POST(req: Request) {
  const secret = process.env.STRIPE_SECRET_KEY;
  const whSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !whSecret) {
    return NextResponse.json({ ok: false, reason: "stripe not configured" }, { status: 503 });
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ ok: false }, { status: 400 });

  const raw = await req.text();
  const stripe = new Stripe(secret);

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, whSecret);
  } catch (e) {
    console.error("[stripe] signature verification failed:", e);
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const s = event.data.object as Stripe.Checkout.Session;
    if (s.payment_status === "paid") {
      await recordPaid({
        email: s.customer_details?.email ?? s.customer_email ?? null,
        sessionId: s.id,
        amount: s.amount_total ?? null,
        currency: s.currency ?? null,
      });
    }
  }

  return NextResponse.json({ received: true });
}
