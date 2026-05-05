/**
 * Minimal tRPC context for frontend-only API routes.
 * Full tRPC logic lives in backend/src/server/trpc.ts
 */

import { initTRPC } from '@trpc/server';
import { type NextRequest } from 'next/server';
import superjson from 'superjson';
import { SESSION_COOKIE } from '@/lib/constants';

export interface TRPCContext {
  req: NextRequest;
  user: { id: string; role: string } | null;
}

export async function createTRPCContext(req: NextRequest): Promise<TRPCContext> {
  // Session validation is handled by backend; frontend context is lightweight
  const sessionToken = req.cookies.get(SESSION_COOKIE)?.value ?? '';
  return { req, user: sessionToken ? { id: '', role: 'pending' } : null };
}

const t = initTRPC.context<TRPCContext>().create({ transformer: superjson });
export const router          = t.router;
export const publicProcedure = t.procedure;
