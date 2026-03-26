import { NextResponse } from 'next/server';
import { setSessionCookie } from '@/lib/auth';
import { findUser } from '@/lib/users';

export async function POST(request) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) return NextResponse.json({ error: 'Email and password required' }, { status: 400 });

    const key = email.toLowerCase().trim();

    // Check admin env var
    if (process.env.ADMIN_EMAIL?.toLowerCase().trim() === key) {
      if (password === process.env.ADMIN_PASSWORD) {
        const res = NextResponse.json({ ok: true });
        await setSessionCookie({ email: key, isAdmin: true }, res);
        return res;
      }
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Check USERS_JSON extra users
    const user = findUser(key);
    if (!user || user.password !== password) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const res = NextResponse.json({ ok: true });
    await setSessionCookie({ email: key }, res);
    return res;
  } catch {
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
