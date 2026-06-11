import { NextResponse } from "next/server";
import { after } from "next/server";
import Stripe from "stripe";
import { getProduct } from "@/lib/products/registry";
import { generateProduct, type DoorBirth } from "@/lib/products/generate";
import { sendEmail, doorReadyEmail } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// doorway generation runs inside this invocation after the 200 returns to Stripe
export const maxDuration = 300;

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

const svc = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? { url, key } : null;
};

// Doorway generation with nobody watching: pull the ledger payload, run the full
// quality gate through the product's mask, write the reading (email-keyed, sealed),
// stamp the ledger, send the delivery email. A paid ledger row WITHOUT
// report_generated is the operator's held-queue — nothing is ever silently lost.
async function generateDoorReading(s: Stripe.Checkout.Session) {
  const productType = s.metadata?.product_type;
  const ledgerId = s.metadata?.ledger_id;
  const cfg = getProduct(productType);
  if (!cfg || cfg.productId === "core" || !ledgerId) return; // core keeps its cabinet flow
  const c = svc();
  if (!c) return;
  const headers = { apikey: c.key, Authorization: `Bearer ${c.key}`, "Content-Type": "application/json" };
  try {
    const res = await fetch(`${c.url}/rest/v1/astrolabe_ledger?id=eq.${ledgerId}&select=payload,email`, { headers });
    const rows = (await res.json()) as { payload?: { birth_data?: DoorBirth; quiz_answers?: Record<string, string>; language?: string }; email?: string | null }[];
    const row = rows?.[0];
    const email = s.customer_details?.email ?? s.customer_email ?? row?.email ?? null;
    const birth = row?.payload?.birth_data;
    const quiz = row?.payload?.quiz_answers ?? {};
    if (!birth?.birthISO) {
      console.error(`[stripe] door ${productType} paid but ledger ${ledgerId} has no birth data — operator follow-up`);
      return;
    }

    const art = await generateProduct(cfg, { birth, quiz, language: row?.payload?.language === "fr" ? "fr" : "en" });

    // the reading lands on the shelf, sealed, keyed by the paid email (user_id null until claimed)
    const primary = quiz[cfg.funnelQuestions[0]?.key ?? ""] ?? "";
    const ins = await fetch(`${c.url}/rest/v1/astrolabe_readings`, {
      method: "POST",
      headers: { ...headers, Prefer: "return=representation" },
      body: JSON.stringify({
        user_id: null,
        email,
        question: primary ? primary.slice(0, 140) : cfg.displayName,
        anchor: { kind: "doorway", product: cfg.productId, funnel_version: cfg.funnelVersion },
        read: { ...art.sections, question: primary, generatedAt: art.generatedAt, productType: cfg.productId },
        language: row?.payload?.language === "fr" ? "fr" : "en",
        created_at: art.generatedAt,
      }),
    });
    const reading = ((await ins.json()) as { id?: string }[])?.[0];

    await fetch(`${c.url}/rest/v1/astrolabe_ledger?id=eq.${ledgerId}`, {
      method: "PATCH", headers,
      body: JSON.stringify({ report_generated: new Date().toISOString(), ...(reading?.id ? { reading_id: reading.id } : {}) }),
    });

    if (email) {
      const e = doorReadyEmail(cfg.displayName);
      await sendEmail({ to: email, subject: e.subject, html: e.html });
    }
  } catch (e) {
    // the ledger row stays paid-but-ungenerated — the operator's signal
    console.error(`[stripe] door generation failed (${productType}, ledger ${ledgerId}):`, e);
  }
}

// Doorway sales carry their ledger row in metadata — mark it paid. (Payment-link
// sales have no ledger_id; astrolabe_orders covers them as before.)
async function markLedgerPaid(s: Stripe.Checkout.Session) {
  const ledgerId = s.metadata?.ledger_id;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!ledgerId || !url || !key) return;
  try {
    await fetch(`${url}/rest/v1/astrolabe_ledger?id=eq.${ledgerId}`, {
      method: "PATCH",
      headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        payment_completed: new Date().toISOString(),
        stripe_session_id: s.id,
        email: s.customer_details?.email ?? s.customer_email ?? null,
        amount: s.amount_total ?? null,
        currency: s.currency ?? null,
      }),
    });
  } catch (e) {
    console.error("[stripe] ledger mark-paid failed:", e);
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
      await markLedgerPaid(s);
      // doorway products generate now, after the 200 returns to Stripe —
      // the mask pipeline runs inside this invocation's extended lifetime
      if (s.metadata?.product_type && s.metadata.product_type !== "core") {
        after(() => generateDoorReading(s));
      }
    }
  }

  return NextResponse.json({ received: true });
}
