/**
 * POST /api/auth/logout
 * Revokes session on backend + clears cookie.
 */
import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE } from '@/lib/constants';

export async function POST(req: NextRequest) {
  const sessionToken = req.cookies.get(SESSION_COOKIE)?.value;

  if (sessionToken) {
    try {
      const backendUrl = process.env.BACKEND_URL ?? 'http://localhost:4000';
      await fetch(`${backendUrl}/auth/logout`, {
        method:  'POST',
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
    } catch (err) {
      console.error('[/api/auth/logout]', err);
      // Continue even if backend call fails — still clear cookie
    }
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set(SESSION_COOKIE, '', {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge:   0,
    path:     '/',
  });
  return response;
}
