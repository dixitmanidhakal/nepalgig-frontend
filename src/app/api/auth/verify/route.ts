/**
 * POST /api/auth/verify
 * Called by the /auth/verify page with { token, phone, deviceHash }.
 * Proxies to backend → gets sessionToken → sets httpOnly cookies → returns role.
 *
 * Cookies set on success:
 *   ng_session  — httpOnly, 30-day session token (SHA-256 hash stored in DB)
 *   ng_device   — NOT httpOnly (middleware needs to read it), 1-year device fingerprint
 *
 * The /auth/verify PAGE (not this route) handles the UX and redirect.
 */

import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE } from '@/lib/constants';
import { z } from 'zod';

const DEVICE_COOKIE = 'ng_device';

const schema = z.object({
  token:      z.string().min(10),
  phone:      z.string().min(7),
  // Full 64-char SHA-256 from getDeviceHash() — sent by verify page
  deviceHash: z.string().length(64).regex(/^[0-9a-f]{64}$/).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body   = await req.json() as { token?: string; phone?: string; deviceHash?: string };
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
        token:      parsed.data.token,
        phone:      parsed.data.phone,
        deviceHash: parsed.data.deviceHash,
        ipAddress:  ip,
        userAgent:  req.headers.get('user-agent') ?? '',
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

    // ── Set cookies ────────────────────────────────────────
    const isProd   = process.env.NODE_ENV === 'production';
    const response = NextResponse.json({
      success:   true,
      role:      data.role,
      userId:    data.userId,
      isNewUser: data.isNewUser,
    });

    // Session cookie — httpOnly so JS cannot read it
    response.cookies.set(SESSION_COOKIE, data.sessionToken, {
      httpOnly: true,
      secure:   isProd,
      sameSite: 'lax',
      maxAge:   30 * 24 * 60 * 60,   // 30 days
      path:     '/',
    });

    // Device cookie — readable by middleware (not httpOnly) so the Edge
    // can compare the partial hash on every protected request.
    // 1-year expiry; refreshed on every successful login.
    if (parsed.data.deviceHash) {
      response.cookies.set(DEVICE_COOKIE, parsed.data.deviceHash, {
        httpOnly: false,              // middleware reads this directly
        secure:   isProd,
        sameSite: 'lax',
        maxAge:   365 * 24 * 60 * 60, // 1 year
        path:     '/',
      });
    }

    return response;

  } catch (err) {
    console.error('[/api/auth/verify]', err);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
