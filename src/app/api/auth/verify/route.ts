/**
 * GET /api/auth/verify?token=xxx&email=yyy
 * Called when user clicks the magic link in their email.
 * Validates the token via backend → sets session cookie → redirects by role.
 */

import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE } from '@/lib/constants';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const rawToken = searchParams.get('token');
  const email    = searchParams.get('email');

  if (!rawToken || !email) {
    return NextResponse.redirect(new URL('/login?error=invalid_link', req.url));
  }

  const ipAddress =
    req.headers.get('x-real-ip') ??
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim();

  try {
    const backendUrl = process.env.BACKEND_API_URL ?? 'http://localhost:4000';
    const res = await fetch(`${backendUrl}/auth/verify`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        rawToken,
        email: decodeURIComponent(email),
        ipAddress,
        userAgent: req.headers.get('user-agent'),
      }),
    });

    const data = await res.json() as {
      success: boolean;
      sessionToken?: string;
      role?: string;
      error?: string;
    };

    if (!data.success || !data.sessionToken) {
      const errorMap: Record<string, string> = {
        expired:           'link_expired',
        used:              'link_used',
        invalid:           'invalid_link',
        banned:            'account_banned',
        too_many_attempts: 'too_many_attempts',
      };
      const code = errorMap[data.error ?? ''] ?? 'invalid_link';
      return NextResponse.redirect(new URL(`/login?error=${code}`, req.url));
    }

    const dashboardUrl = getDashboard(data.role ?? 'pending');
    const response = NextResponse.redirect(new URL(dashboardUrl, req.url));
    response.cookies.set(SESSION_COOKIE, data.sessionToken, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge:   30 * 24 * 60 * 60,
      path:     '/',
    });

    return response;
  } catch (err) {
    console.error('[/api/auth/verify]', err);
    return NextResponse.redirect(new URL('/login?error=server_error', req.url));
  }
}

function getDashboard(role: string): string {
  switch (role) {
    case 'freelancer': return '/dashboard/freelancer';
    case 'client':     return '/dashboard/client';
    case 'admin':      return '/admin';
    default:           return '/onboarding';
  }
}
