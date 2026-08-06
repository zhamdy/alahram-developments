import { Router } from 'express';
import { compareSync } from 'bcryptjs';
import db, { rowToObject } from '../db.js';
import { signToken, requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/login', async (req, res) => {
  const { email, password } = req.body ?? {};
  if (!email || !password) {
    res.status(400).json({ success: false, error: 'Email and password are required' });
    return;
  }

  const result = await db.execute({
    sql: 'SELECT id, name, email, password, role, created_at FROM users WHERE email = ?',
    args: [email],
  });
  const user = rowToObject(result);

  if (!user || !compareSync(password as string, user['password'] as string)) {
    res.status(401).json({ success: false, error: 'Invalid email or password' });
    return;
  }

  const token = signToken({ userId: Number(user['id']), email: user['email'] as string, role: user['role'] as string });

  res.json({
    success: true,
    data: {
      user: { id: String(user['id']), name: user['name'], email: user['email'], role: user['role'], createdAt: user['created_at'] },
      tokens: { accessToken: token, refreshToken: token },
    },
  });
});

router.post('/logout', (_req, res) => {
  res.json({ success: true, data: null });
});

router.get('/me', requireAuth, async (req, res) => {
  const result = await db.execute({
    sql: 'SELECT id, name, email, role, created_at FROM users WHERE id = ?',
    args: [req.user!.userId],
  });
  const user = rowToObject(result);

  if (!user) {
    res.status(404).json({ success: false, error: 'User not found' });
    return;
  }

  res.json({
    success: true,
    data: { id: String(user['id']), name: user['name'], email: user['email'], role: user['role'], createdAt: user['created_at'] },
  });
});

export default router;
