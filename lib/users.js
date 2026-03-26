import crypto from 'crypto';

export function hashPassword(password) {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.scrypt(password, salt, 64, (err, hash) => {
      if (err) reject(err);
      else resolve(`${salt}:${hash.toString('hex')}`);
    });
  });
}

export function verifyPassword(password, stored) {
  return new Promise((resolve, reject) => {
    const [salt, hash] = stored.split(':');
    if (!salt || !hash) return resolve(false);
    crypto.scrypt(password, salt, 64, (err, derived) => {
      if (err) reject(err);
      else {
        try { resolve(crypto.timingSafeEqual(Buffer.from(hash, 'hex'), derived)); }
        catch { resolve(false); }
      }
    });
  });
}

// Lazy-load kv so the app works even without KV env vars (admin-only mode)
async function getKV() {
  if (!process.env.KV_REST_API_URL && !process.env.KV_URL) return null;
  const { kv } = await import('@vercel/kv');
  return kv;
}

export async function getUser(email) {
  const key = email.toLowerCase().trim();
  const kv = await getKV();
  if (!kv) return null;
  return await kv.hget('jk:users', key);
}

export async function createUser(email, passwordHash) {
  const key = email.toLowerCase().trim();
  const kv = await getKV();
  if (!kv) throw new Error('KV_NOT_CONFIGURED');
  await kv.hset('jk:users', { [key]: JSON.stringify({ email: key, passwordHash }) });
}

export async function listUsers() {
  const kv = await getKV();
  if (!kv) return {};
  return (await kv.hgetall('jk:users')) || {};
}

export function isKVConfigured() {
  return !!(process.env.KV_REST_API_URL || process.env.KV_URL);
}
