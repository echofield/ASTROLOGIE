// Composed-label discipline. Every multi-segment caption row is split into real
// segments and joined with an explicit separator at render — never by relying on
// the inner HTML of a single wrapper span (the concatenation class: segments run
// together the moment the wrapper isolates them from the row's flex gap).
//
// Greek letters (Bayer designations — α Hamal) are wrapped so an uppercased row
// cannot transform α → Α, which reads as a Latin A. The letter stays lowercase.

/** Split an ed.cap HTML string ("<span>…</span><span>…</span>") into its segments. */
export function capSegments(html: string): string[] {
  const m = html.match(/<span>([\s\S]*?)<\/span>/g);
  const segs = m
    ? m.map((s) => s.replace(/^<span>|<\/span>$/g, "").trim()).filter(Boolean)
    : [html.trim()];
  return segs.map((s) => s.replace(/([α-ω])/g, '<i class="gk">$1</i>'));
}

/** The plain-text form of a cap row, for tests and snapshots: "ARIES — THE RAM · 441 SQ. DEGREES · …" */
export function capText(html: string): string {
  return capSegments(html)
    .map((s) => s.replace(/<[^>]+>/g, ""))
    .join(" · ");
}
