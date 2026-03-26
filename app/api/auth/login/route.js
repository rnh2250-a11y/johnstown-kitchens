import { NextResponse } from 'next/server';
import { setSessionCookie } from '@/lib/auth';
import { getUser, verifyPassword } from '@/lib/users';

export async function POST(request) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) return NextResponse.json({ error: 'Email and password required' }, { status: 400 });

    const key = email.toLowerCase().trim();

    // Check admin env var first (always works, no KV needed)
    if (process.env.ADMIN_EMAIL?.toLowerCase().trim() === key) {
      if (password === process.env.ADMIN_PASSWORD) {
        const res = NextResponse.json({ ok: true });
        setSessionCookie({ email: key, isAdmin: true }, res);
        return res;
      }
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Check KV store for additional users
    const user = await getUser(key);
    if (!user) return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });

    const stored = typeof user === 'string' ? JSON.parse(user) : user;
    const valid = await verifyPassword(password, stored.passwordHash);
    if (!valid) return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });

    const res = NextResponse.json({ ok: true });
    setSessionCookie({ email: key }, res);
    return res;
  } catch (e) {
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
