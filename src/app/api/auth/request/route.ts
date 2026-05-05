/**
 * POST /api/auth/request
 * Proxies to backend → returns { loginUrl, expiresAt, isNewUser, phone }
 *
 * Body: { phone: string }  e.g. "9812345678" or "+9779812345678"
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const schema = z.object({
  phone: z.string().min(7).max(20),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { phone?: string };
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'invalid_phone' }, { status: 400 });
    }

    const ip = req.headers.get('x-real-ip')
      ?? req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      ?? 'unknown';

    const backendUrl = process.env.BACKEND_URL ?? 'http://localhost:4000';
    const res = await fetch(`${backendUrl}/auth/request`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        phone:     parsed.data.phone,
        ipAddress: ip,
        userAgent: req.headers.get('user-agent') ?? '',
      }),
    });

    const data = await res.json() as Record<string, unknown>;
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error('[/api/auth/request]', err);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
