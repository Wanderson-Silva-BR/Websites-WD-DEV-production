const encoder = new TextEncoder();
const decoder = new TextDecoder();

export const b64url = {
  encode(bytes: Uint8Array): string {
    let s = "";
    for (const b of bytes) s += String.fromCharCode(b);
    return btoa(s).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/g, "");
  },
  decode(value: string): Uint8Array {
    const normalized = value.replaceAll("-", "+").replaceAll("_", "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
    return Uint8Array.from(atob(normalized), c => c.charCodeAt(0));
  },
};

export function randomToken(bytes = 32): string {
  const value = new Uint8Array(bytes);
  crypto.getRandomValues(value);
  return b64url.encode(value);
}

export async function sha256(value: string): Promise<string> {
  return b64url.encode(new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(value))));
}

export async function passwordHash(password: string, salt: string, pepper: string, iterations = 310000): Promise<string> {
  const material = await crypto.subtle.importKey("raw", encoder.encode(password + pepper), "PBKDF2", false, ["deriveBits"]);
  const saltBytes = b64url.decode(salt);
  const bits = await crypto.subtle.deriveBits({name: "PBKDF2", hash: "SHA-256", salt: saltBytes as BufferSource, iterations}, material, 256);
  return b64url.encode(new Uint8Array(bits));
}

export async function secureEqual(a: string, b: string): Promise<boolean> {
  const ah = b64url.decode(await sha256(a));
  const bh = b64url.decode(await sha256(b));
  let diff = ah.length ^ bh.length;
  for (let i = 0; i < Math.max(ah.length, bh.length); i++) diff |= (ah[i % ah.length] ?? 0) ^ (bh[i % bh.length] ?? 0);
  return diff === 0;
}

export function parseCookies(request: Request): Record<string, string> {
  return Object.fromEntries((request.headers.get("Cookie") || "").split(";").map(v => v.trim()).filter(Boolean).map(v => {
    const i = v.indexOf("=");
    return [decodeURIComponent(i < 0 ? v : v.slice(0, i)), decodeURIComponent(i < 0 ? "" : v.slice(i + 1))];
  }));
}

export function sessionCookie(token: string, maxAge: number): string {
  return `wd_session=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}; Priority=High`;
}
export function csrfCookie(token: string, maxAge: number): string {
  return `wd_csrf=${encodeURIComponent(token)}; Path=/; Secure; SameSite=Strict; Max-Age=${maxAge}`;
}
export const clearSessionCookies = [
  "wd_session=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0",
  "wd_csrf=; Path=/; Secure; SameSite=Strict; Max-Age=0",
];

export function securityHeaders(request: Request): Headers {
  const h = new Headers();
  h.set("Content-Security-Policy", "default-src 'self'; base-uri 'none'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; img-src 'self' data: https:; font-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; frame-src https://www.youtube-nocookie.com; upgrade-insecure-requests");
  h.set("Cross-Origin-Opener-Policy", "same-origin");
  h.set("Cross-Origin-Resource-Policy", "same-site");
  h.set("Referrer-Policy", "strict-origin-when-cross-origin");
  h.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=()");
  h.set("X-Content-Type-Options", "nosniff");
  h.set("X-Frame-Options", "DENY");
  h.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  h.set("Cache-Control", request.url.includes("/api/") ? "no-store" : "public, max-age=300");
  return h;
}

export function assertSameOrigin(request: Request): void {
  const origin = request.headers.get("Origin");
  if (!origin || origin !== new URL(request.url).origin) throw new Error("ORIGIN");
}

export function validEmail(value: unknown): string {
  const email = String(value ?? "").trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("EMAIL");
  return email;
}

export function cleanText(value: unknown, min: number, max: number): string {
  const text = String(value ?? "").normalize("NFKC").replace(/[\u0000-\u001F\u007F]/g, " ").trim();
  if (text.length < min || text.length > max) throw new Error("TEXT");
  return text;
}

export function validatePassword(value: unknown): string {
  const password = String(value ?? "");
  if (password.length < 12 || password.length > 128) throw new Error("PASSWORD");
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) throw new Error("PASSWORD");
  return password;
}

export async function readJson(request: Request, limit = 32768): Promise<Record<string, unknown>> {
  if (!(request.headers.get("Content-Type") || "").toLowerCase().startsWith("application/json")) throw new Error("CONTENT_TYPE");
  const length = Number(request.headers.get("Content-Length") || 0);
  if (length > limit) throw new Error("TOO_LARGE");
  const text = await request.text();
  if (text.length > limit) throw new Error("TOO_LARGE");
  const parsed: unknown = JSON.parse(text || "{}");
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("JSON");
  return parsed as Record<string, unknown>;
}
