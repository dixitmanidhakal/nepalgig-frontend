/**
 * POST /api/auth/verify
 * Called by the /auth/verify page with { token, phone }.
 * Proxies to backend → gets sessionToken → sets httpOnly cookie → returns role.
 *
 * The /auth/verify PAGE (not this route) handles the UX and redirect.
 */

import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE } from '@/lib/constants';
import { z } from 'zod';

const schema = z.object({
  token: z.string().min(10),
  phone: z.string().min(7),
});

export async function POST(req: NextRequest) {
  try {
    const body   = await req.json() as { token?: string; phone?: string };
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'token and phone are required' }, { status: 400 });
    }

    const ip = req.headers.get('x-real-ip')
      ?? req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      ?? 'unknown';

    const backendUrl = process.env.BACKEND_URL ?? 'http://localhost:4000';
    const res = await fetch(`${backendUrl}/auth/verify`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        token:     parsed.data.token,
        phone:     parsed.data.phone,
        ipAddress: ip,
        userAgent: req.headers.get('user-agent') ?? '',
      }),
    });

    const data = await res.json() as {
      success?:      boolean;
      sessionToken?: string;
      role?:         string;
      userId?:       string;
      isNewUser?:    boolean;
      error?:        string;
    };

    if (!res.ok || !data.success || !data.sessionToken) {
      return NextResponse.json(
        { success: false, error: data.error ?? 'verification_failed' },
        { status: res.ok ? 401 : res.status }
      );
    }

    // Set session cookie (httpOnly, secure in prod)
    const response = NextResponse.json({
      success:   true,
      role:      data.role,
      userId:    data.userId,
      isNewUser: data.isNewUser,
    });

    response.cookies.set(SESSION_COOKIE, data.sessionToken, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge:   30 * 24 * 60 * 60,   // 30 days
      path:     '/',
    });

    return response;

  } catch (err) {
    console.error('[/api/auth/verify]', err);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
