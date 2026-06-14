import { createElement, type ReactElement } from "react";
import { NextResponse } from "next/server";
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import { ReadingPDF, type PdfRead } from "@/lib/read-pdf";
import { rateLimit, clientKey } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const maxDuration = 30;

// Renders the reading the client already holds into the keepable PDF artifact. The read
// content comes in the body (the customer is looking at it), so no gate beyond a light
// rate cap. Streams application/pdf as an attachment.
export async function POST(req: Request) {
  const rl = rateLimit(`pdf:${clientKey(req)}`, 30, 60 * 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: "rate_limited" }, { status: 429, headers: { "retry-after": String(rl.retryAfter) } });

  try {
    const body = await req.json();
    const read = body.read as PdfRead;
    const question = typeof body.question === "string" ? body.question : "";
    const lang: "en" | "fr" = body.language === "fr" ? "fr" : "en"; // section labels; defaults to en for the paid flow
    if (!read || typeof read.signature !== "string" || typeof read.counsel !== "string") {
      return NextResponse.json({ error: "bad_request" }, { status: 400 });
    }
    // the geometry plate travels with the read (the client holds the chart);
    // loose shape check — a malformed plate degrades to a text-only artifact
    const plate = body.plate && typeof body.plate === "object" && body.plate.input?.planets ? body.plate : null;
    // ReadingPDF resolves to a <Document>; the wrapper's props aren't DocumentProps, so bridge the type.
    const element = createElement(ReadingPDF, { read, question, plate, lang }) as unknown as ReactElement<DocumentProps>;
    const buffer = await renderToBuffer(element);
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="the-reading.pdf"',
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    console.error("[pdf] failed:", e);
    return NextResponse.json({ error: "pdf_failed" }, { status: 500 });
  }
}
