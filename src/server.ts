import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import compression from 'compression';
import express from 'express';
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import db from './server/db.js';
import authRoutes from './server/routes/auth.js';
import publicRoutes from './server/routes/public.js';
import adminRoutes from './server/routes/admin.js';

const browserDistFolder = join(import.meta.dirname, '../browser');
const dataDir = join(process.cwd(), 'data');
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

const app = express();

app.use(compression());
const angularApp = new AngularNodeAppEngine();

/**
 * API routes — JSON body parser scoped to /api
 */
app.use('/api', express.json());

/**
 * Serve uploaded files
 */
const uploadsDir = join(dataDir, 'uploads');
if (!existsSync(uploadsDir)) {
  mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir, { maxAge: '7d' }));

/**
 * Auth routes
 */
app.use('/api/auth', authRoutes);

/**
 * Public API routes (projects, zones, gallery)
 */
app.use('/api', publicRoutes);

/**
 * Admin API routes (requires auth)
 */
app.use('/api/admin', adminRoutes);

/**
 * Legacy API endpoints — newsletter & contact (now backed by DB)
 */
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

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) => (response ? writeResponseToNodeResponse(response, res) : next()))
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
