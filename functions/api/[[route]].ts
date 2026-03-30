import { Hono } from 'hono';
import { handle } from 'hono/cloudflare-pages';
import { publicRoutes } from '../lib/routes/public';
import { authRoutes } from '../lib/routes/auth';
import { adminRoutes } from '../lib/routes/admin';

export interface Env {
  TURSO_URL: string;
  TURSO_AUTH_TOKEN: string;
  JWT_SECRET: string;
  UPLOADS: R2Bucket;
}

const app = new Hono<{ Bindings: Env }>().basePath('/api');

// Health check
app.get('/health', (c) => {
  return c.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
});

// Mount route groups
app.route('/', publicRoutes);
app.route('/auth', authRoutes);
app.route('/admin', adminRoutes);

// 404 fallback
app.all('*', (c) => {
  return c.json({ success: false, error: 'Not found' }, 404);
});

export const onRequest = handle(app);
