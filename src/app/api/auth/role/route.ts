/**
 * POST /api/auth/role
 * Assign role (freelancer/client) to a pending user — ONE TIME, PERMANENT LOCK.
 * Reads session from cookie, proxies to backend /auth/role.
 * On success: refreshes the ng_role cookie so middleware picks up the new role.
 */
import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE } from '@/lib/constants';

const ROLE_COOKIE  = 'ng_role';
const VALID_ROLES  = ['freelancer', 'client'] as const;

export async function POST(req: NextRequest) {
  const sessionToken = req.cookies.get(SESSION_COOKIE)?.value;
  if (!sessionToken) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const body = await req.json() as { role?: string };
  if (!body.role || !VALID_ROLES.includes(body.role as typeof VALID_ROLES[number])) {
    return NextResponse.json({ error: "role must be 'freelancer' or 'client'" }, { status: 400 });
  }

  try {
    const backendUrl = process.env.BACKEND_URL ?? 'http://localhost:4000';
    const res = await fetch(`${backendUrl}/auth/role`, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${sessionToken}`,
      },
      body: JSON.stringify({ role: body.role }),
    });

    const data = await res.json() as { success?: boolean; role?: string; error?: string };

    if (!res.ok || !data.success) {
      return NextResponse.json(data, { status: res.status });
    }

    // ── Role locked successfully — update ng_role cookie ───
    // The ng_role cookie drives middleware routing and is refreshed here
    // so the user is immediately routed to the correct dashboard without
    // needing to re-login.
    const isProd   = process.env.NODE_ENV === 'production';
    const response = NextResponse.json({ success: true, role: data.role });

    response.cookies.set(ROLE_COOKIE, data.role ?? body.role, {
      httpOnly: false,              // middleware reads this directly
      secure:   isProd,
      sameSite: 'lax',
      maxAge:   30 * 24 * 60 * 60, // same lifetime as session
      path:     '/',
    });

    return response;

  } catch (err) {
    console.error('[/api/auth/role]', err);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
