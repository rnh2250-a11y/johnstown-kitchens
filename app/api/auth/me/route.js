import { NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(request) {
  const session = await getSessionFromRequest(request);
  if (!session) return NextResponse.json({ user: null });
  return NextResponse.json({ user: { email: session.email, isAdmin: session.isAdmin || false } });
}
