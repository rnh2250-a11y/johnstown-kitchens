// Uses Web Crypto API — works in Edge middleware AND Node.js API routes
const enc = new TextEncoder();
const COOKIE = 'jk_session';
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function secret() {
  return process.env.SESSION_SECRET || 'dev-secret-change-in-prod';
}

function b64url(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function b64urlDecode(str) {
  return Uint8Array.from(atob(str.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
}

async function hmacKey() {
  return crypto.subtle.importKey('raw', enc.encode(secret()), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

export async function signSession(data) {
  const payload = btoa(unescape(encodeURIComponent(JSON.stringify(data))))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  const key = await hmacKey();
  const sig = b64url(await crypto.subtle.sign('HMAC', key, enc.encode(payload)));
  return `${payload}.${sig}`;
}

export async function verifySession(token) {
  if (!token) return null;
  const dot = token.lastIndexOf('.');
  if (dot === -1) return null;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  try {
    const key = await hmacKey();
    const valid = await crypto.subtle.verify('HMAC', key, b64urlDecode(sig), enc.encode(payload));
    if (!valid) return null;
    return JSON.parse(decodeURIComponent(escape(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))));
  } catch { return null; }
}

export async function getSessionFromRequest(request) {
  const token = request.cookies.get(COOKIE)?.value;
  return verifySession(token);
}

export async function setSessionCookie(data, response) {
  const token = await signSession(data);
  response.cookies.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: MAX_AGE,
    path: '/',
  });
}

export function clearSessionCookie(response) {
  response.cookies.set(COOKIE, '', { maxAge: 0, path: '/', httpOnly: true });
}
