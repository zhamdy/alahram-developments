import { Hono } from 'hono';
import type { Env } from '../../api/[[route]]';
import { getDb } from '../db';
import { verifyPassword, signToken, type AuthPayload } from '../crypto';
import { requireAuth } from '../middleware/auth';

export const authRoutes = new Hono<{ Bindings: Env }>();

// POST /api/auth/login
authRoutes.post('/login', async (c) => {
  const body = await c.req.json<{ email?: string; password?: string }>();
  const { email, password } = body ?? {};

  if (!email || !password) {
    return c.json({ success: false, error: 'Email and password are required' }, 400);
  }

  const db = getDb(c.env);
  const result = await db.execute({
    sql: 'SELECT id, name, email, password, role, created_at FROM users WHERE email = ?',
    args: [email],
  });

  const user = result.rows[0] as
    | { id: number; name: string; email: string; password: string; role: string; created_at: string }
    | undefined;

  if (!user || !(await verifyPassword(password, user.password))) {
    return c.json({ success: false, error: 'Invalid email or password' }, 401);
  }

  const payload: AuthPayload = { userId: user.id, email: user.email, role: user.role };
  const token = await signToken(payload, c.env.JWT_SECRET);

  return c.json({
    success: true,
    data: {
      user: { id: String(user.id), name: user.name, email: user.email, role: user.role, createdAt: user.created_at },
      tokens: { accessToken: token, refreshToken: token },
    },
  });
});

// POST /api/auth/logout
authRoutes.post('/logout', (c) => {
  return c.json({ success: true, data: null });
});

// GET /api/auth/me
authRoutes.get('/me', requireAuth, async (c) => {
  const authUser = c.get('user');
  const db = getDb(c.env);

  const result = await db.execute({
    sql: 'SELECT id, name, email, role, created_at FROM users WHERE id = ?',
    args: [authUser.userId],
  });

  const user = result.rows[0] as
    | { id: number; name: string; email: string; role: string; created_at: string }
    | undefined;

  if (!user) {
    return c.json({ success: false, error: 'User not found' }, 404);
  }

  return c.json({
    success: true,
    data: { id: String(user.id), name: user.name, email: user.email, role: user.role, createdAt: user.created_at },
  });
});
