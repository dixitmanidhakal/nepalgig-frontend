/**
 * Next.js Middleware — Session + Role + Device fingerprint
 *
 * ── Route rules ───────────────────────────────────────────
 *  Public (no auth):        /, /login, /about, /terms, /privacy, /api/health
 *  Always public prefixes:  /_next/, /public/, /favicon, /api/auth/, /auth/
 *
 *  Pending-only:  /onboarding            → redirect to dashboard if role set
 *  Freelancer:    /gigs, /gigs/*         → redirect to /dashboard/freelancer if not freelancer
 *  Client:        /dashboard/client, /gigs/create → redirect to /dashboard/client if not client
 *  Any authed:    /dashboard, /dashboard/* (else) → redirect by role
 *
 * ── Role cookie (ng_role) ─────────────────────────────────
 *  Set by /api/auth/verify (login) and /api/auth/role (onboarding).
 *  NOT httpOnly — middleware reads it to enforce role routes at Edge,
 *  no DB call required. NOT trusted for authorisation (tRPC procedures
 *  re-validate via session → DB on every mutation/query).
 *
 * ── Device fingerprint (80% block) ───────────────────────
 *  ng_device cookie: first 32 chars of client SHA-256 fingerprint.
 *  Middleware computes SHA-256(UA + Accept-Language)[0:32] at Edge
 *  and compares. Mismatch → clear cookies, redirect to login.
 */

import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE } from '@/lib/constants';

// ── Cookie names ──────────────────────────────────────────
const DEVICE_COOKIE = 'ng_device';
const ROLE_COOKIE   = 'ng_role';

// ── Public routes ─────────────────────────────────────────
const PUBLIC_ROUTES = new Set([
  '/',
  '/login',
  '/about',
  '/terms',
  '/privacy',
  '/api/health',
]);

const PUBLIC_PREFIXES = [
  '/_next/',
  '/public/',
  '/favicon',
  '/api/auth/',
  '/auth/',
];

// ── Role → home dashboard ─────────────────────────────────
const ROLE_HOME: Record<string, string> = {
  freelancer: '/dashboard/freelancer',
  client:     '/dashboard/client',
  admin:      '/dashboard/client',   // admins use client dashboard for now
  pending:    '/onboarding',
};

// ── Edge partial fingerprint ──────────────────────────────
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

  // ── Always allow public prefixes & routes ─────────────────
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) return NextResponse.next();
  if (PUBLIC_ROUTES.has(pathname)) return NextResponse.next();

  // ── Session gate ──────────────────────────────────────────
  const sessionToken = req.cookies.get(SESSION_COOKIE)?.value;
  if (!sessionToken) {
    const url = new URL('/login', req.url);
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  // ── Device fingerprint — 80% block ───────────────────────
  const deviceCookie = req.cookies.get(DEVICE_COOKIE)?.value;
  if (deviceCookie) {
    const partialHash = await edgePartialHash(req);
    if (deviceCookie.slice(0, 32) !== partialHash.slice(0, 32)) {
      const url = new URL('/login', req.url);
      url.searchParams.set('error', 'device_conflict');
      const blocked = NextResponse.redirect(url);
      blocked.cookies.delete(SESSION_COOKIE);
      blocked.cookies.delete(DEVICE_COOKIE);
      blocked.cookies.delete(ROLE_COOKIE);
      return blocked;
    }
  }

  // ── Role-based routing ────────────────────────────────────
  const role = req.cookies.get(ROLE_COOKIE)?.value ?? 'pending';

  // /onboarding — only for pending users; others go to their dashboard
  if (pathname === '/onboarding') {
    if (role !== 'pending') {
      return NextResponse.redirect(new URL(ROLE_HOME[role] ?? '/dashboard/freelancer', req.url));
    }
    return passThrough(req, sessionToken, deviceCookie);
  }

  // /gigs and /gigs/* (except /gigs/create which is client-only)
  if (pathname.startsWith('/gigs')) {
    if (pathname === '/gigs/create') {
      // Clients post gigs
      if (role !== 'client' && role !== 'admin') {
        return NextResponse.redirect(new URL(ROLE_HOME[role] ?? '/dashboard/freelancer', req.url));
      }
    } else {
      // Freelancers browse/view gigs
      if (role !== 'freelancer' && role !== 'admin') {
        return NextResponse.redirect(new URL(ROLE_HOME[role] ?? '/dashboard/client', req.url));
      }
    }
    return passThrough(req, sessionToken, deviceCookie);
  }

  // /dashboard/freelancer — freelancer-only
  if (pathname.startsWith('/dashboard/freelancer')) {
    if (role !== 'freelancer' && role !== 'admin') {
      return NextResponse.redirect(new URL(ROLE_HOME[role] ?? '/login', req.url));
    }
    return passThrough(req, sessionToken, deviceCookie);
  }

  // /dashboard/client — client-only
  if (pathname.startsWith('/dashboard/client')) {
    if (role !== 'client' && role !== 'admin') {
      return NextResponse.redirect(new URL(ROLE_HOME[role] ?? '/login', req.url));
    }
    return passThrough(req, sessionToken, deviceCookie);
  }

  // /dashboard (generic) — redirect to role-appropriate dashboard
  if (pathname === '/dashboard' || pathname === '/dashboard/') {
    return NextResponse.redirect(new URL(ROLE_HOME[role] ?? '/login', req.url));
  }

  // All other protected routes — just require session (role checked by tRPC)
  return passThrough(req, sessionToken, deviceCookie);
}

// ── Forward session + device tokens to server components ──
function passThrough(
  req: NextRequest,
  sessionToken: string,
  deviceCookie: string | undefined,
): NextResponse {
  const res = NextResponse.next();
  res.headers.set('x-session-token', sessionToken);
  if (deviceCookie) res.headers.set('x-device-hash', deviceCookie);
  return res;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.png|.*\\.jpg|.*\\.svg).*)',
  ],
};
