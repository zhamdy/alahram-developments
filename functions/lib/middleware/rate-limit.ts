import { createMiddleware } from 'hono/factory';
import type { Env } from '../../api/[[route]]';

interface WindowEntry {
  timestamps: number[];
}

const ipWindows = new Map<string, WindowEntry>();
let lastPrune = Date.now();
const PRUNE_INTERVAL = 60_000;

function pruneExpired(windowMs: number): void {
  const now = Date.now();
  if (now - lastPrune < PRUNE_INTERVAL) return;
  lastPrune = now;
  const cutoff = now - windowMs;
  for (const [ip, entry] of ipWindows) {
    entry.timestamps = entry.timestamps.filter((t) => t > cutoff);
    if (entry.timestamps.length === 0) ipWindows.delete(ip);
  }
}

export function rateLimiter({ limit = 10, windowMs = 60_000 } = {}) {
  return createMiddleware<{ Bindings: Env }>(async (c, next) => {
    pruneExpired(windowMs);

    const ip = c.req.header('CF-Connecting-IP') ?? c.req.header('X-Forwarded-For') ?? 'unknown';
    const now = Date.now();
    const cutoff = now - windowMs;

    let entry = ipWindows.get(ip);
    if (!entry) {
      entry = { timestamps: [] };
      ipWindows.set(ip, entry);
    }

    entry.timestamps = entry.timestamps.filter((t) => t > cutoff);

    if (entry.timestamps.length >= limit) {
      const oldestInWindow = entry.timestamps[0]!;
      const retryAfter = Math.ceil((oldestInWindow + windowMs - now) / 1000);
      c.header('Retry-After', String(retryAfter));
      return c.json({ success: false, error: 'Too many requests' }, 429);
    }

    entry.timestamps.push(now);
    await next();
  });
}
