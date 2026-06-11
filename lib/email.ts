// The two ceremony notes — "being drawn" and "ready" — sent via Resend's HTTP API
// (no SDK). Dormant until RESEND_API_KEY is set; failures never throw (the read still
// lands in the Cabinet regardless of email). Copy is DRAFT, in voice, for Mars's pass.

const KEY = process.env.RESEND_API_KEY;
// Set EMAIL_FROM to a verified sender for production (e.g. "The AstroLab <reading@the-astrolab.app>").
// Resend's onboarding@resend.dev works for self-send testing without a verified domain.
const FROM = process.env.EMAIL_FROM || "The AstroLab <onboarding@resend.dev>";
const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://the-astrolab.app";

export async function sendEmail(opts: { to: string; subject: string; html: string; scheduledAt?: string }): Promise<boolean> {
  if (!KEY) { console.warn("[email] RESEND_API_KEY unset — email dormant"); return false; }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: FROM, to: [opts.to], subject: opts.subject, html: opts.html,
        ...(opts.scheduledAt ? { scheduled_at: opts.scheduledAt } : {}),
      }),
    });
    if (!res.ok) { console.error("[email] send failed:", res.status, await res.text().catch(() => "")); return false; }
    return true;
  } catch (e) { console.error("[email] send error:", e); return false; }
}

// ── the gold-on-midnight shell (inline styles + table layout for client compatibility) ──
function shell(eyebrow: string, title: string, body: string, ctaLabel: string, ctaHref: string, foot: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#05080f;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#05080f;background-image:radial-gradient(120% 80% at 50% -10%,#0f1a35 0%,#0a1124 38%,#070b18 68%,#05080f 100%);padding:56px 20px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;">
<tr><td style="padding:0 8px;">
<p style="margin:0 0 30px;font-family:'IBM Plex Mono',ui-monospace,monospace;font-size:11px;letter-spacing:.34em;text-transform:uppercase;color:#8a7140;">The AstroLab</p>
<p style="margin:0 0 18px;font-family:'IBM Plex Mono',ui-monospace,monospace;font-size:11px;letter-spacing:.3em;text-transform:uppercase;color:#6f7894;">${eyebrow}</p>
<h1 style="margin:0 0 22px;font-family:Georgia,'Cormorant Garamond',serif;font-weight:400;font-size:34px;line-height:1.15;color:#ece4d2;letter-spacing:.4px;">${title}</h1>
<p style="margin:0 0 34px;font-family:Georgia,'EB Garamond',serif;font-size:17px;line-height:1.62;color:#b6b1a3;">${body}</p>
<table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="border:1px solid #c2a25f;">
<a href="${ctaHref}" style="display:inline-block;padding:15px 30px;font-family:'IBM Plex Mono',ui-monospace,monospace;font-size:12px;letter-spacing:.28em;text-transform:uppercase;color:#e3c884;text-decoration:none;">${ctaLabel} &rarr;</a>
</td></tr></table>
<p style="margin:40px 0 0;padding-top:22px;border-top:1px solid rgba(194,162,95,.16);font-family:'IBM Plex Mono',ui-monospace,monospace;font-size:10.5px;letter-spacing:.22em;text-transform:uppercase;color:#4a5270;line-height:1.7;">${foot}</p>
</td></tr></table></td></tr></table></body></html>`;
}

// "Being drawn" — sent the moment generation begins. Sets the wait, links to the Cabinet.
export function beingDrawnEmail(deliverBy: string): { subject: string; html: string } {
  return {
    subject: "Your reading is being drawn",
    html: shell(
      "A reading, begun",
      "Your question is sealed. The sky is being read against it.",
      `A reading takes its time — the chart you were born under, laid over the sky tonight, read line by line. Yours reaches you by <span style="color:#e3c884;">${deliverBy}</span>, and will be waiting in your Cabinet.`,
      "Return to your Cabinet", `${SITE}/cabinet`,
      "The AstroLab &middot; one reading, drawn for a sealed question &middot; kept in your Cabinet",
    ),
  };
}

// Doorway "ready" — a doorway reading (lucy / shadow / path) drawn by the webhook;
// the email is the delivery. Same claim flow: /success confirms the paid email.
export function doorReadyEmail(displayName: string): { subject: string; html: string } {
  return {
    subject: `Your ${displayName} reading is drawn`,
    html: shell(
      "A reading, drawn",
      "The sky has been read against your answers.",
      `Your ${displayName} reading is drawn and sealed — written by hand from the chart you were born under and the words you left. Confirm the email you paid with, and the Cabinet will open it.`,
      "Open your reading", `${SITE}/success`,
      "The AstroLab &middot; written by hand &middot; kept in your Cabinet",
    ),
  };
}

// "Ready" — sent on completion (or on operator-deliver for held reads). Pulls them back.
export function readyEmail(): { subject: string; html: string } {
  return {
    subject: "Your reading is ready",
    html: shell(
      "A reading, drawn",
      "The sky has been read. Your reading is ready.",
      "It is drawn and waiting in your Cabinet — your sky, your star, and the year ahead, read for the question you sealed. Open it when the night is quiet.",
      // routes through /success so a new device confirms the paid email → access cookie → the
      // reading loads by email (cross-device). On the original device it's a one-tap re-entry.
      "Open your reading", `${SITE}/success`,
      "The AstroLab &middot; kept in your Cabinet, yours to return to",
    ),
  };
}
