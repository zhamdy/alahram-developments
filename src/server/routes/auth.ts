import { Router } from 'express';
import { compareSync } from 'bcryptjs';
import db from '../db.js';
import { signToken, requireAuth } from '../middleware/auth.js';

const router = Router();

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body ?? {};
  if (!email || !password) {
    res.status(400).json({ success: false, error: 'Email and password are required' });
    return;
  }

  const user = db.prepare('SELECT id, name, email, password, role, created_at FROM users WHERE email = ?').get(email) as
    | { id: number; name: string; email: string; password: string; role: string; created_at: string }
    | undefined;

  if (!user || !compareSync(password, user.password)) {
    res.status(401).json({ success: false, error: 'Invalid email or password' });
    return;
  }

  const token = signToken({ userId: user.id, email: user.email, role: user.role });

  res.json({
    success: true,
    data: {
      user: { id: String(user.id), name: user.name, email: user.email, role: user.role, createdAt: user.created_at },
      tokens: { accessToken: token, refreshToken: token },
    },
  });
});

// POST /api/auth/logout
router.post('/logout', (_req, res) => {
  res.json({ success: true, data: null });
});

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  const user = db.prepare('SELECT id, name, email, role, created_at FROM users WHERE id = ?').get(req.user!.userId) as
    | { id: number; name: string; email: string; role: string; created_at: string }
    | undefined;

  if (!user) {
    res.status(404).json({ success: false, error: 'User not found' });
    return;
  }

  res.json({
    success: true,
    data: { id: String(user.id), name: user.name, email: user.email, role: user.role, createdAt: user.created_at },
  });
});

export default router;
