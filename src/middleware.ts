/**
 * Next.js Middleware — Route protection + session forwarding
 *
 * Public routes: /, /login, /auth/verify, /api/auth/*, /api/health
 * Protected:     /dashboard/*, /onboarding, /api/trpc/*
 */

import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE } from '@/lib/constants';

// Exact public routes (no session required)
const PUBLIC_ROUTES = new Set([
  '/',
  '/login',
  '/about',
  '/terms',
  '/privacy',
  '/api/health',
]);

// Prefixes that are always public
const PUBLIC_PREFIXES = [
  '/_next/',
  '/public/',
  '/favicon',
  '/api/auth/',      // all /api/auth/* routes are public (they handle their own auth)
  '/auth/',          // /auth/verify page
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Always allow public prefixes
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) return NextResponse.next();

  // Always allow exact public routes
  if (PUBLIC_ROUTES.has(pathname)) return NextResponse.next();

  // Check session cookie
  const sessionToken = req.cookies.get(SESSION_COOKIE)?.value;

  if (!sessionToken) {
    // Redirect to login, preserve intended destination
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Pass session token to server components via header
  const res = NextResponse.next();
  res.headers.set('x-session-token', sessionToken);
  return res;
}

export const config = {
  matcher: [
    // Run on all routes except static files
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.png|.*\\.jpg|.*\\.svg).*)',
  ],
};
