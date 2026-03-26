import crypto from 'crypto';

const SECRET = process.env.SESSION_SECRET || 'dev-secret-please-set-SESSION_SECRET-in-prod';
const COOKIE = 'jk_session';
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export function signSession(data) {
  const payload = Buffer.from(JSON.stringify(data)).toString('base64url');
  const sig = crypto.createHmac('sha256', SECRET).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

export function verifySession(token) {
  if (!token) return null;
  const dot = token.lastIndexOf('.');
  if (dot === -1) return null;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = crypto.createHmac('sha256', SECRET).update(payload).digest('base64url');
  try {
    if (!crypto.timingSafeEqual(Buffer.from(sig, 'base64url'), Buffer.from(expected, 'base64url'))) return null;
  } catch { return null; }
  try { return JSON.parse(Buffer.from(payload, 'base64url').toString()); } catch { return null; }
}

export function getSessionFromRequest(request) {
  const token = request.cookies.get(COOKIE)?.value;
  return verifySession(token);
}

export function setSessionCookie(data, response) {
  const token = signSession(data);
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
