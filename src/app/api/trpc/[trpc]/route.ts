/**
 * tRPC HTTP Handler — App Router
 * Proxies tRPC calls to backend or runs them directly.
 */

import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { type NextRequest } from 'next/server';

// NOTE: Import your appRouter from backend once monorepo is set up,
// or use tRPC client proxy to forward to backend service.
// For Phase 1 (single host), import directly:
import { appRouter }       from '@/server/root';
import { createTRPCContext } from '@/server/trpc';

const handler = (req: NextRequest) =>
  fetchRequestHandler({
    endpoint:      '/api/trpc',
    req,
    router:        appRouter,
    createContext: () => createTRPCContext(req),
    onError:
      process.env.NODE_ENV === 'development'
        ? ({ path, error }) => console.error(`[tRPC] ${path}:`, error)
        : undefined,
  });

export { handler as GET, handler as POST };
