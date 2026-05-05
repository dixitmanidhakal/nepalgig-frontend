import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE } from '@/lib/constants';

const PUBLIC_ROUTES = new Set([
  '/',
  '/login',
  '/about',
  '/terms',
  '/privacy',
  '/api/auth/magic',
  '/api/auth/verify',
  '/api/health',
]);

const PUBLIC_PREFIXES = ['/_next/', '/public/', '/favicon', '/api/auth/'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) return NextResponse.next();
  if (PUBLIC_ROUTES.has(pathname)) return NextResponse.next();

  const sessionToken = req.cookies.get(SESSION_COOKIE)?.value;
  if (!sessionToken) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const response = NextResponse.next();
  response.headers.set('x-session-token', sessionToken);
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public/).*)'],
};
