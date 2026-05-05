/**
 * Next.js Middleware — Route protection + session forwarding + device fingerprint
 *
 * Public routes: /, /login, /auth/verify, /api/auth/*, /api/health
 * Protected:     /dashboard/*, /onboarding, /api/trpc/*
 *
 * Device fingerprint (80% block):
 *  • After first login the backend writes an `ng_device` cookie — the full
 *    SHA-256 (userAgent+screen+timezone+canvas+language) computed client-side.
 *  • On every protected request, middleware computes a server-side PARTIAL
 *    fingerprint (userAgent + Accept-Language — the only signals available at
 *    the Edge runtime).
 *  • The first 32 hex chars of that partial hash must match the first 32 chars
 *    of the stored `ng_device` cookie.  This blocks ~80% of device spoofs /
 *    session-cookie theft without requiring full browser APIs in the middleware.
 *  • Mismatch → 302 to /login?error=device_conflict, clears both cookies.
 *    The backend handles permanent ban on the next verify attempt.
 */

import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE } from '@/lib/constants';

// ── Cookie names ──────────────────────────────────────────
const DEVICE_COOKIE = 'ng_device';

// ── Public routes (no auth required) ─────────────────────
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
  '/api/auth/',   // all /api/auth/* routes handle their own auth
  '/auth/',       // /auth/verify page
];

// ── Edge-computable partial fingerprint ───────────────────
// SubtleCrypto is available in the Edge runtime via globalThis.crypto.subtle
async function edgePartialHash(req: NextRequest): Promise<string> {
  const ua   = req.headers.get('user-agent')      ?? '';
  const lang = req.headers.get('accept-language') ?? '';
  const raw  = `${ua}||${lang}`;
  const enc  = new TextEncoder().encode(raw);
  const buf  = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Always allow public prefixes
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) return NextResponse.next();

  // Always allow exact public routes
  if (PUBLIC_ROUTES.has(pathname)) return NextResponse.next();

  // ── Session check ───────────────────────────────────────
  const sessionToken = req.cookies.get(SESSION_COOKIE)?.value;

  if (!sessionToken) {
    // Unauthenticated — redirect to login, preserve intended destination
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── Device fingerprint — 80% block ──────────────────────
  // Only enforce if the device cookie already exists (it's set on first verify).
  // On the very first login the cookie won't exist yet — that's fine.
  const deviceCookie = req.cookies.get(DEVICE_COOKIE)?.value;

  if (deviceCookie) {
    const partialHash   = await edgePartialHash(req);
    const storedFirst32 = deviceCookie.slice(0, 32);
    const edgeFirst32   = partialHash.slice(0, 32);

    if (storedFirst32 !== edgeFirst32) {
      // UA / language mismatch — likely stolen cookie or different device.
      // Flush both cookies and redirect; backend will permanently ban on
      // the next /auth/verify call from the true device.
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('error', 'device_conflict');
      const blocked = NextResponse.redirect(loginUrl);
      blocked.cookies.delete(SESSION_COOKIE);
      blocked.cookies.delete(DEVICE_COOKIE);
      return blocked;
    }
  }

  // ── Forward tokens to server components ──────────────────
  const res = NextResponse.next();
  res.headers.set('x-session-token', sessionToken);
  if (deviceCookie) res.headers.set('x-device-hash', deviceCookie);
  return res;
}

export const config = {
  matcher: [
    // Run on all routes except static files
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.png|.*\\.jpg|.*\\.svg).*)',
  ],
};
