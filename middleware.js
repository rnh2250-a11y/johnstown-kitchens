import { NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Always allow: login page, auth API routes, Next.js internals
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/api/auth/') ||
    pathname.startsWith('/_next/') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  const session = getSessionFromRequest(request);

  if (!session) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] };
