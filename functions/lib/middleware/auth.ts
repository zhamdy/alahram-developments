import { createMiddleware } from 'hono/factory';
import type { Env } from '../../api/[[route]]';
import { verifyToken, type AuthPayload } from '../crypto';

// Extend Hono context variables to include user
declare module 'hono' {
  interface ContextVariableMap {
    user: AuthPayload;
  }
}

export const requireAuth = createMiddleware<{ Bindings: Env }>(async (c, next) => {
  const header = c.req.header('Authorization');
  if (!header?.startsWith('Bearer ')) {
    return c.json({ success: false, error: 'Authentication required' }, 401);
  }

  try {
    const token = header.slice(7);
    const payload = await verifyToken(token, c.env.JWT_SECRET);
    c.set('user', payload);
    await next();
  } catch {
    return c.json({ success: false, error: 'Invalid or expired token' }, 401);
  }
});

export function requireRole(...roles: string[]) {
  return createMiddleware<{ Bindings: Env }>(async (c, next) => {
    const user = c.get('user');
    if (!user || !roles.includes(user.role)) {
      return c.json({ success: false, error: 'Insufficient permissions' }, 403);
    }
    await next();
  });
}
