/**
 * Standalone API server for deployment on Render (or similar PaaS).
 * Runs only the Express API routes — no Angular SSR.
 */
import express from 'express';
import cors from 'cors';
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import db from './db.js';
import authRoutes from './routes/auth.js';
import publicRoutes from './routes/public.js';
import adminRoutes from './routes/admin.js';

const dataDir = join(process.cwd(), 'data');
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

const app = express();

// ── CORS ──
const allowedOrigins = [
  'https://alahram-developments.pages.dev',
  'https://alahram-developments.com',
  'https://www.alahram-developments.com',
];

if (process.env['NODE_ENV'] !== 'production') {
  allowedOrigins.push('http://localhost:4200', 'http://localhost:4000');
}

app.use(
  cors({
    origin(origin, callback) {
      // Allow requests with no origin (server-to-server, curl, etc.)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin ${origin} not allowed`));
      }
    },
    credentials: true,
  }),
);

// ── JSON body parser ──
app.use(express.json());

// ── Health check ──
app.get('/api/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
});

// ── Serve uploaded files ──
const uploadsDir = join(dataDir, 'uploads');
if (!existsSync(uploadsDir)) {
  mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir, { maxAge: '7d' }));

// ── API routes ──
app.use('/api/auth', authRoutes);
app.use('/api', publicRoutes);
app.use('/api/admin', adminRoutes);

// ── Newsletter ──
app.post('/api/newsletter', (req, res) => {
  const { email } = req.body ?? {};
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    res.status(400).json({ success: false, message: 'Invalid email' });
    return;
  }

  const sanitized = email.trim().toLowerCase();
  const existing = db.prepare('SELECT id FROM subscribers WHERE email = ?').get(sanitized);
  if (existing) {
    res.json({ success: true, message: 'Already subscribed' });
    return;
  }

  db.prepare('INSERT INTO subscribers (email) VALUES (?)').run(sanitized);
  res.json({ success: true, message: 'Subscribed successfully' });
});

// ── Contact form ──
app.post('/api/contact', (req, res) => {
  const { name, phone, message } = req.body ?? {};
  if (!name || !phone || !message) {
    res.status(400).json({ success: false, message: 'All fields are required' });
    return;
  }

  db.prepare('INSERT INTO contacts (name, phone, message) VALUES (?, ?, ?)').run(
    String(name).trim(),
    String(phone).trim(),
    String(message).trim(),
  );
  res.json({ success: true, message: 'Message received' });
});

// ── Start server ──
const port = process.env['PORT'] || 3000;
app.listen(port, () => {
  console.log(`API server listening on port ${port}`);
});
