/**
 * POST /api/auth/role
 * Assign role (freelancer/client) to a pending user.
 * Reads session from cookie, proxies to backend /auth/role.
 */
import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE } from '@/lib/constants';

export async function POST(req: NextRequest) {
  const sessionToken = req.cookies.get(SESSION_COOKIE)?.value;
  if (!sessionToken) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const body = await req.json() as { role?: string };
  if (!body.role || !['freelancer', 'client'].includes(body.role)) {
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

    const data = await res.json() as Record<string, unknown>;
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error('[/api/auth/role]', err);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
