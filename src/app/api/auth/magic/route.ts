/**
 * POST /api/auth/magic
 * Send a magic login link to the provided email address.
 *
 * Body: { email: string }
 * Returns: { success: true, message: string }
 *
 * Rate limited: 3 requests per email per hour (enforced in backend lib)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const bodySchema = z.object({
  email: z
    .string()
    .email('Invalid email address')
    .max(255)
    .transform((e) => e.toLowerCase().trim()),
});

export async function POST(req: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? 'Invalid email' },
        { status: 400 },
      );
    }

    const { email } = parsed.data;
    const ipAddress =
      req.headers.get('x-real-ip') ??
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      'unknown';

    // Proxy to backend API
    const backendUrl = process.env.BACKEND_API_URL ?? 'http://localhost:4000';
    const backendRes = await fetch(`${backendUrl}/auth/magic`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email, ipAddress, userAgent: req.headers.get('user-agent') }),
    });

    const data = await backendRes.json() as { success?: boolean; error?: string; devToken?: string };

    if (backendRes.status === 429) {
      return NextResponse.json(
        { error: 'Too many requests. Try again in 1 hour.' },
        { status: 429 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'If this email exists, a login link was sent. Check your inbox.',
        ...(process.env.NODE_ENV !== 'production' && data.devToken
          ? { devToken: data.devToken }
          : {}),
      },
      { status: 200 },
    );
  } catch (err) {
    console.error('[/api/auth/magic]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
