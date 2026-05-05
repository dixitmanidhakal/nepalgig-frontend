/**
 * Frontend re-exports the backend appRouter for tRPC type inference.
 * In production, this can be a shared package or type-only import.
 *
 * For Phase 1 (single-host monolith), the backend code runs inside the
 * Next.js API routes. For microservices, replace with:
 *   import type { AppRouter } from '@nepalgig/backend';
 */

// Re-export from backend src for type safety
export type { AppRouter } from '../../src/server/root';

// Placeholder router for standalone frontend builds
import { initTRPC } from '@trpc/server';
import superjson from 'superjson';

const t = initTRPC.create({ transformer: superjson });
export const appRouter = t.router({});
