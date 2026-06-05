import { createHmac, timingSafeEqual } from "crypto";

export const ACCESS_COOKIE = "astrolab_access";
const MAX_AGE_SEC = 30 * 24 * 60 * 60;

function secret(): string | null {
  return process.env.READ_ACCESS_SECRET || null;
}

export function signAccess(email: string): string | null {
  const key = secret();
  if (!key) return null;
  const issuedAt = Date.now().toString();
  const payload = `${email.toLowerCase().trim()}|${issuedAt}`;
  const sig = createHmac("sha256", key).update(payload).digest("hex");
  return `${payload}|${sig}`;
}

export function verifyAccess(token: string): { ok: boolean; email?: string } {
  const key = secret();
  if (!key) return { ok: false };

  const parts = token.split("|");
  if (parts.length !== 3) return { ok: false };

  const [email, issuedAt, sig] = parts;
  const payload = `${email}|${issuedAt}`;
  const expected = createHmac("sha256", key).update(payload).digest("hex");

  try {
    const a = Buffer.from(sig, "hex");
    const b = Buffer.from(expected, "hex");
    if (a.length !== b.length || !timingSafeEqual(a, b)) return { ok: false };
  } catch {
    return { ok: false };
  }

  const age = Date.now() - Number(issuedAt);
  if (!Number.isFinite(age) || age > MAX_AGE_SEC * 1000) return { ok: false };

  return { ok: true, email };
}

export function accessCookieOptions(value: string) {
  return {
    name: ACCESS_COOKIE,
    value,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: MAX_AGE_SEC,
  };
}

export function readOpen(): boolean {
  return process.env.READ_OPEN === "true";
}
