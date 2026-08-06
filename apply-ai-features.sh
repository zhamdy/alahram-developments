#!/usr/bin/env bash
# Auto-generated installer — applies all Al-Ahram AI-feature file changes in one go.
# Run this from the ROOT of your alahram-developments repo:
#   bash apply-ai-features.sh
set -e
echo "Applying Al-Ahram AI features (units + chat)..."

mkdir -p "src/server"
cat > "src/server/schema.sql" << 'AHRAM_EOF_0'
-- Al-Ahram Developments Database Schema

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin' CHECK(role IN ('admin', 'editor', 'viewer')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS zones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description_ar TEXT NOT NULL DEFAULT '',
  description_en TEXT NOT NULL DEFAULT '',
  image_url TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  zone_id INTEGER NOT NULL REFERENCES zones(id) ON DELETE CASCADE,
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description_ar TEXT NOT NULL DEFAULT '',
  description_en TEXT NOT NULL DEFAULT '',
  status_description_ar TEXT NOT NULL DEFAULT '',
  status_description_en TEXT NOT NULL DEFAULT '',
  location_ar TEXT NOT NULL DEFAULT '',
  location_en TEXT NOT NULL DEFAULT '',
  status_ar TEXT NOT NULL DEFAULT '',
  status_en TEXT NOT NULL DEFAULT '',
  image_url TEXT NOT NULL DEFAULT '',
  progress INTEGER NOT NULL DEFAULT 0,
  map_embed_url TEXT NOT NULL DEFAULT '',
  is_featured INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  last_updated_at TEXT NOT NULL DEFAULT (date('now')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS gallery_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption_ar TEXT NOT NULL DEFAULT '',
  caption_en TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  media_type TEXT NOT NULL DEFAULT 'image',
  image_kind TEXT NOT NULL DEFAULT 'gallery',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS units (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  unit_code TEXT NOT NULL,
  unit_type_ar TEXT NOT NULL DEFAULT '',
  unit_type_en TEXT NOT NULL DEFAULT '',
  area REAL NOT NULL,
  rooms INTEGER NOT NULL DEFAULT 0,
  bathrooms INTEGER NOT NULL DEFAULT 0,
  floor INTEGER,
  price REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'available' CHECK(status IN ('available', 'reserved', 'sold')),
  delivery_year INTEGER,
  unit_image_url TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(project_id, unit_code)
);

CREATE TABLE IF NOT EXISTS contacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read INTEGER NOT NULL DEFAULT 0,
  submitted_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS subscribers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  subscribed_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS site_settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

INSERT OR IGNORE INTO site_settings (key, value) VALUES ('projects_count', '21');
INSERT OR IGNORE INTO site_settings (key, value) VALUES ('units_count', '300');
INSERT OR IGNORE INTO site_settings (key, value) VALUES ('clients_count', '260');
INSERT OR IGNORE INTO site_settings (key, value) VALUES ('phone', '+201031198677');
INSERT OR IGNORE INTO site_settings (key, value) VALUES ('whatsapp', '+201153516871');

-- Indexes
CREATE INDEX IF NOT EXISTS idx_projects_zone_id ON projects(zone_id);
CREATE INDEX IF NOT EXISTS idx_projects_slug ON projects(slug);
CREATE INDEX IF NOT EXISTS idx_zones_slug ON zones(slug);
CREATE INDEX IF NOT EXISTS idx_gallery_project_id ON gallery_images(project_id);
CREATE INDEX IF NOT EXISTS idx_contacts_is_read ON contacts(is_read);
CREATE INDEX IF NOT EXISTS idx_units_project_id ON units(project_id);
CREATE INDEX IF NOT EXISTS idx_units_price ON units(price);
CREATE INDEX IF NOT EXISTS idx_units_status ON units(status);
AHRAM_EOF_0
echo "  wrote: src/server/schema.sql"

mkdir -p "functions/lib"
cat > "functions/lib/db.ts" << 'AHRAM_EOF_1'
import { createClient, type Client } from '@libsql/client/web';

export interface DbEnv {
  TURSO_URL: string;
  TURSO_AUTH_TOKEN: string;
}

let projectSchemaEnsured = false;
let projectSchemaEnsuring: Promise<void> | null = null;
let gallerySchemaEnsured = false;
let gallerySchemaEnsuring: Promise<void> | null = null;
let siteSettingsEnsured = false;
let siteSettingsEnsuring: Promise<void> | null = null;
let unitsTableEnsured = false;
let unitsTableEnsuring: Promise<void> | null = null;

export function getDb(env: DbEnv): Client {
  return createClient({
    url: env.TURSO_URL,
    authToken: env.TURSO_AUTH_TOKEN,
  });
}

export async function ensureProjectStatusDescriptionColumns(db: Client): Promise<void> {
  if (projectSchemaEnsured) {
    return;
  }

  if (projectSchemaEnsuring) {
    await projectSchemaEnsuring;
    return;
  }

  projectSchemaEnsuring = (async () => {
    const pragma = await db.execute("PRAGMA table_info('projects')");
    const columnNames = new Set(
      pragma.rows
        .map(row => {
          const value = (row as { name?: unknown }).name;
          return typeof value === 'string' ? value : '';
        })
        .filter(Boolean),
    );

    if (!columnNames.has('status_description_ar')) {
      await db.execute(
        "ALTER TABLE projects ADD COLUMN status_description_ar TEXT NOT NULL DEFAULT ''",
      );
    }

    if (!columnNames.has('status_description_en')) {
      await db.execute(
        "ALTER TABLE projects ADD COLUMN status_description_en TEXT NOT NULL DEFAULT ''",
      );
    }

    projectSchemaEnsured = true;
  })();

  try {
    await projectSchemaEnsuring;
  } finally {
    projectSchemaEnsuring = null;
  }
}

export async function ensureSiteSettingsTable(db: Client): Promise<void> {
  if (siteSettingsEnsured) return;
  if (siteSettingsEnsuring) { await siteSettingsEnsuring; return; }

  siteSettingsEnsuring = (async () => {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS site_settings (
        key   TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )
    `);

    const defaults: Record<string, string> = {
      projects_count: '21',
      units_count: '300',
      clients_count: '260',
      phone: '+201153516871',
    };

    for (const [key, value] of Object.entries(defaults)) {
      await db.execute({
        sql: 'INSERT OR IGNORE INTO site_settings (key, value) VALUES (?, ?)',
        args: [key, value],
      });
    }

    siteSettingsEnsured = true;
  })();

  try { await siteSettingsEnsuring; } finally { siteSettingsEnsuring = null; }
}

export async function ensureGalleryImageColumns(db: Client): Promise<void> {
  if (gallerySchemaEnsured) {
    return;
  }

  if (gallerySchemaEnsuring) {
    await gallerySchemaEnsuring;
    return;
  }

  gallerySchemaEnsuring = (async () => {
    const pragma = await db.execute("PRAGMA table_info('gallery_images')");
    const columnNames = new Set(
      pragma.rows
        .map(row => {
          const value = (row as { name?: unknown }).name;
          return typeof value === 'string' ? value : '';
        })
        .filter(Boolean),
    );

    if (!columnNames.has('caption_ar')) {
      await db.execute("ALTER TABLE gallery_images ADD COLUMN caption_ar TEXT NOT NULL DEFAULT ''");
    }

    if (!columnNames.has('caption_en')) {
      await db.execute("ALTER TABLE gallery_images ADD COLUMN caption_en TEXT NOT NULL DEFAULT ''");
    }

    if (!columnNames.has('sort_order')) {
      await db.execute(
        'ALTER TABLE gallery_images ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0',
      );
    }

    if (!columnNames.has('media_type')) {
      await db.execute(
        "ALTER TABLE gallery_images ADD COLUMN media_type TEXT NOT NULL DEFAULT 'image'",
      );
    }

    gallerySchemaEnsured = true;
  })();

  try {
    await gallerySchemaEnsuring;
  } finally {
    gallerySchemaEnsuring = null;
  }
}

export async function ensureUnitsTable(db: Client): Promise<void> {
  if (unitsTableEnsured) return;
  if (unitsTableEnsuring) { await unitsTableEnsuring; return; }

  unitsTableEnsuring = (async () => {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS units (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        unit_code TEXT NOT NULL,
        unit_type_ar TEXT NOT NULL DEFAULT '',
        unit_type_en TEXT NOT NULL DEFAULT '',
        area REAL NOT NULL,
        rooms INTEGER NOT NULL DEFAULT 0,
        bathrooms INTEGER NOT NULL DEFAULT 0,
        floor INTEGER,
        price REAL NOT NULL,
        status TEXT NOT NULL DEFAULT 'available' CHECK(status IN ('available', 'reserved', 'sold')),
        delivery_year INTEGER,
        unit_image_url TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        UNIQUE(project_id, unit_code)
      )
    `);

    await db.execute('CREATE INDEX IF NOT EXISTS idx_units_project_id ON units(project_id)');
    await db.execute('CREATE INDEX IF NOT EXISTS idx_units_price ON units(price)');
    await db.execute('CREATE INDEX IF NOT EXISTS idx_units_status ON units(status)');

    unitsTableEnsured = true;
  })();

  try { await unitsTableEnsuring; } finally { unitsTableEnsuring = null; }
}
AHRAM_EOF_1
echo "  wrote: functions/lib/db.ts"

mkdir -p "functions/lib/routes"
cat > "functions/lib/routes/public.ts" << 'AHRAM_EOF_2'
import { Hono } from 'hono';
import type { Env } from '../../api/[[route]]';
import { ensureGalleryImageColumns, ensureProjectStatusDescriptionColumns, ensureSiteSettingsTable, ensureUnitsTable, getDb } from '../db';

type Lang = 'ar' | 'en';

function getLang(lang: string | undefined): Lang {
  return lang === 'en' ? 'en' : 'ar';
}

export const publicRoutes = new Hono<{ Bindings: Env }>();

// ── Zones ──

// GET /api/zones
publicRoutes.get('/zones', async c => {
  const lang = getLang(c.req.query('lang'));
  const db = getDb(c.env);

  const nameCol = lang === 'en' ? 'name_en' : 'name_ar';
  const descCol = lang === 'en' ? 'description_en' : 'description_ar';

  const result = await db.execute(`
    SELECT z.id, z.slug,
      z.${nameCol} AS name,
      z.${descCol} AS description,
      z.image_url AS imageUrl,
      z.sort_order AS sortOrder,
      (SELECT COUNT(*) FROM projects p WHERE p.zone_id = z.id) AS projectCount
    FROM zones z
    ORDER BY z.sort_order
  `);

  return c.json({ success: true, data: result.rows });
});

// GET /api/zones/:slug
publicRoutes.get('/zones/:slug', async c => {
  const lang = getLang(c.req.query('lang'));
  const db = getDb(c.env);
  const slug = c.req.param('slug');

  const nameCol = lang === 'en' ? 'name_en' : 'name_ar';
  const descCol = lang === 'en' ? 'description_en' : 'description_ar';
  const pNameCol = lang === 'en' ? 'name_en' : 'name_ar';
  const pDescCol = lang === 'en' ? 'description_en' : 'description_ar';
  const pLocCol = lang === 'en' ? 'location_en' : 'location_ar';
  const pStatusCol = lang === 'en' ? 'status_en' : 'status_ar';

  const zoneResult = await db.execute({
    sql: `
      SELECT z.id, z.slug,
        z.${nameCol} AS name,
        z.${descCol} AS description,
        z.image_url AS imageUrl,
        z.sort_order AS sortOrder
      FROM zones z WHERE z.slug = ?
    `,
    args: [slug],
  });

  const zone = zoneResult.rows[0];
  if (!zone) {
    return c.json({ success: false, error: 'Zone not found' }, 404);
  }

  const projectsResult = await db.execute({
    sql: `
      SELECT p.id, p.slug, p.zone_id AS zoneId, z.slug AS zoneSlug,
        p.${pNameCol} AS name,
        p.${pDescCol} AS description,
        p.${pLocCol} AS location,
        p.${pStatusCol} AS status,
        p.image_url AS imageUrl,
        p.progress,
        p.is_featured AS isFeatured,
        p.last_updated_at AS lastUpdatedAt
      FROM projects p
      JOIN zones z ON z.id = p.zone_id
      WHERE p.zone_id = ?
      ORDER BY p.sort_order
    `,
    args: [zone.id],
  });

  return c.json({ success: true, data: { ...zone, projects: projectsResult.rows } });
});

// ── Projects ──

// GET /api/projects
publicRoutes.get('/projects', async c => {
  const lang = getLang(c.req.query('lang'));
  const db = getDb(c.env);
  const featured = c.req.query('featured');
  const zoneSlug = c.req.query('zone');

  const nameCol = lang === 'en' ? 'name_en' : 'name_ar';
  const descCol = lang === 'en' ? 'description_en' : 'description_ar';
  const locCol = lang === 'en' ? 'location_en' : 'location_ar';
  const statusCol = lang === 'en' ? 'status_en' : 'status_ar';

  let whereClause = '1=1';
  const args: (string | number)[] = [];

  if (featured === 'true') {
    whereClause += ' AND p.is_featured = 1';
  }
  if (zoneSlug) {
    whereClause += ' AND z.slug = ?';
    args.push(zoneSlug);
  }

  const result = await db.execute({
    sql: `
      SELECT p.id, p.slug, p.zone_id AS zoneId, z.slug AS zoneSlug,
        p.${nameCol} AS name,
        p.${descCol} AS description,
        p.${locCol} AS location,
        p.${statusCol} AS status,
        p.image_url AS imageUrl,
        p.progress,
        p.is_featured AS isFeatured,
        p.last_updated_at AS lastUpdatedAt
      FROM projects p
      JOIN zones z ON z.id = p.zone_id
      WHERE ${whereClause}
      ORDER BY p.sort_order
    `,
    args,
  });

  return c.json({ success: true, data: result.rows });
});

// GET /api/projects/:slug
publicRoutes.get('/projects/:slug', async c => {
  const lang = getLang(c.req.query('lang'));
  const db = getDb(c.env);
  const slug = c.req.param('slug');

  await ensureProjectStatusDescriptionColumns(db);
  await ensureGalleryImageColumns(db);

  const nameCol = lang === 'en' ? 'name_en' : 'name_ar';
  const descCol = lang === 'en' ? 'description_en' : 'description_ar';
  const fullDescCol = lang === 'en' ? 'status_description_en' : 'status_description_ar';
  const locCol = lang === 'en' ? 'location_en' : 'location_ar';
  const statusCol = lang === 'en' ? 'status_en' : 'status_ar';
  const zoneNameCol = lang === 'en' ? 'name_en' : 'name_ar';
  const captionCol = lang === 'en' ? 'caption_en' : 'caption_ar';

  let project: Record<string, unknown> | undefined;

  try {
    const projectResult = await db.execute({
      sql: `
        SELECT p.id, p.slug, p.zone_id AS zoneId, z.slug AS zoneSlug,
          p.${nameCol} AS name,
          p.${descCol} AS description,
          p.${fullDescCol} AS statusDescription,
          p.${locCol} AS location,
          p.${statusCol} AS status,
          z.${zoneNameCol} AS zoneName,
          p.image_url AS imageUrl,
          p.progress,
          p.map_embed_url AS mapEmbedUrl,
          p.is_featured AS isFeatured,
          p.last_updated_at AS lastUpdatedAt
        FROM projects p
        JOIN zones z ON z.id = p.zone_id
        WHERE p.slug = ?
      `,
      args: [slug],
    });

    project = (projectResult.rows[0] as Record<string, unknown> | undefined) ?? undefined;
  } catch {
    // Backward-compatible fallback for older schemas missing status_description_* columns.
    const projectFallbackResult = await db.execute({
      sql: `
        SELECT p.id, p.slug, p.zone_id AS zoneId, z.slug AS zoneSlug,
          p.${nameCol} AS name,
          p.${descCol} AS description,
          p.${descCol} AS statusDescription,
          p.${locCol} AS location,
          p.${statusCol} AS status,
          z.${zoneNameCol} AS zoneName,
          p.image_url AS imageUrl,
          p.progress,
          p.map_embed_url AS mapEmbedUrl,
          p.is_featured AS isFeatured,
          p.last_updated_at AS lastUpdatedAt
        FROM projects p
        JOIN zones z ON z.id = p.zone_id
        WHERE p.slug = ?
      `,
      args: [slug],
    });

    project = (projectFallbackResult.rows[0] as Record<string, unknown> | undefined) ?? undefined;
  }

  if (!project) {
    return c.json({ success: false, error: 'Project not found' }, 404);
  }

  const galleryResult = await db.execute({
    sql: `
      SELECT g.id, g.image_url AS imageUrl,
        g.${captionCol} AS caption,
        g.sort_order AS sortOrder,
        g.media_type AS mediaType
      FROM gallery_images g WHERE g.project_id = ?
      ORDER BY g.sort_order
    `,
    args: [project['id'] as string | number],
  });

  return c.json({ success: true, data: { ...project, gallery: galleryResult.rows } });
});

// ── Units ──

// GET /api/units
publicRoutes.get('/units', async c => {
  const lang = getLang(c.req.query('lang'));
  const db = getDb(c.env);
  await ensureUnitsTable(db);

  const typeCol = lang === 'en' ? 'unit_type_en' : 'unit_type_ar';
  const pNameCol = lang === 'en' ? 'name_en' : 'name_ar';

  const projectSlug = c.req.query('project');
  const zoneSlug = c.req.query('zone');
  const minPrice = c.req.query('minPrice');
  const maxPrice = c.req.query('maxPrice');
  const minArea = c.req.query('minArea');
  const maxArea = c.req.query('maxArea');
  const minRooms = c.req.query('minRooms');
  const status = c.req.query('status');

  let whereClause = '1=1';
  const args: (string | number)[] = [];

  if (projectSlug) {
    whereClause += ' AND p.slug = ?';
    args.push(projectSlug);
  }
  if (zoneSlug) {
    whereClause += ' AND z.slug = ?';
    args.push(zoneSlug);
  }
  if (minPrice) {
    whereClause += ' AND u.price >= ?';
    args.push(Number(minPrice));
  }
  if (maxPrice) {
    whereClause += ' AND u.price <= ?';
    args.push(Number(maxPrice));
  }
  if (minArea) {
    whereClause += ' AND u.area >= ?';
    args.push(Number(minArea));
  }
  if (maxArea) {
    whereClause += ' AND u.area <= ?';
    args.push(Number(maxArea));
  }
  if (minRooms) {
    whereClause += ' AND u.rooms >= ?';
    args.push(Number(minRooms));
  }
  if (status) {
    whereClause += ' AND u.status = ?';
    args.push(status);
  }

  const result = await db.execute({
    sql: `
      SELECT u.id, u.project_id AS projectId, p.slug AS projectSlug,
        p.${pNameCol} AS projectName, z.slug AS zoneSlug,
        u.unit_code AS unitCode,
        u.${typeCol} AS unitType,
        u.area, u.rooms, u.bathrooms, u.floor, u.price, u.status,
        u.delivery_year AS deliveryYear,
        u.unit_image_url AS unitImageUrl
      FROM units u
      JOIN projects p ON p.id = u.project_id
      JOIN zones z ON z.id = p.zone_id
      WHERE ${whereClause}
      ORDER BY u.price ASC
    `,
    args,
  });

  return c.json({ success: true, data: result.rows });
});

// GET /api/units/:id
publicRoutes.get('/units/:id', async c => {
  const lang = getLang(c.req.query('lang'));
  const db = getDb(c.env);
  await ensureUnitsTable(db);
  const id = c.req.param('id');

  const typeCol = lang === 'en' ? 'unit_type_en' : 'unit_type_ar';
  const pNameCol = lang === 'en' ? 'name_en' : 'name_ar';

  const result = await db.execute({
    sql: `
      SELECT u.id, u.project_id AS projectId, p.slug AS projectSlug,
        p.${pNameCol} AS projectName, z.slug AS zoneSlug,
        u.unit_code AS unitCode,
        u.${typeCol} AS unitType,
        u.area, u.rooms, u.bathrooms, u.floor, u.price, u.status,
        u.delivery_year AS deliveryYear,
        u.unit_image_url AS unitImageUrl
      FROM units u
      JOIN projects p ON p.id = u.project_id
      JOIN zones z ON z.id = p.zone_id
      WHERE u.id = ?
    `,
    args: [id],
  });

  const unit = result.rows[0];
  if (!unit) {
    return c.json({ success: false, error: 'Unit not found' }, 404);
  }
  return c.json({ success: true, data: unit });
});

// ── Gallery (public) ──

// GET /api/gallery
publicRoutes.get('/gallery', async c => {
  const lang = getLang(c.req.query('lang'));
  const db = getDb(c.env);
  const projectSlug = c.req.query('project');

  await ensureGalleryImageColumns(db);

  const captionCol = lang === 'en' ? 'caption_en' : 'caption_ar';
  const pNameCol = lang === 'en' ? 'name_en' : 'name_ar';

  const slugFilter = projectSlug ? 'AND p.slug = ?' : '';
  const args: string[] = projectSlug ? [projectSlug, projectSlug] : [];

  const result = await db.execute({
    sql: `
      SELECT p.id * 1000 AS id,
        p.image_url AS imageUrl,
        p.${pNameCol} AS caption,
        0 AS sortOrder,
        'image' AS mediaType,
        p.slug AS projectSlug,
        p.${pNameCol} AS projectName,
        'project' AS imageSource
      FROM projects p
      WHERE p.image_url != '' ${slugFilter}

      UNION ALL

      SELECT g.id, g.image_url AS imageUrl,
        g.${captionCol} AS caption,
        g.sort_order AS sortOrder,
        g.media_type AS mediaType,
        p.slug AS projectSlug,
        p.${pNameCol} AS projectName,
        'gallery' AS imageSource
      FROM gallery_images g
      JOIN projects p ON p.id = g.project_id
      WHERE 1=1 ${slugFilter}

      ORDER BY projectSlug, sortOrder
    `,
    args,
  });

  return c.json({ success: true, data: result.rows });
});

// ── Newsletter ──

// POST /api/newsletter
publicRoutes.post('/newsletter', async c => {
  const body = await c.req.json<{ email?: string }>();
  const email = body?.email;

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return c.json({ success: false, message: 'Invalid email' }, 400);
  }

  const db = getDb(c.env);
  const sanitized = email.trim().toLowerCase();

  const existing = await db.execute({
    sql: 'SELECT id FROM subscribers WHERE email = ?',
    args: [sanitized],
  });
  if (existing.rows.length > 0) {
    return c.json({ success: true, message: 'Already subscribed' });
  }

  await db.execute({ sql: 'INSERT INTO subscribers (email) VALUES (?)', args: [sanitized] });
  return c.json({ success: true, message: 'Subscribed successfully' });
});

// ── Contact ──

// POST /api/contact
publicRoutes.post('/contact', async c => {
  const body = await c.req.json<{ name?: string; phone?: string; message?: string }>();
  const { name, phone, message } = body ?? {};

  if (!name || !phone || !message) {
    return c.json({ success: false, message: 'All fields are required' }, 400);
  }

  const db = getDb(c.env);
  await db.execute({
    sql: 'INSERT INTO contacts (name, phone, message) VALUES (?, ?, ?)',
    args: [String(name).trim(), String(phone).trim(), String(message).trim()],
  });

  return c.json({ success: true, message: 'Message received' });
});

// ── Site Settings (public read) ──

publicRoutes.get('/settings', async c => {
  const db = getDb(c.env);
  await ensureSiteSettingsTable(db);

  const result = await db.execute('SELECT key, value FROM site_settings');
  const map = Object.fromEntries(result.rows.map(r => [r.key as string, r.value as string]));

  return c.json({
    success: true,
    data: {
      projectsCount: Number(map['projects_count'] ?? 21),
      unitsCount: Number(map['units_count'] ?? 300),
      clientsCount: Number(map['clients_count'] ?? 260),
      phone: map['phone'] ?? '+201153516871',
    },
  });
});
AHRAM_EOF_2
echo "  wrote: functions/lib/routes/public.ts"

mkdir -p "functions/lib/routes"
cat > "functions/lib/routes/admin.ts" << 'AHRAM_EOF_3'
import { Hono } from 'hono';
import type { Env } from '../../api/[[route]]';
import { ensureSiteSettingsTable, ensureUnitsTable, getDb } from '../db';
import { requireAuth } from '../middleware/auth';
import { requireRole } from '../middleware/auth';

export const adminRoutes = new Hono<{ Bindings: Env }>();

// All admin routes require auth + admin/editor role
adminRoutes.use('*', requireAuth, requireRole('admin', 'editor'));

// ── Dashboard ──

adminRoutes.get('/dashboard', async (c) => {
  const db = getDb(c.env);

  await ensureUnitsTable(db);

  const [projectCount, contactCount, unreadContacts, subscriberCount, zoneCount, galleryCount, unitCount] = await Promise.all([
    db.execute('SELECT COUNT(*) as count FROM projects'),
    db.execute('SELECT COUNT(*) as count FROM contacts'),
    db.execute('SELECT COUNT(*) as count FROM contacts WHERE is_read = 0'),
    db.execute('SELECT COUNT(*) as count FROM subscribers'),
    db.execute('SELECT COUNT(*) as count FROM zones'),
    db.execute('SELECT COUNT(*) as count FROM gallery_images'),
    db.execute('SELECT COUNT(*) as count FROM units'),
  ]);

  return c.json({
    success: true,
    data: {
      projectCount: projectCount.rows[0]?.count ?? 0,
      contactCount: contactCount.rows[0]?.count ?? 0,
      unreadContacts: unreadContacts.rows[0]?.count ?? 0,
      subscriberCount: subscriberCount.rows[0]?.count ?? 0,
      zoneCount: zoneCount.rows[0]?.count ?? 0,
      galleryCount: galleryCount.rows[0]?.count ?? 0,
      unitCount: unitCount.rows[0]?.count ?? 0,
    },
  });
});

// ── Projects CRUD ──

// GET /api/admin/projects
adminRoutes.get('/projects', async (c) => {
  const db = getDb(c.env);
  const page = Math.max(1, parseInt(c.req.query('page') || '1'));
  const limit = Math.min(100, Math.max(1, parseInt(c.req.query('limit') || '25')));
  const offset = (page - 1) * limit;

  const totalResult = await db.execute('SELECT COUNT(*) as count FROM projects');
  const total = (totalResult.rows[0]?.count as number) ?? 0;

  const result = await db.execute({
    sql: `
      SELECT p.id, p.slug, p.zone_id AS zoneId, z.slug AS zoneSlug,
        p.name_ar AS nameAr, p.name_en AS nameEn,
        p.description_ar AS descriptionAr, p.description_en AS descriptionEn,
        p.location_ar AS locationAr, p.location_en AS locationEn,
        p.status_ar AS statusAr, p.status_en AS statusEn,
        p.image_url AS imageUrl, p.progress,
        p.is_featured AS isFeatured, p.sort_order AS sortOrder,
        p.last_updated_at AS lastUpdatedAt, p.created_at AS createdAt,
        z.name_ar AS zoneNameAr, z.name_en AS zoneNameEn
      FROM projects p
      JOIN zones z ON z.id = p.zone_id
      ORDER BY p.sort_order
      LIMIT ? OFFSET ?
    `,
    args: [limit, offset],
  });

  return c.json({
    success: true,
    data: result.rows,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  });
});

// GET /api/admin/projects/:id
adminRoutes.get('/projects/:id', async (c) => {
  const db = getDb(c.env);
  const id = c.req.param('id');

  const projectResult = await db.execute({
    sql: `
      SELECT p.*, z.slug AS zoneSlug, z.name_ar AS zoneNameAr, z.name_en AS zoneNameEn
      FROM projects p
      JOIN zones z ON z.id = p.zone_id
      WHERE p.id = ?
    `,
    args: [id],
  });

  const project = projectResult.rows[0];
  if (!project) {
    return c.json({ success: false, error: 'Project not found' }, 404);
  }

  const galleryResult = await db.execute({
    sql: 'SELECT * FROM gallery_images WHERE project_id = ? ORDER BY sort_order',
    args: [id],
  });

  return c.json({ success: true, data: { ...project, gallery: galleryResult.rows } });
});

// POST /api/admin/projects
adminRoutes.post('/projects', async (c) => {
  const body = await c.req.json();
  const {
    slug, zoneId, nameAr, nameEn, descriptionAr, descriptionEn,
    statusDescriptionAr, statusDescriptionEn, locationAr, locationEn,
    statusAr, statusEn, imageUrl, progress, mapEmbedUrl,
    isFeatured, sortOrder, lastUpdatedAt,
  } = body;

  if (!slug || !zoneId || !nameAr || !nameEn) {
    return c.json({ success: false, error: 'slug, zoneId, nameAr, and nameEn are required' }, 400);
  }

  try {
    const db = getDb(c.env);
    const result = await db.execute({
      sql: `
        INSERT INTO projects (slug, zone_id, name_ar, name_en, description_ar, description_en,
          status_description_ar, status_description_en, location_ar, location_en,
          status_ar, status_en, image_url, progress, map_embed_url,
          is_featured, sort_order, last_updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        slug, zoneId, nameAr, nameEn,
        descriptionAr || '', descriptionEn || '',
        statusDescriptionAr || '', statusDescriptionEn || '',
        locationAr || '', locationEn || '',
        statusAr || '', statusEn || '',
        imageUrl || '', progress || 0, mapEmbedUrl || '',
        isFeatured ? 1 : 0, sortOrder || 0,
        lastUpdatedAt || new Date().toISOString().split('T')[0],
      ],
    });

    return c.json({ success: true, data: { id: Number(result.lastInsertRowid) } }, 201);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    if (message.includes('UNIQUE')) {
      return c.json({ success: false, error: 'A project with this slug already exists' }, 409);
    }
    return c.json({ success: false, error: message }, 500);
  }
});

// PUT /api/admin/projects/:id
adminRoutes.put('/projects/:id', async (c) => {
  const db = getDb(c.env);
  const id = c.req.param('id');

  const existing = await db.execute({ sql: 'SELECT id FROM projects WHERE id = ?', args: [id] });
  if (existing.rows.length === 0) {
    return c.json({ success: false, error: 'Project not found' }, 404);
  }

  const body = await c.req.json();
  const {
    slug, zoneId, nameAr, nameEn, descriptionAr, descriptionEn,
    statusDescriptionAr, statusDescriptionEn, locationAr, locationEn,
    statusAr, statusEn, imageUrl, progress, mapEmbedUrl,
    isFeatured, sortOrder, lastUpdatedAt,
  } = body;

  try {
    await db.execute({
      sql: `
        UPDATE projects SET
          slug = COALESCE(?, slug), zone_id = COALESCE(?, zone_id),
          name_ar = COALESCE(?, name_ar), name_en = COALESCE(?, name_en),
          description_ar = COALESCE(?, description_ar), description_en = COALESCE(?, description_en),
          status_description_ar = COALESCE(?, status_description_ar), status_description_en = COALESCE(?, status_description_en),
          location_ar = COALESCE(?, location_ar), location_en = COALESCE(?, location_en),
          status_ar = COALESCE(?, status_ar), status_en = COALESCE(?, status_en),
          image_url = COALESCE(?, image_url), progress = COALESCE(?, progress),
          map_embed_url = COALESCE(?, map_embed_url),
          is_featured = COALESCE(?, is_featured), sort_order = COALESCE(?, sort_order),
          last_updated_at = COALESCE(?, last_updated_at)
        WHERE id = ?
      `,
      args: [
        slug ?? null, zoneId ?? null, nameAr ?? null, nameEn ?? null,
        descriptionAr ?? null, descriptionEn ?? null,
        statusDescriptionAr ?? null, statusDescriptionEn ?? null,
        locationAr ?? null, locationEn ?? null,
        statusAr ?? null, statusEn ?? null,
        imageUrl ?? null, progress ?? null, mapEmbedUrl ?? null,
        isFeatured !== undefined ? (isFeatured ? 1 : 0) : null,
        sortOrder ?? null, lastUpdatedAt ?? null,
        id,
      ],
    });

    return c.json({ success: true, data: { id } });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return c.json({ success: false, error: message }, 500);
  }
});

// DELETE /api/admin/projects/:id
adminRoutes.delete('/projects/:id', async (c) => {
  const db = getDb(c.env);
  const id = c.req.param('id');

  const result = await db.execute({ sql: 'DELETE FROM projects WHERE id = ?', args: [id] });
  if (result.rowsAffected === 0) {
    return c.json({ success: false, error: 'Project not found' }, 404);
  }
  return c.json({ success: true, data: null });
});

// POST /api/admin/projects/:id/image — upload hero image to R2
adminRoutes.post('/projects/:id/image', async (c) => {
  const db = getDb(c.env);
  const id = c.req.param('id');

  const projectResult = await db.execute({
    sql: 'SELECT id, image_url FROM projects WHERE id = ?',
    args: [id],
  });
  const project = projectResult.rows[0];
  if (!project) {
    return c.json({ success: false, error: 'Project not found' }, 404);
  }

  const formData = await c.req.parseBody();
  const file = formData['image'];
  if (!(file instanceof File)) {
    return c.json({ success: false, error: 'No image file provided' }, 400);
  }

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowedTypes.includes(file.type)) {
    return c.json({ success: false, error: 'Invalid file type. Allowed: jpg, png, webp, gif' }, 400);
  }

  // Validate file size (10MB)
  if (file.size > 10 * 1024 * 1024) {
    return c.json({ success: false, error: 'File too large. Max 10MB' }, 400);
  }

  const ext = file.name.split('.').pop() || 'jpg';
  const key = `projects/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  await c.env.UPLOADS.put(key, file.stream(), {
    httpMetadata: { contentType: file.type },
  });

  const imageUrl = `uploads/${key}`;
  await db.execute({ sql: 'UPDATE projects SET image_url = ? WHERE id = ?', args: [imageUrl, id] });

  return c.json({ success: true, data: { imageUrl } });
});

// ── Zones CRUD ──

// GET /api/admin/zones
adminRoutes.get('/zones', async (c) => {
  const db = getDb(c.env);
  const result = await db.execute(`
    SELECT z.id, z.slug, z.name_ar AS nameAr, z.name_en AS nameEn,
      z.description_ar AS descriptionAr, z.description_en AS descriptionEn,
      z.image_url AS imageUrl, z.sort_order AS sortOrder,
      (SELECT COUNT(*) FROM projects p WHERE p.zone_id = z.id) AS projectCount
    FROM zones z ORDER BY z.sort_order
  `);
  return c.json({ success: true, data: result.rows });
});

// GET /api/admin/zones/:id
adminRoutes.get('/zones/:id', async (c) => {
  const db = getDb(c.env);
  const id = c.req.param('id');

  const result = await db.execute({
    sql: `
      SELECT z.id, z.slug, z.name_ar AS nameAr, z.name_en AS nameEn,
        z.description_ar AS descriptionAr, z.description_en AS descriptionEn,
        z.image_url AS imageUrl, z.sort_order AS sortOrder
      FROM zones z WHERE z.id = ?
    `,
    args: [id],
  });

  const zone = result.rows[0];
  if (!zone) {
    return c.json({ success: false, error: 'Zone not found' }, 404);
  }
  return c.json({ success: true, data: zone });
});

// POST /api/admin/zones
adminRoutes.post('/zones', async (c) => {
  const body = await c.req.json();
  const { slug, nameAr, nameEn, descriptionAr, descriptionEn, sortOrder } = body;

  if (!slug || !nameAr || !nameEn) {
    return c.json({ success: false, error: 'slug, nameAr, and nameEn are required' }, 400);
  }

  try {
    const db = getDb(c.env);
    const result = await db.execute({
      sql: `INSERT INTO zones (slug, name_ar, name_en, description_ar, description_en, sort_order)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [slug, nameAr, nameEn, descriptionAr || '', descriptionEn || '', sortOrder || 0],
    });
    return c.json({ success: true, data: { id: Number(result.lastInsertRowid) } }, 201);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    if (message.includes('UNIQUE')) {
      return c.json({ success: false, error: 'A zone with this slug already exists' }, 409);
    }
    return c.json({ success: false, error: message }, 500);
  }
});

// PUT /api/admin/zones/:id
adminRoutes.put('/zones/:id', async (c) => {
  const db = getDb(c.env);
  const id = c.req.param('id');

  const existing = await db.execute({ sql: 'SELECT id FROM zones WHERE id = ?', args: [id] });
  if (existing.rows.length === 0) {
    return c.json({ success: false, error: 'Zone not found' }, 404);
  }

  const body = await c.req.json();
  const { slug, nameAr, nameEn, descriptionAr, descriptionEn, sortOrder } = body;

  try {
    await db.execute({
      sql: `UPDATE zones SET
              slug = COALESCE(?, slug), name_ar = COALESCE(?, name_ar), name_en = COALESCE(?, name_en),
              description_ar = COALESCE(?, description_ar), description_en = COALESCE(?, description_en),
              sort_order = COALESCE(?, sort_order)
            WHERE id = ?`,
      args: [slug ?? null, nameAr ?? null, nameEn ?? null, descriptionAr ?? null, descriptionEn ?? null, sortOrder ?? null, id],
    });
    return c.json({ success: true, data: { id } });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return c.json({ success: false, error: message }, 500);
  }
});

// DELETE /api/admin/zones/:id
adminRoutes.delete('/zones/:id', async (c) => {
  const db = getDb(c.env);
  const id = c.req.param('id');

  const result = await db.execute({ sql: 'DELETE FROM zones WHERE id = ?', args: [id] });
  if (result.rowsAffected === 0) {
    return c.json({ success: false, error: 'Zone not found' }, 404);
  }
  return c.json({ success: true, data: null });
});

// POST /api/admin/zones/:id/image — upload zone image to R2
adminRoutes.post('/zones/:id/image', async (c) => {
  const db = getDb(c.env);
  const id = c.req.param('id');

  const zoneResult = await db.execute({ sql: 'SELECT id FROM zones WHERE id = ?', args: [id] });
  if (zoneResult.rows.length === 0) {
    return c.json({ success: false, error: 'Zone not found' }, 404);
  }

  const formData = await c.req.parseBody();
  const file = formData['image'];
  if (!(file instanceof File)) {
    return c.json({ success: false, error: 'No image file provided' }, 400);
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowedTypes.includes(file.type)) {
    return c.json({ success: false, error: 'Invalid file type. Allowed: jpg, png, webp, gif' }, 400);
  }

  if (file.size > 10 * 1024 * 1024) {
    return c.json({ success: false, error: 'File too large. Max 10MB' }, 400);
  }

  const ext = file.name.split('.').pop() || 'jpg';
  const key = `zones/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  await c.env.UPLOADS.put(key, file.stream(), {
    httpMetadata: { contentType: file.type },
  });

  const imageUrl = `uploads/${key}`;
  await db.execute({ sql: 'UPDATE zones SET image_url = ? WHERE id = ?', args: [imageUrl, id] });

  return c.json({ success: true, data: { imageUrl } });
});

// ── Units CRUD ──

// GET /api/admin/units
adminRoutes.get('/units', async (c) => {
  const db = getDb(c.env);
  await ensureUnitsTable(db);

  const page = Math.max(1, parseInt(c.req.query('page') || '1'));
  const limit = Math.min(100, Math.max(1, parseInt(c.req.query('limit') || '25')));
  const offset = (page - 1) * limit;
  const projectId = c.req.query('projectId');
  const status = c.req.query('status');

  let whereClause = '1=1';
  const args: (string | number)[] = [];

  if (projectId) {
    whereClause += ' AND u.project_id = ?';
    args.push(projectId);
  }
  if (status) {
    whereClause += ' AND u.status = ?';
    args.push(status);
  }

  const totalResult = await db.execute({
    sql: `SELECT COUNT(*) as count FROM units u WHERE ${whereClause}`,
    args,
  });
  const total = (totalResult.rows[0]?.count as number) ?? 0;

  const result = await db.execute({
    sql: `
      SELECT u.id, u.project_id AS projectId, p.slug AS projectSlug,
        p.name_ar AS projectNameAr, p.name_en AS projectNameEn,
        u.unit_code AS unitCode,
        u.unit_type_ar AS unitTypeAr, u.unit_type_en AS unitTypeEn,
        u.area, u.rooms, u.bathrooms, u.floor, u.price, u.status,
        u.delivery_year AS deliveryYear,
        u.unit_image_url AS unitImageUrl,
        u.created_at AS createdAt, u.updated_at AS updatedAt
      FROM units u
      JOIN projects p ON p.id = u.project_id
      WHERE ${whereClause}
      ORDER BY u.created_at DESC
      LIMIT ? OFFSET ?
    `,
    args: [...args, limit, offset],
  });

  return c.json({
    success: true,
    data: result.rows,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  });
});

// GET /api/admin/units/:id
adminRoutes.get('/units/:id', async (c) => {
  const db = getDb(c.env);
  await ensureUnitsTable(db);
  const id = c.req.param('id');

  const result = await db.execute({
    sql: `
      SELECT u.*, p.slug AS projectSlug, p.name_ar AS projectNameAr, p.name_en AS projectNameEn
      FROM units u
      JOIN projects p ON p.id = u.project_id
      WHERE u.id = ?
    `,
    args: [id],
  });

  const unit = result.rows[0];
  if (!unit) {
    return c.json({ success: false, error: 'Unit not found' }, 404);
  }
  return c.json({ success: true, data: unit });
});

// POST /api/admin/units
adminRoutes.post('/units', async (c) => {
  const db = getDb(c.env);
  await ensureUnitsTable(db);

  const body = await c.req.json();
  const {
    projectId, unitCode, unitTypeAr, unitTypeEn, area, rooms,
    bathrooms, floor, price, status, deliveryYear, unitImageUrl,
  } = body;

  if (!projectId || !unitCode || !area || !price) {
    return c.json({ success: false, error: 'projectId, unitCode, area, and price are required' }, 400);
  }

  try {
    const result = await db.execute({
      sql: `
        INSERT INTO units (project_id, unit_code, unit_type_ar, unit_type_en, area, rooms,
          bathrooms, floor, price, status, delivery_year, unit_image_url)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        projectId, unitCode,
        unitTypeAr || '', unitTypeEn || '',
        area, rooms || 0, bathrooms || 0,
        floor ?? null, price, status || 'available',
        deliveryYear ?? null, unitImageUrl || '',
      ],
    });

    return c.json({ success: true, data: { id: Number(result.lastInsertRowid) } }, 201);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    if (message.includes('UNIQUE')) {
      return c.json({ success: false, error: 'This project already has a unit with that code' }, 409);
    }
    return c.json({ success: false, error: message }, 500);
  }
});

// PUT /api/admin/units/:id
adminRoutes.put('/units/:id', async (c) => {
  const db = getDb(c.env);
  await ensureUnitsTable(db);
  const id = c.req.param('id');

  const existing = await db.execute({ sql: 'SELECT id FROM units WHERE id = ?', args: [id] });
  if (existing.rows.length === 0) {
    return c.json({ success: false, error: 'Unit not found' }, 404);
  }

  const body = await c.req.json();
  const {
    projectId, unitCode, unitTypeAr, unitTypeEn, area, rooms,
    bathrooms, floor, price, status, deliveryYear, unitImageUrl,
  } = body;

  try {
    await db.execute({
      sql: `
        UPDATE units SET
          project_id = COALESCE(?, project_id), unit_code = COALESCE(?, unit_code),
          unit_type_ar = COALESCE(?, unit_type_ar), unit_type_en = COALESCE(?, unit_type_en),
          area = COALESCE(?, area), rooms = COALESCE(?, rooms),
          bathrooms = COALESCE(?, bathrooms), floor = COALESCE(?, floor),
          price = COALESCE(?, price), status = COALESCE(?, status),
          delivery_year = COALESCE(?, delivery_year), unit_image_url = COALESCE(?, unit_image_url),
          updated_at = datetime('now')
        WHERE id = ?
      `,
      args: [
        projectId ?? null, unitCode ?? null,
        unitTypeAr ?? null, unitTypeEn ?? null,
        area ?? null, rooms ?? null, bathrooms ?? null, floor ?? null,
        price ?? null, status ?? null, deliveryYear ?? null, unitImageUrl ?? null,
        id,
      ],
    });

    return c.json({ success: true, data: { id } });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    if (message.includes('UNIQUE')) {
      return c.json({ success: false, error: 'This project already has a unit with that code' }, 409);
    }
    return c.json({ success: false, error: message }, 500);
  }
});

// DELETE /api/admin/units/:id
adminRoutes.delete('/units/:id', async (c) => {
  const db = getDb(c.env);
  await ensureUnitsTable(db);
  const id = c.req.param('id');

  const result = await db.execute({ sql: 'DELETE FROM units WHERE id = ?', args: [id] });
  if (result.rowsAffected === 0) {
    return c.json({ success: false, error: 'Unit not found' }, 404);
  }
  return c.json({ success: true, data: null });
});

// ── Gallery CRUD ──

// GET /api/admin/gallery
adminRoutes.get('/gallery', async (c) => {
  const db = getDb(c.env);
  const projectId = c.req.query('projectId');

  let whereClause = '1=1';
  const args: (string | number)[] = [];

  if (projectId) {
    whereClause += ' AND g.project_id = ?';
    args.push(projectId);
  }

  const result = await db.execute({
    sql: `
      SELECT g.id, g.project_id AS projectId, g.image_url AS imageUrl,
        g.caption_ar AS captionAr, g.caption_en AS captionEn,
        g.sort_order AS sortOrder, g.media_type AS mediaType, g.created_at AS createdAt,
        p.name_ar AS projectNameAr, p.name_en AS projectNameEn, p.slug AS projectSlug
      FROM gallery_images g
      JOIN projects p ON p.id = g.project_id
      WHERE ${whereClause}
      ORDER BY g.project_id, g.sort_order
    `,
    args,
  });

  return c.json({ success: true, data: result.rows });
});

// POST /api/admin/gallery — upload gallery image/video to R2
adminRoutes.post('/gallery', async (c) => {
  const formData = await c.req.parseBody();
  const file = formData['image'];

  if (!(file instanceof File)) {
    return c.json({ success: false, error: 'No file provided' }, 400);
  }

  const projectId = formData['projectId'] as string;
  const captionAr = (formData['captionAr'] as string) || '';
  const captionEn = (formData['captionEn'] as string) || '';
  const sortOrder = parseInt((formData['sortOrder'] as string) || '0');

  if (!projectId) {
    return c.json({ success: false, error: 'projectId is required' }, 400);
  }

  // Validate file type
  const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
  const allowedTypes = [...allowedImageTypes, ...allowedVideoTypes];
  if (!allowedTypes.includes(file.type)) {
    return c.json({ success: false, error: 'Invalid file type. Allowed: jpg, png, webp, gif, mp4, webm, mov' }, 400);
  }

  const isVideo = file.type.startsWith('video/');
  const maxSize = isVideo ? 100 * 1024 * 1024 : 10 * 1024 * 1024;
  if (file.size > maxSize) {
    return c.json({ success: false, error: `File too large. Max ${isVideo ? '100MB' : '10MB'}` }, 400);
  }

  const mediaType = isVideo ? 'video' : 'image';
  const ext = file.name.split('.').pop() || (isVideo ? 'mp4' : 'jpg');
  const key = `gallery/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  await c.env.UPLOADS.put(key, file.stream(), {
    httpMetadata: { contentType: file.type },
  });

  const imageUrl = `uploads/${key}`;
  const db = getDb(c.env);

  const result = await db.execute({
    sql: 'INSERT INTO gallery_images (project_id, image_url, caption_ar, caption_en, sort_order, media_type) VALUES (?, ?, ?, ?, ?, ?)',
    args: [projectId, imageUrl, captionAr, captionEn, sortOrder, mediaType],
  });

  return c.json({ success: true, data: { id: Number(result.lastInsertRowid), imageUrl, mediaType } }, 201);
});

// PUT /api/admin/gallery/:id
adminRoutes.put('/gallery/:id', async (c) => {
  const db = getDb(c.env);
  const id = c.req.param('id');
  const body = await c.req.json();
  const { captionAr, captionEn, sortOrder } = body;

  const result = await db.execute({
    sql: `
      UPDATE gallery_images SET
        caption_ar = COALESCE(?, caption_ar),
        caption_en = COALESCE(?, caption_en),
        sort_order = COALESCE(?, sort_order)
      WHERE id = ?
    `,
    args: [captionAr ?? null, captionEn ?? null, sortOrder ?? null, id],
  });

  if (result.rowsAffected === 0) {
    return c.json({ success: false, error: 'Gallery image not found' }, 404);
  }
  return c.json({ success: true, data: { id } });
});

// DELETE /api/admin/gallery/:id
adminRoutes.delete('/gallery/:id', async (c) => {
  const db = getDb(c.env);
  const id = c.req.param('id');

  const imageResult = await db.execute({
    sql: 'SELECT image_url FROM gallery_images WHERE id = ?',
    args: [id],
  });

  const image = imageResult.rows[0] as { image_url: string } | undefined;
  if (!image) {
    return c.json({ success: false, error: 'Gallery image not found' }, 404);
  }

  await db.execute({ sql: 'DELETE FROM gallery_images WHERE id = ?', args: [id] });

  // Delete from R2 if it's an uploaded file
  if (image.image_url.startsWith('uploads/')) {
    const r2Key = image.image_url.replace(/^uploads\//, '');
    try {
      await c.env.UPLOADS.delete(r2Key);
    } catch {
      // File may not exist in R2
    }
  }

  return c.json({ success: true, data: null });
});

// ── Contacts ──

// GET /api/admin/contacts
adminRoutes.get('/contacts', async (c) => {
  const db = getDb(c.env);
  const page = Math.max(1, parseInt(c.req.query('page') || '1'));
  const limit = Math.min(100, Math.max(1, parseInt(c.req.query('limit') || '25')));
  const offset = (page - 1) * limit;

  const totalResult = await db.execute('SELECT COUNT(*) as count FROM contacts');
  const total = (totalResult.rows[0]?.count as number) ?? 0;

  const result = await db.execute({
    sql: `
      SELECT id, name, phone, message, is_read AS isRead, submitted_at AS submittedAt
      FROM contacts
      ORDER BY submitted_at DESC
      LIMIT ? OFFSET ?
    `,
    args: [limit, offset],
  });

  return c.json({
    success: true,
    data: result.rows,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  });
});

// PUT /api/admin/contacts/:id/read
adminRoutes.put('/contacts/:id/read', async (c) => {
  const db = getDb(c.env);
  const id = c.req.param('id');

  const result = await db.execute({ sql: 'UPDATE contacts SET is_read = 1 WHERE id = ?', args: [id] });
  if (result.rowsAffected === 0) {
    return c.json({ success: false, error: 'Contact not found' }, 404);
  }
  return c.json({ success: true, data: null });
});

// DELETE /api/admin/contacts/:id
adminRoutes.delete('/contacts/:id', async (c) => {
  const db = getDb(c.env);
  const id = c.req.param('id');

  const result = await db.execute({ sql: 'DELETE FROM contacts WHERE id = ?', args: [id] });
  if (result.rowsAffected === 0) {
    return c.json({ success: false, error: 'Contact not found' }, 404);
  }
  return c.json({ success: true, data: null });
});

// ── Site Settings ──

// GET /api/admin/settings
adminRoutes.get('/settings', async (c) => {
  const db = getDb(c.env);
  await ensureSiteSettingsTable(db);

  const result = await db.execute('SELECT key, value FROM site_settings');
  const map = Object.fromEntries(result.rows.map(r => [r.key as string, r.value as string]));

  return c.json({
    success: true,
    data: {
      projectsCount: Number(map['projects_count'] ?? 21),
      unitsCount: Number(map['units_count'] ?? 300),
      clientsCount: Number(map['clients_count'] ?? 260),
      phone: map['phone'] ?? '+201153516871',
    },
  });
});

// PUT /api/admin/settings
adminRoutes.put('/settings', async (c) => {
  const body = await c.req.json() as Record<string, unknown>;
  const db = getDb(c.env);
  await ensureSiteSettingsTable(db);

  const numericFields: Record<string, string> = {
    projectsCount: 'projects_count',
    unitsCount: 'units_count',
    clientsCount: 'clients_count',
  };

  for (const [field, col] of Object.entries(numericFields)) {
    if (field in body) {
      const val = Number(body[field]);
      if (!Number.isFinite(val) || val < 0) {
        return c.json({ success: false, error: `${field} must be a non-negative number` }, 400);
      }
      await db.execute({
        sql: 'INSERT OR REPLACE INTO site_settings (key, value) VALUES (?, ?)',
        args: [col, String(Math.floor(val))],
      });
    }
  }

  if ('phone' in body) {
    const phone = String(body['phone']).trim();
    if (!/^\+\d{7,15}$/.test(phone)) {
      return c.json({ success: false, error: 'phone must be in E.164 format (e.g. +201153516871)' }, 400);
    }
    await db.execute({
      sql: 'INSERT OR REPLACE INTO site_settings (key, value) VALUES (?, ?)',
      args: ['phone', phone],
    });
  }

  return c.json({ success: true, data: null });
});

// ── Subscribers ──

// GET /api/admin/subscribers
adminRoutes.get('/subscribers', async (c) => {
  const db = getDb(c.env);
  const result = await db.execute(
    'SELECT id, email, subscribed_at AS subscribedAt FROM subscribers ORDER BY subscribed_at DESC',
  );
  return c.json({ success: true, data: result.rows });
});
AHRAM_EOF_3
echo "  wrote: functions/lib/routes/admin.ts"

mkdir -p "functions/lib/routes"
cat > "functions/lib/routes/chat.ts" << 'AHRAM_EOF_4'
import { Hono } from 'hono';
import type { Env } from '../../api/[[route]]';
import { ensureUnitsTable, getDb } from '../db';

export const chatRoutes = new Hono<{ Bindings: Env }>();

const MAX_MESSAGES = 12;
const MAX_MESSAGE_LENGTH = 800;
const MODEL = 'claude-haiku-4-5-20251001';

type Lang = 'ar' | 'en';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

async function buildSystemPrompt(env: Env, lang: Lang): Promise<string> {
  const db = getDb(env);
  await ensureUnitsTable(db);

  const [unitStats, projectCount, zoneCount] = await Promise.all([
    db.execute(`
      SELECT COUNT(*) as count, MIN(price) as minPrice, MAX(price) as maxPrice,
        MIN(area) as minArea, MAX(area) as maxArea
      FROM units WHERE status = 'available'
    `),
    db.execute('SELECT COUNT(*) as count FROM projects'),
    db.execute('SELECT COUNT(*) as count FROM zones'),
  ]);

  const stats = unitStats.rows[0] ?? {};
  const projects = projectCount.rows[0]?.count ?? 0;
  const zones = zoneCount.rows[0]?.count ?? 0;

  if (lang === 'en') {
    return [
      'You are a helpful assistant for "Al-Ahram Developments", a real estate developer in Sadat City, Egypt.',
      'Answer briefly and helpfully in English (2-4 sentences unless more detail is clearly needed).',
      '',
      'Facts you can share:',
      `- ${projects} residential projects across ${zones} zones in Sadat City`,
      `- ${stats.count ?? 0} units currently available, priced from ${stats.minPrice ?? 'n/a'} to ${stats.maxPrice ?? 'n/a'} EGP, areas from ${stats.minArea ?? 'n/a'} to ${stats.maxArea ?? 'n/a'} sqm`,
      '- Installment plans exist, but the exact down payment %, term, and interest rate depend on the unit and current offers — point the user to the installment calculator on the site or to the sales team for exact numbers',
      '- If asked about something outside real estate or this company, politely redirect the conversation back to how you can help',
      '',
      "Never invent specific unit codes, exact prices, delivery dates, or contract terms you don't have data for.",
    ].join('\n');
  }

  return [
    'أنتِ مساعدة ذكية لشركة "الأهرام للتطوير العقاري" في مدينة السادات، مصر.',
    'ردي بإيجاز وبالعربية المصرية البسيطة (جملتين لأربع جمل، إلا لو محتاجة تفصيل أكتر).',
    '',
    'معلومات يمكنك مشاركتها:',
    `- ${projects} مشروع سكني موزعين على ${zones} منطقة في مدينة السادات`,
    `- ${stats.count ?? 0} وحدة متاحة حاليًا، الأسعار من ${stats.minPrice ?? 'غير متاح'} إلى ${stats.maxPrice ?? 'غير متاح'} جنيه، والمساحات من ${stats.minArea ?? 'غير متاح'} إلى ${stats.maxArea ?? 'غير متاح'} متر`,
    '- في خطط تقسيط متاحة، لكن نسبة المقدم والمدة والفوائد بتختلف حسب الوحدة والعروض الحالية — وجّهي العميل لحاسبة التقسيط على الموقع أو لفريق المبيعات عشان الأرقام الدقيقة',
    '- لو حد سأل حاجة برا نطاق العقارات أو الشركة، ردي بلطف ووجّهي الكلام تاني لموضوع تقدري تساعدي فيه',
    '',
    'متخترعيش أكواد وحدات أو أسعار محددة أو مواعيد تسليم أو شروط تعاقدية مش متأكدة منها.',
  ].join('\n');
}

// POST /api/chat
chatRoutes.post('/', async (c) => {
  const env = c.env;
  if (!env.ANTHROPIC_API_KEY) {
    return c.json({ success: false, error: 'Chat is not configured yet' }, 503);
  }

  const body = await c.req.json().catch(() => null);
  const messages: ChatMessage[] = Array.isArray(body?.messages) ? body.messages : [];
  const lang: Lang = body?.lang === 'en' ? 'en' : 'ar';

  if (messages.length === 0 || messages.length > MAX_MESSAGES) {
    return c.json({ success: false, error: 'Invalid message history' }, 400);
  }
  for (const m of messages) {
    if (typeof m.content !== 'string' || m.content.length === 0 || m.content.length > MAX_MESSAGE_LENGTH) {
      return c.json({ success: false, error: 'Invalid message content' }, 400);
    }
    if (m.role !== 'user' && m.role !== 'assistant') {
      return c.json({ success: false, error: 'Invalid message role' }, 400);
    }
  }

  try {
    const systemPrompt = await buildSystemPrompt(env, lang);

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 500,
        system: systemPrompt,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('Anthropic API error:', res.status, errText);
      return c.json({ success: false, error: 'Chat service unavailable' }, 502);
    }

    const data = (await res.json()) as { content?: Array<{ type: string; text?: string }> };
    const reply =
      data.content?.find((block) => block.type === 'text')?.text ??
      (lang === 'en' ? 'Sorry, I could not process that.' : 'معلش، حصلت مشكلة في الرد، جربي تاني.');

    return c.json({ success: true, data: { reply } });
  } catch (err) {
    console.error('Chat route error:', err);
    return c.json({ success: false, error: 'Chat service unavailable' }, 500);
  }
});
AHRAM_EOF_4
echo "  wrote: functions/lib/routes/chat.ts"

mkdir -p "functions/api"
cat > "functions/api/[[route]].ts" << 'AHRAM_EOF_5'
import { Hono } from 'hono';
import { handle } from 'hono/cloudflare-pages';
import { publicRoutes } from '../lib/routes/public';
import { authRoutes } from '../lib/routes/auth';
import { adminRoutes } from '../lib/routes/admin';
import { chatRoutes } from '../lib/routes/chat';

export interface Env {
  TURSO_URL: string;
  TURSO_AUTH_TOKEN: string;
  JWT_SECRET: string;
  UPLOADS: R2Bucket;
  // Secret — set with: wrangler secret put ANTHROPIC_API_KEY
  ANTHROPIC_API_KEY: string;
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
app.route('/chat', chatRoutes);

// 404 fallback
app.all('*', (c) => {
  return c.json({ success: false, error: 'Not found' }, 404);
});

export const onRequest = handle(app);
AHRAM_EOF_5
echo "  wrote: functions/api/[[route]].ts"

cat > "wrangler.toml" << 'AHRAM_EOF_6'
name = "alahram-developments"
compatibility_date = "2024-12-01"
pages_build_output_dir = "dist/alahram-developments/browser"

# KV namespace binding for form submissions (legacy — kept for reference)
[[kv_namespaces]]
binding = "FORM_DATA"
id = "ce2100045c6744d7bb723de0cd11ad40"

# R2 bucket for admin-uploaded images
[[r2_buckets]]
binding = "UPLOADS"
bucket_name = "alahram-uploads"

# NOTE: the AI chat assistant needs an Anthropic API key set as a secret
# (not committed here). Run once:
#   wrangler pages secret put ANTHROPIC_API_KEY

AHRAM_EOF_6
echo "  wrote: wrangler.toml"

mkdir -p "scripts"
cat > "scripts/seed-turso.ts" << 'AHRAM_EOF_7'
/**
 * Turso seed script: populates remote Turso DB with same data as local seed.
 * Run: TURSO_URL=libsql://... TURSO_AUTH_TOKEN=... npx tsx scripts/seed-turso.ts
 */
import { createClient } from '@libsql/client';
import { pbkdf2Sync, randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// ── PBKDF2 password hashing (matches functions/lib/crypto.ts) ──

const ITERATIONS = 100_000;
const KEY_LENGTH = 32;
const HASH_ALGO = 'sha256';

function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, HASH_ALGO);
  return `${salt.toString('hex')}$${hash.toString('hex')}`;
}

// ── Setup DB ──

const url = process.env['TURSO_URL'];
const authToken = process.env['TURSO_AUTH_TOKEN'];

if (!url || !authToken) {
  console.error('Missing TURSO_URL or TURSO_AUTH_TOKEN environment variables.');
  console.error('Usage: TURSO_URL=libsql://... TURSO_AUTH_TOKEN=... npx tsx scripts/seed-turso.ts');
  process.exit(1);
}

const db = createClient({ url, authToken });

// ── Load translations ──

const arPath = join(process.cwd(), 'src/assets/i18n/ar.json');
const enPath = join(process.cwd(), 'src/assets/i18n/en.json');
const ar = JSON.parse(readFileSync(arPath, 'utf-8'));
const en = JSON.parse(readFileSync(enPath, 'utf-8'));

function getTranslation(obj: Record<string, unknown>, path: string): string {
  const parts = path.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in (current as Record<string, unknown>)) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return '';
    }
  }
  return typeof current === 'string' ? current : '';
}

// ── Schema ──

const schemaPath = join(process.cwd(), 'src/server/schema.sql');
const schema = readFileSync(schemaPath, 'utf-8');

// ── Zone data ──

const ZONES = [
  {
    slug: 'zone-7-strip',
    nameKey: 'zones.zone7Strip.name',
    descKey: 'zones.zone7Strip.description',
    imageUrl: 'assets/images/projects/zone-7-strip.jpg',
    sortOrder: 1,
  },
  {
    slug: 'zone-7-homeland',
    nameKey: 'zones.zone7Homeland.name',
    descKey: 'zones.zone7Homeland.description',
    imageUrl: 'assets/images/projects/zone-7-homeland.jpg',
    sortOrder: 2,
  },
  {
    slug: 'zone-14',
    nameKey: 'zones.zone14.name',
    descKey: 'zones.zone14.description',
    imageUrl: 'assets/images/projects/zone-14.jpg',
    sortOrder: 3,
  },
  {
    slug: 'zone-21',
    nameKey: 'zones.zone21.name',
    descKey: 'zones.zone21.description',
    imageUrl: 'assets/images/zones/zone_21.png',
    sortOrder: 4,
  },
  {
    slug: 'zone-22',
    nameKey: 'zones.zone22.name',
    descKey: 'zones.zone22.description',
    imageUrl: 'assets/images/projects/zone-22.jpg',
    sortOrder: 5,
  },
  {
    slug: 'zone-29',
    nameKey: 'zones.zone29.name',
    descKey: 'zones.zone29.description',
    imageUrl: 'assets/images/projects/zone-29.jpg',
    sortOrder: 6,
  },
  {
    slug: 'al-rawda',
    nameKey: 'zones.alRawda.name',
    descKey: 'zones.alRawda.description',
    imageUrl: 'assets/images/projects/al-rawda.jpg',
    sortOrder: 7,
  },
  {
    slug: 'zone-35',
    nameKey: 'zones.zone35.name',
    descKey: 'zones.zone35.description',
    imageUrl: 'assets/images/projects/zone-35.jpg',
    sortOrder: 8,
  },
];

// ── Project data ──

interface ProjectSeed {
  slug: string;
  zoneSlug: string;
  nameKey: string;
  descKey: string;
  statusDescKey: string;
  locationKey: string;
  statusKey: string;
  imageUrl: string;
  progress: number;
  lastUpdatedAt: string;
  isFeatured: boolean;
  mapEmbedUrl: string;
  galleryImages: string[];
}

const PROJECTS: ProjectSeed[] = [
  {
    slug: 'project-255',
    zoneSlug: 'zone-7-strip',
    nameKey: 'projects.project255.name',
    descKey: 'projects.project255.description',
    statusDescKey: '',
    locationKey: 'projects.project255.location',
    statusKey: 'projects.project255.status',
    imageUrl: 'assets/images/projects/project-255-hero.jpg',
    progress: 0,
    lastUpdatedAt: '2026-03-01',
    isFeatured: false,
    mapEmbedUrl: '',
    galleryImages: [],
  },
  {
    slug: 'project-29',
    zoneSlug: 'zone-7-homeland',
    nameKey: 'projects.project29.name',
    descKey: 'projects.project29.description',
    statusDescKey: '',
    locationKey: 'projects.project29.location',
    statusKey: 'projects.project29.status',
    imageUrl: 'assets/images/projects/project-29-hero.jpg',
    progress: 0,
    lastUpdatedAt: '2026-03-01',
    isFeatured: false,
    mapEmbedUrl: '',
    galleryImages: [],
  },
  {
    slug: 'project-336',
    zoneSlug: 'zone-14',
    nameKey: 'projects.project336.name',
    descKey: 'projects.project336.description',
    statusDescKey: '',
    locationKey: 'projects.project336.location',
    statusKey: 'projects.project336.status',
    imageUrl: 'assets/images/projects/project-336-hero.jpg',
    progress: 100,
    lastUpdatedAt: '2026-03-01',
    isFeatured: false,
    mapEmbedUrl: '',
    galleryImages: [],
  },
  {
    slug: 'project-331',
    zoneSlug: 'zone-14',
    nameKey: 'projects.project331.name',
    descKey: 'projects.project331.description',
    statusDescKey: '',
    locationKey: 'projects.project331.location',
    statusKey: 'projects.project331.status',
    imageUrl: 'assets/images/projects/project-331-hero.jpg',
    progress: 100,
    lastUpdatedAt: '2026-03-01',
    isFeatured: false,
    mapEmbedUrl: '',
    galleryImages: [],
  },
  {
    slug: 'project-348',
    zoneSlug: 'zone-14',
    nameKey: 'projects.project348.name',
    descKey: 'projects.project348.description',
    statusDescKey: '',
    locationKey: 'projects.project348.location',
    statusKey: 'projects.project348.status',
    imageUrl: 'assets/images/projects/project-348-hero.jpg',
    progress: 40,
    lastUpdatedAt: '2026-03-01',
    isFeatured: false,
    mapEmbedUrl: '',
    galleryImages: [],
  },
  {
    slug: 'mini-compound',
    zoneSlug: 'zone-21',
    nameKey: 'projects.miniCompound.name',
    descKey: 'projects.miniCompound.description',
    statusDescKey: '',
    locationKey: 'projects.miniCompound.location',
    statusKey: 'projects.miniCompound.status',
    imageUrl: 'assets/images/projects/mini-compound-hero.jpg',
    progress: 90,
    lastUpdatedAt: '2026-03-15',
    isFeatured: false,
    mapEmbedUrl: '',
    galleryImages: [],
  },
  {
    slug: 'project-629',
    zoneSlug: 'zone-21',
    nameKey: 'projects.project629.name',
    descKey: 'projects.project629.description',
    statusDescKey: '',
    locationKey: 'projects.project629.location',
    statusKey: 'projects.project629.status',
    imageUrl: 'assets/images/projects/project-629-hero.jpg',
    progress: 90,
    lastUpdatedAt: '2026-03-10',
    isFeatured: false,
    mapEmbedUrl: '',
    galleryImages: [],
  },
  {
    slug: 'project-584',
    zoneSlug: 'zone-21',
    nameKey: 'projects.project584.name',
    descKey: 'projects.project584.description',
    statusDescKey: '',
    locationKey: 'projects.project584.location',
    statusKey: 'projects.project584.status',
    imageUrl: 'assets/images/projects/project-584-hero.jpg',
    progress: 80,
    lastUpdatedAt: '2026-03-05',
    isFeatured: false,
    mapEmbedUrl: '',
    galleryImages: [],
  },
  {
    slug: 'project-865',
    zoneSlug: 'zone-21',
    nameKey: 'projects.project865.name',
    descKey: 'projects.project865.description',
    statusDescKey: 'projects.project865.statusDescription',
    locationKey: 'projects.project865.location',
    statusKey: 'projects.project865.status',
    imageUrl: 'assets/images/projects/project-865-hero.jpg',
    progress: 70,
    lastUpdatedAt: '2026-03-01',
    isFeatured: true,
    mapEmbedUrl:
      'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3441.5!2d30.52!3d30.37!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzDCsDIyJzEyLjAiTiAzMMKwMzEnMTIuMCJF!5e0!3m2!1sar!2seg!4v1',
    galleryImages: [
      'assets/images/projects/project-865-gallery-1.jpg',
      'assets/images/projects/project-865-gallery-2.jpg',
      'assets/images/projects/project-865-gallery-3.jpg',
      'assets/images/projects/project-865-gallery-4.jpg',
    ],
  },
  {
    slug: 'project-868',
    zoneSlug: 'zone-21',
    nameKey: 'projects.project868.name',
    descKey: 'projects.project868.description',
    statusDescKey: 'projects.project868.statusDescription',
    locationKey: 'projects.project868.location',
    statusKey: 'projects.project868.status',
    imageUrl: 'assets/images/projects/project-868-hero.jpg',
    progress: 70,
    lastUpdatedAt: '2026-02-15',
    isFeatured: true,
    mapEmbedUrl:
      'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3441.5!2d30.52!3d30.37!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzDCsDIyJzE4LjAiTiAzMMKwMzEnMTguMCJF!5e0!3m2!1sar!2seg!4v2',
    galleryImages: [
      'assets/images/projects/project-868-gallery-1.jpg',
      'assets/images/projects/project-868-gallery-2.jpg',
      'assets/images/projects/project-868-gallery-3.jpg',
      'assets/images/projects/project-868-gallery-4.jpg',
    ],
  },
  {
    slug: 'project-947',
    zoneSlug: 'zone-21',
    nameKey: 'projects.project947.name',
    descKey: 'projects.project947.description',
    statusDescKey: '',
    locationKey: 'projects.project947.location',
    statusKey: 'projects.project947.status',
    imageUrl: 'assets/images/projects/project-947-hero.jpg',
    progress: 50,
    lastUpdatedAt: '2026-03-01',
    isFeatured: false,
    mapEmbedUrl: '',
    galleryImages: [],
  },
  {
    slug: 'project-791',
    zoneSlug: 'zone-21',
    nameKey: 'projects.project791.name',
    descKey: 'projects.project791.description',
    statusDescKey: '',
    locationKey: 'projects.project791.location',
    statusKey: 'projects.project791.status',
    imageUrl: 'assets/images/projects/project-791-hero.jpg',
    progress: 30,
    lastUpdatedAt: '2026-02-20',
    isFeatured: false,
    mapEmbedUrl: '',
    galleryImages: [],
  },
  {
    slug: 'project-794',
    zoneSlug: 'zone-21',
    nameKey: 'projects.project794.name',
    descKey: 'projects.project794.description',
    statusDescKey: '',
    locationKey: 'projects.project794.location',
    statusKey: 'projects.project794.status',
    imageUrl: 'assets/images/projects/project-794-hero.jpg',
    progress: 10,
    lastUpdatedAt: '2026-02-01',
    isFeatured: false,
    mapEmbedUrl: '',
    galleryImages: [],
  },
  {
    slug: 'project-799',
    zoneSlug: 'zone-21',
    nameKey: 'projects.project799.name',
    descKey: 'projects.project799.description',
    statusDescKey: '',
    locationKey: 'projects.project799.location',
    statusKey: 'projects.project799.status',
    imageUrl: 'assets/images/projects/project-799-hero.jpg',
    progress: 10,
    lastUpdatedAt: '2026-02-01',
    isFeatured: false,
    mapEmbedUrl: '',
    galleryImages: [],
  },
  {
    slug: 'project-870',
    zoneSlug: 'zone-21',
    nameKey: 'projects.project870.name',
    descKey: 'projects.project870.description',
    statusDescKey: '',
    locationKey: 'projects.project870.location',
    statusKey: 'projects.project870.status',
    imageUrl: 'assets/images/projects/project-870-hero.jpg',
    progress: 0,
    lastUpdatedAt: '2026-03-01',
    isFeatured: false,
    mapEmbedUrl: '',
    galleryImages: [],
  },
  {
    slug: 'project-1102',
    zoneSlug: 'zone-22',
    nameKey: 'projects.project1102.name',
    descKey: 'projects.project1102.description',
    statusDescKey: '',
    locationKey: 'projects.project1102.location',
    statusKey: 'projects.project1102.status',
    imageUrl: 'assets/images/projects/project-1102-hero.jpg',
    progress: 70,
    lastUpdatedAt: '2026-03-01',
    isFeatured: false,
    mapEmbedUrl: '',
    galleryImages: [],
  },
  {
    slug: 'project-1290',
    zoneSlug: 'zone-29',
    nameKey: 'projects.project1290.name',
    descKey: 'projects.project1290.description',
    statusDescKey: '',
    locationKey: 'projects.project1290.location',
    statusKey: 'projects.project1290.status',
    imageUrl: 'assets/images/projects/project-1290-hero.jpg',
    progress: 100,
    lastUpdatedAt: '2026-03-01',
    isFeatured: false,
    mapEmbedUrl: '',
    galleryImages: [],
  },
  {
    slug: 'project-94',
    zoneSlug: 'al-rawda',
    nameKey: 'projects.project94.name',
    descKey: 'projects.project94.description',
    statusDescKey: '',
    locationKey: 'projects.project94.location',
    statusKey: 'projects.project94.status',
    imageUrl: 'assets/images/projects/project-94-hero.jpg',
    progress: 30,
    lastUpdatedAt: '2026-03-01',
    isFeatured: false,
    mapEmbedUrl: '',
    galleryImages: [],
  },
  {
    slug: 'project-76',
    zoneSlug: 'al-rawda',
    nameKey: 'projects.project76.name',
    descKey: 'projects.project76.description',
    statusDescKey: 'projects.project76.statusDescription',
    locationKey: 'projects.project76.location',
    statusKey: 'projects.project76.status',
    imageUrl: 'assets/images/projects/project-76-hero.jpg',
    progress: 20,
    lastUpdatedAt: '2026-01-10',
    isFeatured: true,
    mapEmbedUrl:
      'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3441.5!2d30.51!3d30.36!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzDCsDIxJzM2LjAiTiAzMMKwMzAnMzYuMCJF!5e0!3m2!1sar!2seg!4v3',
    galleryImages: [
      'assets/images/projects/project-76-gallery-1.jpg',
      'assets/images/projects/project-76-gallery-2.jpg',
      'assets/images/projects/project-76-gallery-3.jpg',
      'assets/images/projects/project-76-gallery-4.jpg',
    ],
  },
  {
    slug: 'project-137',
    zoneSlug: 'zone-35',
    nameKey: 'projects.project137.name',
    descKey: 'projects.project137.description',
    statusDescKey: '',
    locationKey: 'projects.project137.location',
    statusKey: 'projects.project137.status',
    imageUrl: 'assets/images/projects/project-137-hero.jpg',
    progress: 80,
    lastUpdatedAt: '2026-03-01',
    isFeatured: false,
    mapEmbedUrl: '',
    galleryImages: [],
  },
];

// ── Unit data ──

interface UnitSeed {
  projectSlug: string;
  unitCode: string;
  unitTypeAr: string;
  unitTypeEn: string;
  area: number;
  rooms: number;
  bathrooms: number;
  floor: number;
  price: number;
  status: 'available' | 'reserved' | 'sold';
  deliveryYear: number;
  unitImageUrl: string;
}

const UNITS: UnitSeed[] = [
  { projectSlug: 'project-255', unitCode: 'A-101', unitTypeAr: 'شقة', unitTypeEn: 'Apartment', area: 120, rooms: 3, bathrooms: 2, floor: 1, price: 950000, status: 'available', deliveryYear: 2027, unitImageUrl: '' },
  { projectSlug: 'project-255', unitCode: 'A-204', unitTypeAr: 'شقة', unitTypeEn: 'Apartment', area: 145, rooms: 3, bathrooms: 2, floor: 2, price: 1150000, status: 'available', deliveryYear: 2027, unitImageUrl: '' },
  { projectSlug: 'project-29', unitCode: 'B-102', unitTypeAr: 'شقة', unitTypeEn: 'Apartment', area: 95, rooms: 2, bathrooms: 1, floor: 1, price: 720000, status: 'available', deliveryYear: 2026, unitImageUrl: '' },
  { projectSlug: 'project-29', unitCode: 'B-305', unitTypeAr: 'دوبلكس', unitTypeEn: 'Duplex', area: 210, rooms: 4, bathrooms: 3, floor: 3, price: 1650000, status: 'reserved', deliveryYear: 2028, unitImageUrl: '' },
  { projectSlug: 'project-336', unitCode: 'C-108', unitTypeAr: 'شقة', unitTypeEn: 'Apartment', area: 110, rooms: 2, bathrooms: 2, floor: 1, price: 860000, status: 'available', deliveryYear: 2026, unitImageUrl: '' },
  { projectSlug: 'project-336', unitCode: 'C-412', unitTypeAr: 'شقة', unitTypeEn: 'Apartment', area: 170, rooms: 4, bathrooms: 2, floor: 4, price: 1420000, status: 'available', deliveryYear: 2028, unitImageUrl: '' },
  { projectSlug: 'project-331', unitCode: 'D-203', unitTypeAr: 'شقة', unitTypeEn: 'Apartment', area: 130, rooms: 3, bathrooms: 2, floor: 2, price: 1020000, status: 'sold', deliveryYear: 2027, unitImageUrl: '' },
  { projectSlug: 'project-331', unitCode: 'D-506', unitTypeAr: 'شقة', unitTypeEn: 'Apartment', area: 155, rooms: 3, bathrooms: 2, floor: 5, price: 1240000, status: 'available', deliveryYear: 2027, unitImageUrl: '' },
  { projectSlug: 'project-348', unitCode: 'E-101', unitTypeAr: 'شقة', unitTypeEn: 'Apartment', area: 100, rooms: 2, bathrooms: 1, floor: 1, price: 790000, status: 'available', deliveryYear: 2026, unitImageUrl: '' },
  { projectSlug: 'mini-compound', unitCode: 'F-620', unitTypeAr: 'شقة', unitTypeEn: 'Apartment', area: 200, rooms: 4, bathrooms: 3, floor: 6, price: 1680000, status: 'available', deliveryYear: 2028, unitImageUrl: '' },
  { projectSlug: 'mini-compound', unitCode: 'F-115', unitTypeAr: 'شقة', unitTypeEn: 'Apartment', area: 118, rooms: 3, bathrooms: 2, floor: 1, price: 940000, status: 'reserved', deliveryYear: 2027, unitImageUrl: '' },
  { projectSlug: 'project-629', unitCode: 'G-303', unitTypeAr: 'شقة', unitTypeEn: 'Apartment', area: 135, rooms: 3, bathrooms: 2, floor: 3, price: 1080000, status: 'available', deliveryYear: 2027, unitImageUrl: '' },
  { projectSlug: 'project-584', unitCode: 'H-207', unitTypeAr: 'شقة', unitTypeEn: 'Apartment', area: 90, rooms: 2, bathrooms: 1, floor: 2, price: 700000, status: 'available', deliveryYear: 2026, unitImageUrl: '' },
  { projectSlug: 'project-584', unitCode: 'H-408', unitTypeAr: 'دوبلكس', unitTypeEn: 'Duplex', area: 220, rooms: 4, bathrooms: 3, floor: 4, price: 1780000, status: 'available', deliveryYear: 2029, unitImageUrl: '' },
  { projectSlug: 'project-865', unitCode: 'I-104', unitTypeAr: 'شقة', unitTypeEn: 'Apartment', area: 125, rooms: 3, bathrooms: 2, floor: 1, price: 990000, status: 'available', deliveryYear: 2027, unitImageUrl: '' },
  { projectSlug: 'project-947', unitCode: 'J-209', unitTypeAr: 'شقة', unitTypeEn: 'Apartment', area: 105, rooms: 2, bathrooms: 2, floor: 2, price: 830000, status: 'available', deliveryYear: 2026, unitImageUrl: '' },
];

// ── Seed ──

async function seed(): Promise<void> {
  console.log('Seeding Turso database...');

  // 1. Run schema
  // Split schema by statements (libsql doesn't support multi-statement exec in one call)
  const statements = schema
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  for (const stmt of statements) {
    await db.execute(stmt);
  }
  console.log('  Schema applied');

  // 2. Admin user
  const existingUser = await db.execute({
    sql: 'SELECT id FROM users WHERE email = ?',
    args: ['admin@alahram.com'],
  });
  if (existingUser.rows.length === 0) {
    const passwordHash = hashPassword('admin123');
    await db.execute({
      sql: 'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      args: ['Admin', 'admin@alahram.com', passwordHash, 'admin'],
    });
    console.log('  Created admin user: admin@alahram.com / admin123');
  } else {
    console.log('  Admin user already exists');
  }

  // 3. Zones
  for (const z of ZONES) {
    await db.execute({
      sql: 'INSERT OR IGNORE INTO zones (slug, name_ar, name_en, description_ar, description_en, image_url, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)',
      args: [
        z.slug,
        getTranslation(ar, z.nameKey),
        getTranslation(en, z.nameKey),
        getTranslation(ar, z.descKey),
        getTranslation(en, z.descKey),
        z.imageUrl,
        z.sortOrder,
      ],
    });
  }
  console.log(`  Seeded ${ZONES.length} zones`);

  // 4. Projects
  let sortOrder = 0;
  for (const p of PROJECTS) {
    const zoneResult = await db.execute({
      sql: 'SELECT id FROM zones WHERE slug = ?',
      args: [p.zoneSlug],
    });
    const zone = zoneResult.rows[0];
    if (!zone) {
      console.warn(`  Zone not found: ${p.zoneSlug} (for project ${p.slug})`);
      continue;
    }
    sortOrder++;
    await db.execute({
      sql: `INSERT OR IGNORE INTO projects (slug, zone_id, name_ar, name_en, description_ar, description_en,
        status_description_ar, status_description_en, location_ar, location_en, status_ar, status_en,
        image_url, progress, map_embed_url, is_featured, sort_order, last_updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        p.slug,
        zone.id,
        getTranslation(ar, p.nameKey),
        getTranslation(en, p.nameKey),
        getTranslation(ar, p.descKey),
        getTranslation(en, p.descKey),
        p.statusDescKey ? getTranslation(ar, p.statusDescKey) : '',
        p.statusDescKey ? getTranslation(en, p.statusDescKey) : '',
        getTranslation(ar, p.locationKey),
        getTranslation(en, p.locationKey),
        getTranslation(ar, p.statusKey),
        getTranslation(en, p.statusKey),
        p.imageUrl,
        p.progress,
        p.mapEmbedUrl,
        p.isFeatured ? 1 : 0,
        sortOrder,
        p.lastUpdatedAt,
      ],
    });
  }
  console.log(`  Seeded ${PROJECTS.length} projects`);

  // 5. Gallery images
  let galleryCount = 0;
  for (const p of PROJECTS) {
    if (p.galleryImages.length === 0) continue;
    const projResult = await db.execute({
      sql: 'SELECT id FROM projects WHERE slug = ?',
      args: [p.slug],
    });
    const proj = projResult.rows[0];
    if (!proj) continue;
    const projectNameAr = getTranslation(ar, p.nameKey);
    const projectNameEn = getTranslation(en, p.nameKey);
    for (let i = 0; i < p.galleryImages.length; i++) {
      await db.execute({
        sql: 'INSERT OR IGNORE INTO gallery_images (project_id, image_url, caption_ar, caption_en, sort_order) VALUES (?, ?, ?, ?, ?)',
        args: [
          proj.id,
          p.galleryImages[i],
          `${projectNameAr} - صورة ${i + 1}`,
          `${projectNameEn} - Photo ${i + 1}`,
          i + 1,
        ],
      });
      galleryCount++;
    }
  }
  console.log(`  Seeded ${galleryCount} gallery images`);

  // 6. Units
  let unitCount = 0;
  for (const u of UNITS) {
    const projResult = await db.execute({
      sql: 'SELECT id FROM projects WHERE slug = ?',
      args: [u.projectSlug],
    });
    const proj = projResult.rows[0];
    if (!proj) {
      console.warn(`  Project not found: ${u.projectSlug} (for unit ${u.unitCode})`);
      continue;
    }
    await db.execute({
      sql: `INSERT OR IGNORE INTO units (project_id, unit_code, unit_type_ar, unit_type_en, area, rooms,
        bathrooms, floor, price, status, delivery_year, unit_image_url)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        proj.id,
        u.unitCode,
        u.unitTypeAr,
        u.unitTypeEn,
        u.area,
        u.rooms,
        u.bathrooms,
        u.floor,
        u.price,
        u.status,
        u.deliveryYear,
        u.unitImageUrl,
      ],
    });
    unitCount++;
  }
  console.log(`  Seeded ${unitCount} units`);

  console.log('Seed complete!');
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
AHRAM_EOF_7
echo "  wrote: scripts/seed-turso.ts"

mkdir -p "src/app/features/units/models"
cat > "src/app/features/units/models/unit-api.models.ts" << 'AHRAM_EOF_8'
/** API response models — already-localized text (no translation keys) */

export type UnitStatus = 'available' | 'reserved' | 'sold';

export interface ApiUnit {
  id: number;
  projectId: number;
  projectSlug: string;
  projectName: string;
  zoneSlug: string;
  unitCode: string;
  unitType: string;
  area: number;
  rooms: number;
  bathrooms: number;
  floor: number | null;
  price: number;
  status: UnitStatus;
  deliveryYear: number | null;
  unitImageUrl: string;
}

export interface UnitFilters {
  project?: string;
  zone?: string;
  minPrice?: number;
  maxPrice?: number;
  minArea?: number;
  maxArea?: number;
  minRooms?: number;
  status?: UnitStatus;
}
AHRAM_EOF_8
echo "  wrote: src/app/features/units/models/unit-api.models.ts"

mkdir -p "src/app/features/units/services"
cat > "src/app/features/units/services/units-api.service.ts" << 'AHRAM_EOF_9'
import { Injectable, inject } from '@angular/core';
import { Observable, map, of, catchError } from 'rxjs';
import { ApiService, I18nService } from '@core/services';
import { ApiUnit, UnitFilters } from '../models/unit-api.models';

@Injectable({ providedIn: 'root' })
export class UnitsApiService {
  private readonly api = inject(ApiService);
  private readonly i18n = inject(I18nService);
  private langParam(): Record<string, string> {
    return { lang: this.i18n.locale() };
  }

  getUnits(filters?: UnitFilters): Observable<ApiUnit[]> {
    const params: Record<string, string> = this.langParam();
    if (filters?.project) params['project'] = filters.project;
    if (filters?.zone) params['zone'] = filters.zone;
    if (filters?.minPrice) params['minPrice'] = String(filters.minPrice);
    if (filters?.maxPrice) params['maxPrice'] = String(filters.maxPrice);
    if (filters?.minArea) params['minArea'] = String(filters.minArea);
    if (filters?.maxArea) params['maxArea'] = String(filters.maxArea);
    if (filters?.minRooms) params['minRooms'] = String(filters.minRooms);
    if (filters?.status) params['status'] = filters.status;

    return this.api.get<ApiUnit[]>('/units', params).pipe(
      map(res => res.data ?? []),
      catchError(() => of([])),
    );
  }

  getUnitById(id: number): Observable<ApiUnit> {
    return this.api.get<ApiUnit>(`/units/${id}`, this.langParam()).pipe(
      map(res => res.data),
    );
  }
}
AHRAM_EOF_9
echo "  wrote: src/app/features/units/services/units-api.service.ts"

mkdir -p "src/app/features/units"
cat > "src/app/features/units/units.routes.ts" << 'AHRAM_EOF_10'
import { Routes } from '@angular/router';

export const UNITS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./units-list/units-list.component').then(
        (m) => m.UnitsListComponent,
      ),
  },
];
AHRAM_EOF_10
echo "  wrote: src/app/features/units/units.routes.ts"

mkdir -p "src/app/features/units/units-list"
cat > "src/app/features/units/units-list/units-list.component.ts" << 'AHRAM_EOF_11'
import { ChangeDetectionStrategy, Component, effect, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { SeoService } from '@core/services/seo.service';
import { I18nService } from '@core/services';
import { buildBreadcrumbSchema } from '@shared/helpers';
import { BreadcrumbsComponent, BreadcrumbItem, LoadingSpinnerComponent } from '@shared/ui';
import { environment } from '@env';
import { ImageFallbackDirective, ScrollAnimateDirective } from '@shared/directives';
import { LocalizeRoutePipe } from '@shared/pipes';
import { UnitsApiService } from '../services/units-api.service';
import { ApiUnit } from '../models/unit-api.models';

const MAX_PRICE_CEILING = 2000000;
const MIN_PRICE_FLOOR = 500000;
const ROOM_OPTIONS = [0, 2, 3, 4];

@Component({
  selector: 'ahram-units-list',
  standalone: true,
  imports: [
    RouterLink,
    TranslocoDirective,
    CurrencyPipe,
    BreadcrumbsComponent,
    LoadingSpinnerComponent,
    ImageFallbackDirective,
    LocalizeRoutePipe,
    ScrollAnimateDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './units-list.component.html',
  styleUrl: './units-list.component.scss',
})
export class UnitsListComponent implements OnInit {
  private readonly seo = inject(SeoService);
  private readonly transloco = inject(TranslocoService);
  private readonly i18n = inject(I18nService);
  private readonly unitsApi = inject(UnitsApiService);

  protected breadcrumbItems: BreadcrumbItem[] = [];
  protected readonly units = signal<ApiUnit[]>([]);
  protected readonly loading = signal(true);

  protected readonly roomOptions = ROOM_OPTIONS;
  protected readonly priceFloor = MIN_PRICE_FLOOR;
  protected readonly priceCeiling = MAX_PRICE_CEILING;

  protected readonly maxPrice = signal(MAX_PRICE_CEILING);
  protected readonly minRooms = signal(0);

  constructor() {
    // Re-fetch whenever the locale or a filter changes
    effect(() => {
      this.i18n.locale(); // track locale signal
      const maxPrice = this.maxPrice();
      const minRooms = this.minRooms();

      this.loading.set(true);
      this.unitsApi
        .getUnits({
          maxPrice,
          minRooms: minRooms || undefined,
        })
        .subscribe(data => {
          this.units.set(data);
          this.loading.set(false);
        });
    });
  }

  ngOnInit(): void {
    const lang = this.i18n.locale();
    this.seo.updateSeo({
      title: this.transloco.translate('units.seo.title'),
      description: this.transloco.translate('units.seo.description'),
      keywords: this.transloco.translate('units.seo.keywords'),
      canonicalUrl: `${environment.siteUrl}/${lang}/units/`,
    });
    this.breadcrumbItems = [
      { label: this.transloco.translate('header.home'), url: `/${lang}` },
      { label: this.transloco.translate('units.title') },
    ];
    this.seo.addJsonLd(buildBreadcrumbSchema([
      { name: this.transloco.translate('header.home'), url: `${environment.siteUrl}/${lang}` },
      { name: this.transloco.translate('units.title'), url: `${environment.siteUrl}/${lang}/units` },
    ]));
  }

  protected onMaxPriceInput(value: string): void {
    this.maxPrice.set(Number(value));
  }

  protected setMinRooms(rooms: number): void {
    this.minRooms.set(rooms);
  }

  protected statusLabel(status: string): string {
    return this.transloco.translate(`units.status.${status}`);
  }
}
AHRAM_EOF_11
echo "  wrote: src/app/features/units/units-list/units-list.component.ts"

mkdir -p "src/app/features/units/units-list"
cat > "src/app/features/units/units-list/units-list.component.html" << 'AHRAM_EOF_12'
<section *transloco="let t" class="section-spacing-lg">
  <div class="container px-4">

    <!-- Breadcrumbs -->
    <ahram-breadcrumbs [items]="breadcrumbItems" />

    <!-- Page Header -->
    <div class="mb-14 text-center">
      <span ahramAnimate="fade-up" class="eyebrow">{{ t('units.eyebrow') }}</span>
      <h1 ahramAnimate="fade-up" [animateDelay]="0.1" class="section-title-xl mt-4">{{ t('units.title') }}</h1>
      <span ahramAnimate="fade-up" [animateDelay]="0.15" class="editorial-rule mx-auto mt-5"></span>
      <p ahramAnimate="fade-up" [animateDelay]="0.2" class="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">{{ t('units.subtitle') }}</p>
    </div>

    <!-- Filters -->
    <div ahramAnimate="fade-up" class="mb-10 flex flex-wrap items-end gap-8 rounded-2xl border border-border bg-card p-6">
      <div class="min-w-[220px] flex-1">
        <div class="mb-1.5 flex items-center justify-between">
          <label class="text-sm font-medium">{{ t('units.filters.maxPrice') }}</label>
          <span class="text-sm font-semibold text-primary">{{ maxPrice() | currency:'EGP':'symbol-narrow':'1.0-0' }}</span>
        </div>
        <input
          type="range"
          [value]="maxPrice()"
          (input)="onMaxPriceInput($any($event.target).value)"
          [min]="priceFloor"
          [max]="priceCeiling"
          step="10000"
          class="calc-slider w-full"
        />
      </div>

      <div>
        <label class="mb-2 block text-sm font-medium">{{ t('units.filters.rooms') }}</label>
        <div class="flex gap-2">
          @for (r of roomOptions; track r) {
            <button
              type="button"
              (click)="setMinRooms(r)"
              [class.bg-primary]="minRooms() === r"
              [class.text-primary-foreground]="minRooms() === r"
              [class.border-primary]="minRooms() === r"
              class="rounded-full border border-border px-4 py-1.5 text-sm font-semibold transition-colors hover:border-primary/50"
            >
              {{ r === 0 ? t('units.filters.any') : (r + '+') }}
            </button>
          }
        </div>
      </div>
    </div>

    <!-- Loading -->
    @if (loading()) {
      <div class="flex justify-center py-16">
        <ahram-loading-spinner />
      </div>
    } @else if (units().length === 0) {
      <p class="py-16 text-center text-muted-foreground">{{ t('units.noResults') }}</p>
    } @else {
      <!-- Units Grid -->
      <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        @for (unit of units(); track unit.id; let i = $index) {
          <a
            [routerLink]="['/projects', unit.zoneSlug, unit.projectSlug] | localizeRoute"
            ahramAnimate="fade-up" [animateDelay]="i * 0.06"
            class="group overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg"
          >
            <div class="img-zoom relative aspect-video overflow-hidden bg-muted">
              @if (unit.unitImageUrl) {
                <img [src]="unit.unitImageUrl" [alt]="unit.unitCode" ahramFallback
                  class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"/>
              } @else {
                <div class="flex h-full w-full items-center justify-center bg-muted text-sm text-muted-foreground">
                  {{ unit.projectName }}
                </div>
              }
              <div class="absolute bottom-3 start-3">
                <span
                  class="rounded-lg px-3 py-1 text-xs font-semibold"
                  [class.bg-primary]="unit.status === 'available'"
                  [class.text-primary-foreground]="unit.status === 'available'"
                  [class.bg-muted]="unit.status !== 'available'"
                  [class.text-muted-foreground]="unit.status !== 'available'"
                >
                  {{ statusLabel(unit.status) }}
                </span>
              </div>
            </div>
            <div class="p-6">
              <div class="flex items-center justify-between">
                <span class="text-xs font-semibold text-muted-foreground">{{ unit.projectName }}</span>
                <span class="text-xs text-muted-foreground">{{ unit.unitCode }}</span>
              </div>
              <h2 class="mt-2 font-display text-lg font-bold">{{ unit.unitType }}</h2>
              <div class="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span>{{ unit.area }} {{ t('units.card.sqm') }}</span>
                <span>{{ unit.rooms }} {{ t('units.card.rooms') }}</span>
                @if (unit.floor !== null) {
                  <span>{{ t('units.card.floor') }} {{ unit.floor }}</span>
                }
              </div>
              <p class="mt-4 text-xl font-black text-primary">{{ unit.price | currency:'EGP':'symbol-narrow':'1.0-0' }}</p>
            </div>
          </a>
        }
      </div>
    }

  </div>
</section>
AHRAM_EOF_12
echo "  wrote: src/app/features/units/units-list/units-list.component.html"

mkdir -p "src/app/features/units/units-list"
cat > "src/app/features/units/units-list/units-list.component.scss" << 'AHRAM_EOF_13'
:host {
  display: block;
}

.calc-slider {
  appearance: none;
  height: 6px;
  border-radius: 3px;
  background: var(--color-muted);
  outline: none;
  cursor: pointer;

  &::-webkit-slider-thumb {
    appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: var(--color-primary);
    cursor: pointer;
    transition: transform 0.15s ease;

    &:hover {
      transform: scale(1.15);
    }
  }

  &::-moz-range-thumb {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: var(--color-primary);
    border: none;
    cursor: pointer;
  }
}
AHRAM_EOF_13
echo "  wrote: src/app/features/units/units-list/units-list.component.scss"

mkdir -p "src/app"
cat > "src/app/app.routes.ts" << 'AHRAM_EOF_14'
import { Routes } from '@angular/router';
import { localeGuard } from './core/guards';

export const routes: Routes = [
  // Admin panel (no locale prefix)
  {
    path: 'admin',
    loadChildren: () => import('./features/admin/admin.routes').then(m => m.ADMIN_ROUTES),
  },

  // Root redirect to default locale
  { path: '', redirectTo: 'ar', pathMatch: 'full' },

  // Legacy redirects (pre-locale URLs)
  { path: 'projects', redirectTo: 'ar/projects', pathMatch: 'prefix' },
  { path: 'about', redirectTo: 'ar/about', pathMatch: 'full' },
  { path: 'contact', redirectTo: 'ar/contact', pathMatch: 'full' },
  { path: 'gallery', redirectTo: 'ar/gallery', pathMatch: 'full' },
  { path: 'blog', redirectTo: 'ar/blog', pathMatch: 'prefix' },
  { path: 'privacy', redirectTo: 'ar/privacy', pathMatch: 'full' },
  { path: 'sadat-guide', redirectTo: 'ar/sadat-guide', pathMatch: 'full' },
  { path: 'sadat-city-maps', redirectTo: 'ar/sadat-city-maps', pathMatch: 'full' },
  { path: 'خارطة-مدينة-السادات', redirectTo: 'ar/sadat-city-maps', pathMatch: 'full' },
  { path: 'construction', redirectTo: 'ar/construction', pathMatch: 'full' },
  // Removed features — preserve any link equity
  { path: 'faq', redirectTo: 'ar/sadat-guide', pathMatch: 'full' },
  { path: 'payment-plans', redirectTo: 'ar', pathMatch: 'full' },
  { path: 'investors', redirectTo: 'ar', pathMatch: 'full' },

  // Locale-prefixed routes
  {
    path: ':locale',
    canActivate: [localeGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadChildren: () => import('./features/home/home.routes').then(m => m.HOME_ROUTES),
      },
      {
        path: 'projects',
        loadChildren: () =>
          import('./features/projects/projects.routes').then(m => m.PROJECTS_ROUTES),
      },
      {
        path: 'units',
        loadChildren: () =>
          import('./features/units/units.routes').then(m => m.UNITS_ROUTES),
      },
      {
        path: 'about',
        loadChildren: () => import('./features/about/about.routes').then(m => m.ABOUT_ROUTES),
      },
      {
        path: 'contact',
        loadChildren: () => import('./features/contact/contact.routes').then(m => m.CONTACT_ROUTES),
      },
      {
        path: 'gallery',
        loadChildren: () => import('./features/gallery/gallery.routes').then(m => m.GALLERY_ROUTES),
      },
      {
        path: 'blog',
        loadChildren: () => import('./features/blog/blog.routes').then(m => m.BLOG_ROUTES),
      },
      {
        path: 'sadat-guide',
        loadChildren: () => import('./features/guide/guide.routes').then(m => m.GUIDE_ROUTES),
      },
      {
        path: 'sadat-city-maps',
        loadChildren: () =>
          import('./features/sadat-maps/sadat-maps.routes').then(m => m.SADAT_MAPS_ROUTES),
      },
      {
        path: 'خارطة-مدينة-السادات',
        redirectTo: 'sadat-city-maps',
        pathMatch: 'full',
      },
      {
        path: 'construction',
        loadChildren: () => import('./features/updates/updates.routes').then(m => m.UPDATES_ROUTES),
      },
      {
        path: 'privacy',
        loadChildren: () => import('./features/privacy/privacy.routes').then(m => m.PRIVACY_ROUTES),
      },
      // Removed features — redirect within active locale to preserve link equity
      { path: 'faq', redirectTo: 'sadat-guide', pathMatch: 'full' },
    ],
  },

  // 404 catch-all
  {
    path: '**',
    loadComponent: () =>
      import('./core/layout/not-found/not-found.component').then(m => m.NotFoundComponent),
  },
];
AHRAM_EOF_14
echo "  wrote: src/app/app.routes.ts"

mkdir -p "src/app"
cat > "src/app/app.component.ts" << 'AHRAM_EOF_15'
import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { HeaderComponent } from './core/layout/header/header.component';
import { FooterComponent } from './core/layout/footer/footer.component';
import { WhatsappButtonComponent, CallButtonComponent, FacebookButtonComponent, ChatWidgetComponent } from '@shared/ui';
import { PlatformService, SiteSettingsService } from './core/services';
import { AppStore } from './core/state/app.store';
import { toSignal } from '@angular/core/rxjs-interop';

declare const gtag: (...args: unknown[]) => void;

@Component({
  selector: 'ahram-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, FooterComponent, WhatsappButtonComponent, CallButtonComponent, FacebookButtonComponent, ChatWidgetComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  private readonly appStore = inject(AppStore);
  private readonly router = inject(Router);
  private readonly platform = inject(PlatformService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly siteSettings = inject(SiteSettingsService);

  private readonly routerEvents = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
    ),
  );

  protected readonly isAdminRoute = computed(() => {
    const event = this.routerEvents();
    return event?.urlAfterRedirects?.startsWith('/admin') ?? this.router.url.startsWith('/admin');
  });

  ngOnInit(): void {
    this.appStore.initialize();
    this.siteSettings.load();
    this.initAnalytics();
  }

  private initAnalytics(): void {
    this.platform.runInBrowser(() => {
      this.router.events
        .pipe(
          filter((e): e is NavigationEnd => e instanceof NavigationEnd),
          takeUntilDestroyed(this.destroyRef),
        )
        .subscribe(event => {
          if (typeof gtag === 'function') {
            gtag('event', 'page_view', { page_path: event.urlAfterRedirects });
          }
        });
    });
  }
}
AHRAM_EOF_15
echo "  wrote: src/app/app.component.ts"

mkdir -p "src/app"
cat > "src/app/app.component.html" << 'AHRAM_EOF_16'
<div class="flex min-h-screen flex-col bg-background text-foreground font-body">
  @if (!isAdminRoute()) {
    <a href="#main-content" class="skip-to-content">Skip to content</a>
    <ahram-header />
  }
  <main id="main-content" [class.flex-1]="!isAdminRoute()">
    <router-outlet />
  </main>
  @if (!isAdminRoute()) {
    <ahram-footer />
    @defer {
      <ahram-whatsapp-button />
      <ahram-call-button />
      <ahram-chat-widget />
    }
  }
</div>
<!-- <ahram-facebook-button /> -->
AHRAM_EOF_16
echo "  wrote: src/app/app.component.html"

mkdir -p "src/app/core/layout/header"
cat > "src/app/core/layout/header/header.component.html" << 'AHRAM_EOF_17'
<header
  *transloco="let t"
  class="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur transition-all duration-300 supports-[backdrop-filter]:bg-background/60"
>
  <div class="container flex h-20 items-center justify-between px-4">
    <!-- Logo -->
    <a [routerLink]="'/' | localizeRoute" class="flex shrink-0 items-center gap-2">
      <img
        ngSrc="/logo.png"
        [alt]="t('app.name')"
        width="200"
        height="200"
        priority
        class="h-24 w-auto"
      />
    </a>

    <!-- Desktop Nav -->
    <nav class="hidden items-center gap-1 md:flex">
      <a
        [routerLink]="'/' | localizeRoute"
        routerLinkActive="text-primary font-semibold"
        [routerLinkActiveOptions]="{ exact: true }"
        class="rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted hover:text-primary"
      >
        {{ t('header.home') }}
      </a>
      <a
        [routerLink]="'/projects' | localizeRoute"
        routerLinkActive="text-primary font-semibold"
        class="rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted hover:text-primary"
      >
        {{ t('header.projects') }}
      </a>
      <a
        [routerLink]="'/units' | localizeRoute"
        routerLinkActive="text-primary font-semibold"
        class="rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted hover:text-primary"
      >
        {{ t('header.units') }}
      </a>
      <a
        [routerLink]="'/about' | localizeRoute"
        routerLinkActive="text-primary font-semibold"
        class="rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted hover:text-primary"
      >
        {{ t('header.about') }}
      </a>
      <a
        [routerLink]="'/gallery' | localizeRoute"
        routerLinkActive="text-primary font-semibold"
        class="rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted hover:text-primary"
      >
        {{ t('header.gallery') }}
      </a>
      <a
        [routerLink]="'/blog' | localizeRoute"
        routerLinkActive="text-primary font-semibold"
        class="rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted hover:text-primary"
      >
        {{ t('header.blog') }}
      </a>
      <a
        [routerLink]="'/sadat-city-maps' | localizeRoute"
        routerLinkActive="text-primary font-semibold"
        class="rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted hover:text-primary"
      >
        {{ t('header.sadatMaps') }}
      </a>
      <a
        [routerLink]="'/contact' | localizeRoute"
        routerLinkActive="text-primary font-semibold"
        class="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
      >
        {{ t('header.contact') }}
      </a>
    </nav>

    <!-- Actions -->
    <div class="flex items-center gap-2">
      <!-- Language Toggle -->
      <button
        type="button"
        (click)="switchLocale()"
        [attr.aria-label]="t('header.toggleLanguage')"
        class="inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
      >
        {{ i18n.locale() === 'ar' ? 'EN' : 'عربي' }}
      </button>

      <!-- Theme Toggle -->
      <button
        type="button"
        (click)="appStore.toggleTheme()"
        class="inline-flex items-center justify-center rounded-md p-2 transition-colors hover:bg-muted"
        [attr.aria-label]="t('header.toggleTheme')"
      >
        @if (appStore.isDarkMode()) {
          <svg lucideSun aria-hidden="true" class="h-5 w-5"></svg>
        } @else {
          <svg lucideMoon aria-hidden="true" class="h-5 w-5"></svg>
        }
      </button>

      <!-- Mobile Hamburger -->
      <button
        type="button"
        (click)="toggleMobileMenu()"
        class="inline-flex items-center justify-center rounded-md p-2 transition-colors hover:bg-muted md:hidden"
        [attr.aria-label]="mobileMenuOpen() ? t('nav.close') : t('nav.menu')"
        [attr.aria-expanded]="mobileMenuOpen()"
      >
        @if (mobileMenuOpen()) {
          <svg lucideX aria-hidden="true" class="h-6 w-6"></svg>
        } @else {
          <svg lucideMenu aria-hidden="true" class="h-6 w-6"></svg>
        }
      </button>
    </div>
  </div>
</header>

<!-- Mobile Menu Overlay (outside header to avoid backdrop-filter containing block) -->
@if (mobileMenuOpen()) {
  <div
    *transloco="let t"
    class="mobile-overlay fixed inset-0 top-20 z-40 overflow-y-auto bg-background md:hidden"
  >
    <nav class="container flex flex-col gap-2 px-4 py-6">
      <a
        [routerLink]="'/' | localizeRoute"
        routerLinkActive="text-primary font-semibold bg-muted"
        [routerLinkActiveOptions]="{ exact: true }"
        (click)="closeMobileMenu()"
        class="rounded-lg px-4 py-3 text-lg font-medium transition-colors hover:bg-muted hover:text-primary"
      >
        {{ t('header.home') }}
      </a>
      <a
        [routerLink]="'/projects' | localizeRoute"
        routerLinkActive="text-primary font-semibold bg-muted"
        (click)="closeMobileMenu()"
        class="rounded-lg px-4 py-3 text-lg font-medium transition-colors hover:bg-muted hover:text-primary"
      >
        {{ t('header.projects') }}
      </a>
      <a
        [routerLink]="'/units' | localizeRoute"
        routerLinkActive="text-primary font-semibold bg-muted"
        (click)="closeMobileMenu()"
        class="rounded-lg px-4 py-3 text-lg font-medium transition-colors hover:bg-muted hover:text-primary"
      >
        {{ t('header.units') }}
      </a>
      <a
        [routerLink]="'/about' | localizeRoute"
        routerLinkActive="text-primary font-semibold bg-muted"
        (click)="closeMobileMenu()"
        class="rounded-lg px-4 py-3 text-lg font-medium transition-colors hover:bg-muted hover:text-primary"
      >
        {{ t('header.about') }}
      </a>
      <a
        [routerLink]="'/gallery' | localizeRoute"
        routerLinkActive="text-primary font-semibold bg-muted"
        (click)="closeMobileMenu()"
        class="rounded-lg px-4 py-3 text-lg font-medium transition-colors hover:bg-muted hover:text-primary"
      >
        {{ t('header.gallery') }}
      </a>
      <a
        [routerLink]="'/blog' | localizeRoute"
        routerLinkActive="text-primary font-semibold bg-muted"
        (click)="closeMobileMenu()"
        class="rounded-lg px-4 py-3 text-lg font-medium transition-colors hover:bg-muted hover:text-primary"
      >
        {{ t('header.blog') }}
      </a>
      <a
        [routerLink]="'/sadat-guide' | localizeRoute"
        routerLinkActive="text-primary font-semibold bg-muted"
        (click)="closeMobileMenu()"
        class="rounded-lg px-4 py-3 text-lg font-medium transition-colors hover:bg-muted hover:text-primary"
      >
        {{ t('header.sadatGuide') }}
      </a>
      <a
        [routerLink]="'/sadat-city-maps' | localizeRoute"
        routerLinkActive="text-primary font-semibold bg-muted"
        (click)="closeMobileMenu()"
        class="rounded-lg px-4 py-3 text-lg font-medium transition-colors hover:bg-muted hover:text-primary"
      >
        {{ t('header.sadatMaps') }}
      </a>
      <a
        [routerLink]="'/contact' | localizeRoute"
        routerLinkActive="text-primary font-semibold"
        (click)="closeMobileMenu()"
        class="mt-2 rounded-lg bg-primary px-4 py-3 text-center text-lg font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
      >
        {{ t('header.contact') }}
      </a>
    </nav>
  </div>
}
AHRAM_EOF_17
echo "  wrote: src/app/core/layout/header/header.component.html"

mkdir -p "src/app/core/services"
cat > "src/app/core/services/chat-api.service.ts" << 'AHRAM_EOF_18'
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService, I18nService } from '@core/services';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

@Injectable({ providedIn: 'root' })
export class ChatApiService {
  private readonly api = inject(ApiService);
  private readonly i18n = inject(I18nService);

  sendMessage(messages: ChatMessage[]): Observable<string> {
    return this.api
      .post<{ reply: string }>('/chat', { messages, lang: this.i18n.locale() })
      .pipe(map((res) => res.data.reply));
  }
}
AHRAM_EOF_18
echo "  wrote: src/app/core/services/chat-api.service.ts"

mkdir -p "src/app/core/services"
cat > "src/app/core/services/index.ts" << 'AHRAM_EOF_19'
export { PlatformService } from './platform.service';
export { SeoService } from './seo.service';
export { ApiService } from './api.service';
export { AuthService } from './auth.service';
export { I18nService } from './i18n.service';
export type { AppLocale, AppDirection } from './i18n.service';
export { SiteSettingsService } from './site-settings.service';
export type { SiteSettings } from './site-settings.service';
export { ChatApiService } from './chat-api.service';
export type { ChatMessage } from './chat-api.service';
AHRAM_EOF_19
echo "  wrote: src/app/core/services/index.ts"

mkdir -p "src/app/shared/ui/chat-widget"
cat > "src/app/shared/ui/chat-widget/chat-widget.component.ts" << 'AHRAM_EOF_20'
import { ChangeDetectionStrategy, Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { ChatApiService, ChatMessage } from '@core/services';

@Component({
  selector: 'ahram-chat-widget',
  standalone: true,
  imports: [FormsModule, TranslocoDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './chat-widget.component.html',
  styleUrl: './chat-widget.component.scss',
})
export class ChatWidgetComponent {
  private readonly chatApi = inject(ChatApiService);
  private readonly transloco = inject(TranslocoService);
  private readonly scrollAnchor = viewChild<ElementRef<HTMLElement>>('scrollAnchor');

  protected readonly isOpen = signal(false);
  protected readonly isSending = signal(false);
  protected readonly draft = signal('');
  protected readonly messages = signal<ChatMessage[]>([
    { role: 'assistant', content: '' }, // replaced with translated greeting on first open
  ]);

  private greeted = false;

  protected toggle(): void {
    this.isOpen.update((open) => !open);
    if (this.isOpen() && !this.greeted) {
      this.greeted = true;
      this.messages.set([
        { role: 'assistant', content: this.transloco.translate('chat.greeting') },
      ]);
    }
  }

  protected close(): void {
    this.isOpen.set(false);
  }

  protected onDraftInput(value: string): void {
    this.draft.set(value);
  }

  protected send(): void {
    const text = this.draft().trim();
    if (!text || this.isSending()) return;

    const history = [...this.messages(), { role: 'user' as const, content: text }];
    this.messages.set(history);
    this.draft.set('');
    this.isSending.set(true);
    this.scrollToBottom();

    this.chatApi.sendMessage(history).subscribe({
      next: (reply) => {
        this.messages.update((msgs) => [...msgs, { role: 'assistant', content: reply }]);
        this.isSending.set(false);
        this.scrollToBottom();
      },
      error: () => {
        this.messages.update((msgs) => [
          ...msgs,
          { role: 'assistant', content: this.transloco.translate('chat.error') },
        ]);
        this.isSending.set(false);
        this.scrollToBottom();
      },
    });
  }

  private scrollToBottom(): void {
    queueMicrotask(() => {
      this.scrollAnchor()?.nativeElement.scrollIntoView({ behavior: 'smooth' });
    });
  }
}
AHRAM_EOF_20
echo "  wrote: src/app/shared/ui/chat-widget/chat-widget.component.ts"

mkdir -p "src/app/shared/ui/chat-widget"
cat > "src/app/shared/ui/chat-widget/chat-widget.component.html" << 'AHRAM_EOF_21'
<div *transloco="let t">
  <!-- Floating toggle button -->
  <button
    type="button"
    (click)="toggle()"
    [attr.aria-label]="isOpen() ? t('chat.close') : t('chat.open')"
    [attr.aria-expanded]="isOpen()"
    class="chat-fab"
  >
    @if (isOpen()) {
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    } @else {
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8-1.17 0-2.29-.2-3.31-.55L3 21l1.61-4.03A7.86 7.86 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    }
  </button>

  <!-- Chat panel -->
  @if (isOpen()) {
    <div class="chat-panel" role="dialog" [attr.aria-label]="t('chat.title')">
      <div class="chat-panel-header">
        <span class="font-display font-bold">{{ t('chat.title') }}</span>
        <button type="button" (click)="close()" [attr.aria-label]="t('chat.close')" class="opacity-80 transition-opacity hover:opacity-100">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div class="chat-panel-body">
        @for (msg of messages(); track $index) {
          @if (msg.content) {
            <div class="chat-bubble-row" [class.chat-bubble-row-user]="msg.role === 'user'">
              <div class="chat-bubble" [class.chat-bubble-user]="msg.role === 'user'">{{ msg.content }}</div>
            </div>
          }
        }
        @if (isSending()) {
          <div class="chat-bubble-row">
            <div class="chat-bubble chat-bubble-typing">{{ t('chat.typing') }}</div>
          </div>
        }
        <div #scrollAnchor></div>
      </div>

      <form class="chat-panel-footer" (submit)="$event.preventDefault(); send()">
        <input
          type="text"
          [ngModel]="draft()"
          (ngModelChange)="onDraftInput($event)"
          name="chatMessage"
          [placeholder]="t('chat.placeholder')"
          [attr.aria-label]="t('chat.placeholder')"
          autocomplete="off"
          class="chat-input"
        />
        <button type="submit" [disabled]="isSending() || !draft().trim()" [attr.aria-label]="t('chat.send')" class="chat-send-btn">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 rtl:-scale-x-100" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </form>
    </div>
  }
</div>
AHRAM_EOF_21
echo "  wrote: src/app/shared/ui/chat-widget/chat-widget.component.html"

mkdir -p "src/app/shared/ui/chat-widget"
cat > "src/app/shared/ui/chat-widget/chat-widget.component.scss" << 'AHRAM_EOF_22'
:host {
  display: block;
}

.chat-fab {
  position: fixed;
  bottom: 1.5rem;
  inset-inline-start: 1.5rem;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 9999px;
  background-color: var(--color-primary);
  color: var(--color-primary-foreground);
  box-shadow:
    0 10px 15px -3px rgb(0 0 0 / 0.15),
    0 4px 6px -4px rgb(0 0 0 / 0.1);
  transition: transform 0.2s;

  &:hover {
    transform: scale(1.08);
  }

  &:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }
}

.chat-panel {
  position: fixed;
  bottom: 5.5rem;
  inset-inline-start: 1.5rem;
  z-index: 50;
  display: flex;
  flex-direction: column;
  width: min(360px, calc(100vw - 2rem));
  height: min(480px, calc(100vh - 8rem));
  overflow: hidden;
  border-radius: 1rem;
  border: 1px solid var(--color-border);
  background: var(--color-card);
  box-shadow:
    0 20px 25px -5px rgb(0 0 0 / 0.15),
    0 8px 10px -6px rgb(0 0 0 / 0.1);
}

.chat-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.9rem 1.1rem;
  background: var(--color-primary);
  color: var(--color-primary-foreground);
}

.chat-panel-body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 0.6rem;
  overflow-y: auto;
  padding: 1rem;
}

.chat-bubble-row {
  display: flex;
  justify-content: flex-start;
}

.chat-bubble-row-user {
  justify-content: flex-end;
}

.chat-bubble {
  max-width: 82%;
  border-radius: 0.9rem;
  background: var(--color-muted);
  color: var(--color-foreground);
  padding: 0.55rem 0.85rem;
  font-size: 0.875rem;
  line-height: 1.5;
  white-space: pre-wrap;
}

.chat-bubble-user {
  background: var(--color-primary);
  color: var(--color-primary-foreground);
}

.chat-bubble-typing {
  font-style: italic;
  opacity: 0.7;
}

.chat-panel-footer {
  display: flex;
  gap: 0.5rem;
  border-top: 1px solid var(--color-border);
  padding: 0.75rem;
}

.chat-input {
  flex: 1;
  border-radius: 0.6rem;
  border: 1px solid var(--color-border);
  background: var(--color-background);
  padding: 0.5rem 0.8rem;
  font-size: 0.875rem;
  outline: none;

  &:focus {
    border-color: var(--color-primary);
  }
}

.chat-send-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.4rem;
  height: 2.4rem;
  flex-shrink: 0;
  border-radius: 0.6rem;
  background: var(--color-primary);
  color: var(--color-primary-foreground);
  transition: opacity 0.15s;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

@media (max-width: 640px) {
  .chat-fab {
    bottom: 1.25rem;
  }

  .chat-panel {
    bottom: 5rem;
  }
}
AHRAM_EOF_22
echo "  wrote: src/app/shared/ui/chat-widget/chat-widget.component.scss"

mkdir -p "src/app/shared/ui"
cat > "src/app/shared/ui/index.ts" << 'AHRAM_EOF_23'
export { BreadcrumbsComponent } from './breadcrumbs/breadcrumbs.component';
export type { BreadcrumbItem } from './breadcrumbs/breadcrumbs.component';
export { ButtonComponent } from './button/button.component';
export { CardComponent } from './card/card.component';
export { InputComponent } from './input/input.component';
export { LoadingSpinnerComponent } from './loading-spinner/loading-spinner.component';
export { WhatsappButtonComponent } from './whatsapp-button/whatsapp-button.component';
export { CallButtonComponent } from './call-button/call-button.component';
export { FacebookButtonComponent } from './facebook-button/facebook-button.component';
export { ContactFormComponent } from './contact-form/contact-form.component';
export { InstallmentCalculatorComponent } from './installment-calculator/installment-calculator.component';
export { NewsletterComponent } from './newsletter/newsletter.component';
export { FaqAccordionComponent } from './faq-accordion/faq-accordion.component';
export { ChatWidgetComponent } from './chat-widget/chat-widget.component';
AHRAM_EOF_23
echo "  wrote: src/app/shared/ui/index.ts"

mkdir -p "src/assets/i18n"
cat > "src/assets/i18n/ar.json" << 'AHRAM_EOF_24'
{
  "app": {
    "name": "الأهرام للتطوير العقاري",
    "description": "شركة رائدة في مجال التطوير العقاري في مصر",
    "tagline": "نبني المستقبل بأيدٍ أمينة"
  },
  "header": {
    "home": "الرئيسية",
    "about": "من نحن",
    "projects": "مشاريعنا",
    "contact": "تواصل معنا",
    "gallery": "معرض الصور",
    "tagline": "نبني المستقبل بأيدٍ أمينة",
    "toggleTheme": "تبديل المظهر",
    "toggleLanguage": "EN — تغيير اللغة إلى الإنجليزية",
    "login": "تسجيل الدخول",
    "blog": "المدونة",
    "paymentPlans": "خطط السداد",
    "constructionUpdates": "تحديثات البناء",
    "sadatGuide": "دليل مدينة السادات",
    "sadatMaps": "خرائط مدينة السادات",
    "investors": "للمستثمرين",
    "units": "الوحدات"
  },
  "nav": {
    "menu": "القائمة",
    "close": "إغلاق القائمة"
  },
  "footer": {
    "rights": "جميع الحقوق محفوظة.",
    "privacy": "سياسة الخصوصية",
    "terms": "الشروط والأحكام",
    "contact": "اتصل بنا",
    "company": "عن الشركة",
    "companyDescription": "الأهرام للتطوير العقاري — شركة رائدة في مجال التطوير العقاري بمدينة السادات، نلتزم بتقديم مشاريع سكنية متميزة بأعلى معايير الجودة.",
    "quickLinks": "روابط سريعة",
    "resources": "المزيد",
    "contactInfo": "تواصل معنا",
    "address": "مدينة السادات، المنوفية، مصر",
    "phone": "01031198677",
    "whatsapp": "واتساب",
    "email": "info@alahram-developments.com",
    "designedWith": "صُمم بثقة وإتقان"
  },
  "whatsapp": {
    "tooltip": "تواصل معنا عبر واتساب",
    "prefilledMessage": "مرحباً، أرغب في الاستفسار عن مشاريعكم العقارية."
  },
  "call": {
    "tooltip": "اتصل بنا الآن"
  },
  "facebook": {
    "tooltip": "تابعنا على فيسبوك"
  },
  "notFound": {
    "title": "الصفحة غير موجودة",
    "description": "عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها.",
    "backHome": "العودة للرئيسية"
  },
  "common": {
    "loading": "جاري التحميل...",
    "error": "حدث خطأ",
    "retry": "إعادة المحاولة",
    "save": "حفظ",
    "cancel": "إلغاء",
    "delete": "حذف",
    "edit": "تعديل",
    "search": "بحث",
    "filter": "تصفية",
    "noResults": "لا توجد نتائج",
    "confirm": "تأكيد",
    "back": "رجوع",
    "next": "التالي",
    "previous": "السابق",
    "submit": "إرسال",
    "close": "إغلاق",
    "yes": "نعم",
    "no": "لا"
  },
  "validation": {
    "required": "هذا الحقل مطلوب",
    "email": "البريد الإلكتروني غير صحيح",
    "minLength": "يجب أن يكون على الأقل {{min}} أحرف",
    "maxLength": "يجب ألا يتجاوز {{max}} أحرف",
    "phone": "رقم الهاتف غير صحيح",
    "mismatch": "القيمتان غير متطابقتين"
  },
  "home": {
    "hero": {
      "eyebrow": "تطوير عقاري راقٍ في مدينة السادات",
      "title": "الأهرام للتطوير والاستثمار العقاري",
      "subtitle": "نبني مستقبلك بأيدٍ أمينة في قلب مدينة السادات",
      "browseProjects": "تصفح المشاريع",
      "contactUs": "تواصل معنا",
      "imageAlt": "مشروعات الأهرام للتطوير العقاري في مدينة السادات"
    },
    "trustBar": {
      "eyebrow": "الأهرام بالأرقام",
      "projects": "مشاريع متميزة",
      "units": "وحدة سكنية",
      "years": "سنوات خبرة"
    },
    "brandStory": {
      "eyebrow": "قصتنا",
      "title": "نبني أكثر من مجرد منازل",
      "paragraph1": "تأسست شركة الأهرام للتطوير والاستثمار العقاري بهدف توفير مسكن راقٍ لكل عائلة مصرية. نجمع بين الجودة العالية والأسعار العادلة في قلب مدينة السادات — إحدى أكثر المناطق واعدةً في مصر.",
      "paragraph2": "نؤمن بأن كل عائلة تستحق منزلاً يجمعها بالأمان والراحة. لذا نحرص على الالتزام بأعلى معايير الجودة وأقصى درجات الشفافية في التعامل.",
      "cta": "تعرّف علينا أكثر",
      "imageAlt": "مشروع الأهرام للتطوير العقاري في مدينة السادات",
      "logoAlt": "شعار الأهرام للتطوير العقاري",
      "highlights": {
        "founded": {
          "value": "٢٠١٩",
          "label": "سنة التأسيس"
        },
        "city": {
          "value": "السادات",
          "label": "مدينتنا"
        },
        "mission": {
          "value": "٢٠+",
          "label": "مشروعاً منجزاً"
        }
      }
    },
    "zones": {
      "eyebrow": "اختر منطقتك",
      "title": "استكشف مناطق مشاريعنا مدينة السادات",
      "subtitle": "تمتلك الأهرام مشاريع في أرقى مناطق مدينة السادات — اختر المنطقة التي تناسبك واستكشف مشاريعنا السكنية المتميزة فيها",
      "viewAll": "عرض جميع المناطق",
      "cardCta": "تصفح المشاريع في {{zone}}"
    },
    "mosaic": {
      "eyebrow": "مشاريعنا",
      "title": "مشاريع تتحدث عن نفسها",
      "subtitle": "اكتشف مجموعة مشاريعنا السكنية المتميزة في أفضل المواقع بمدينة السادات",
      "viewAll": "تصفح كل المشاريع",
      "project29": "مشروع 29",
      "project137": "مشروع 137",
      "project255": "مشروع 255",
      "project336": "مشروع 336",
      "project348": "مشروع 348",
      "project584": "مشروع 584",
      "project629": "مشروع 629"
    },
    "lifestyle": {
      "eyebrow": "حياة متكاملة",
      "title": "كل ما تحتاجه بجوارك",
      "subtitle": "مدينة السادات توفر لعائلتك بيئة سكنية متكاملة — مدارس، حدائق، خدمات، وأمان",
      "schools": {
        "title": "مدارس ومعاهد",
        "description": "مؤسسات تعليمية متنوعة على مقربة من مشاريعنا"
      },
      "parks": {
        "title": "حدائق ومتنزهات",
        "description": "مساحات خضراء للاسترخاء والترفيه العائلي"
      },
      "transit": {
        "title": "مواصلات سهلة",
        "description": "ربط مباشر بالطرق الرئيسية والمناطق المحيطة"
      },
      "security": {
        "title": "أمان وحراسة",
        "description": "منطقة سكنية آمنة مع خدمات حراسة على مدار الساعة"
      },
      "retail": {
        "title": "تسوق وخدمات",
        "description": "مراكز تجارية ومحلات الخدمات اليومية في متناول يدك"
      }
    },
    "projects": {
      "title": "مشاريعنا المتميزة",
      "subtitle": "اكتشف أحدث مشاريعنا السكنية في أفضل المواقع بمدينة السادات",
      "viewDetails": "عرض التفاصيل",
      "project865": {
        "name": "مشروع 865",
        "description": "مشروع سكني متميز في المنطقة الذهبية بمدينة السادات",
        "location": "المنطقة الذهبية، مدينة السادات",
        "status": "جاري التنفيذ"
      },
      "project868": {
        "name": "مشروع 868",
        "description": "وحدات سكنية فاخرة بتصميمات عصرية وتشطيبات عالية الجودة",
        "location": "المنطقة الذهبية، مدينة السادات",
        "status": "جاري التنفيذ"
      },
      "project76": {
        "name": "مشروع 76",
        "description": "مشروع سكني متكامل بمساحات متنوعة تناسب جميع الاحتياجات",
        "location": "مدينة السادات",
        "status": "متاح للحجز"
      }
    },
    "whyUs": {
      "eyebrow": "ميزتنا التنافسية",
      "title": "لماذا الأهرام؟",
      "subtitle": "مشاريع متميزة - أعلى معايير الجودة - شفافية تامة - السعر العادل",
      "trust": {
        "title": "ثقة وأمان",
        "description": "سجل حافل بالمشاريع الناجحة وثقة العملاء منذ سنوات"
      },
      "transparency": {
        "title": "شفافية كاملة",
        "description": "تعاملات واضحة وعقود موثقة تضمن حقوقك"
      },
      "pricing": {
        "title": "السعر العادل",
        "description": "اعلي قيمة عقارية مقابل اقل سعر في السوق العقاري"
      },
      "safety": {
        "title": "استثمار آمن",
        "description": "مواقع استراتيجية في مدينة السادات تضمن عائد استثماري مرتفع"
      }
    },
    "gallery": {
      "eyebrow": "مشاريعنا بالصور",
      "title": "صور من تحديثات البناء",
      "subtitle": "شاهد أحدث صور مشاريعنا ومراحل التنفيذ",
      "viewMore": "عرض المزيد"
    },
    "testimonials": {
      "title": "آراء عملائنا",
      "subtitle": "تجارب حقيقية من عملاء وثقوا بنا",
      "verifiedCustomer": "عميل موثق"
    },
    "cta": {
      "eyebrow": "ابدأ رحلتك",
      "title": "احجز وحدتك الآن",
      "subtitle": "تواصل معنا اليوم واحصل على أفضل العروض والتسهيلات",
      "whatsapp": "تواصل عبر واتساب",
      "call": "اتصل بنا"
    },
    "location": {
      "eyebrow": "موقعنا",
      "title": "تجدنا هنا",
      "subtitle": "نتواجد في قلب مدينة السادات ",
      "address": "دار مصر مول، مدينة السادات، المنوفية، مصر",
      "addressLabel": "العنوان",
      "phoneLabel": "الهاتف",
      "directions": "احصل على الاتجاهات",
      "mapTitle": "موقع الأهرام للتطوير العقاري",
      "mapLoading": "جاري تحميل الخريطة..."
    }
  },
  "zones": {
    "eyebrow": "تصفح حسب الموقع",
    "hero": {
      "eyebrow": "استكشف المشاريع"
    },
    "projects": {
      "eyebrow": "المشاريع المتاحة",
      "title": "مشاريع في هذه المنطقة"
    },
    "title": "مناطق المشاريع",
    "subtitle": "استكشف مشاريعنا السكنية في مختلف مناطق مدينة السادات",
    "projectsCount": "{{count}} مشاريع",
    "projectCount_one": "مشروع واحد",
    "projectCount_other": "{{count}} مشاريع",
    "browseZone": "تصفح المشاريع",
    "backToZones": "العودة للمناطق",
    "zoneProjects": "مشاريع {{zone}}",
    "zone7Strip": {
      "name": "المنطقة السابعة (الشريط المميز)",
      "description": "مشاريع سكنية راقية في الشريط المميز بالمنطقة السابعة"
    },
    "zone7Homeland": {
      "name": "المنطقة السابعة (بيت الوطن)",
      "description": "مشاريع بيت الوطن في المنطقة السابعة بمدينة السادات"
    },
    "zone14": {
      "name": "المنطقة 14",
      "description": "مشاريع سكنية متنوعة في المنطقة 14 بمدينة السادات"
    },
    "zone21": {
      "name": "المنطقة ٢١ (المنطقة الذهبية)",
      "description": "أكبر مناطقنا — 10 مشاريع في قلب المنطقة الذهبية بمدينة السادات"
    },
    "zone22": {
      "name": "المنطقة ٢٢",
      "description": "مشاريع سكنية متميزة في المنطقة ٢٢ بمدينة السادات"
    },
    "zone29": {
      "name": "المنطقة ٢٩",
      "description": "مشاريع سكنية في المنطقة ٢٩ بمدينة السادات"
    },
    "alRawda": {
      "name": "منطقة الروضة",
      "description": "مشاريع سكنية في منطقة الروضة المتميزة بمدينة السادات"
    },
    "zone35": {
      "name": "المنطقة ٣٥",
      "description": "مشاريع سكنية جديدة في المنطقة ٣٥ بمدينة السادات"
    }
  },
  "projects": {
    "overview": {
      "eyebrow": "تفاصيل المشروع",
      "title": "نظرة عامة"
    },
    "phasesEyebrow": "متابعة التقدم",
    "galleryEyebrow": "جولة بصرية",
    "masterPlanEyebrow": "تصميم المشروع",
    "masterPlanTitle": "المخطط الرئيسي",
    "locationEyebrow": "الموقع",
    "title": "مشاريعنا",
    "subtitle": "استكشف جميع مشاريعنا السكنية المتميزة في أفضل المواقع بمدينة السادات",
    "viewDetails": "عرض التفاصيل",
    "backToProjects": "العودة للمشاريع",
    "backToZone": "العودة لمشاريع المنطقة",
    "progress": "نسبة الإنجاز",
    "lastUpdated": "آخر تحديث",
    "unitTypesTitle": "الوحدات المتاحة",
    "sqm": "م²",
    "amenitiesTitle": "المرافق والخدمات",
    "galleryTitle": "معرض الصور",
    "phasesTitle": "مراحل التنفيذ",
    "phasesSubtitle": "تابع نسبة إنجاز المشروع ومراحل التنفيذ أولاً بأول",
    "locationTitle": "الموقع على الخريطة",
    "cta": {
      "eyebrow": "احجز وحدتك",
      "title": "احجز وحدتك الآن",
      "subtitle": "تواصل معنا اليوم واحصل على أفضل الأسعار وخطط السداد المرنة",
      "whatsapp": "تواصل عبر واتساب",
      "call": "اتصل بنا"
    },
    "unitTypes": {
      "apartment": "شقة",
      "duplex": "دوبلكس",
      "penthouse": "بنتهاوس"
    },
    "amenities": {
      "parking": "جراج سيارات",
      "garden": "حدائق ومساحات خضراء",
      "security": "أمن وحراسة 24/7",
      "elevator": "مصاعد",
      "playground": "منطقة ألعاب أطفال",
      "mosque": "مسجد",
      "commercialArea": "منطقة تجارية",
      "wideStreets": "شوارع واسعة"
    },
    "project865": {
      "name": "مشروع 865",
      "description": "مشروع سكني متميز في المنطقة الذهبية بمدينة السادات",
      "statusDescription": "مشروع 865 هو مشروع سكني متميز يقع في قلب المنطقة الذهبية بمدينة السادات. يتميز المشروع بتصميمات معمارية عصرية وتشطيبات عالية الجودة، مع مساحات متنوعة تناسب جميع الاحتياجات. يوفر المشروع بيئة سكنية متكاملة مع كافة المرافق والخدمات التي تضمن لك ولعائلتك حياة مريحة وآمنة.",
      "location": "المنطقة الذهبية، مدينة السادات",
      "status": "جاري التنفيذ",
      "price120": "تبدأ من 850,000 جنيه",
      "price150": "تبدأ من 1,050,000 جنيه",
      "price200": "تبدأ من 1,400,000 جنيه"
    },
    "project868": {
      "name": "مشروع 868",
      "description": "وحدات سكنية فاخرة بتصميمات عصرية وتشطيبات عالية الجودة",
      "statusDescription": "مشروع 868 يقدم وحدات سكنية فاخرة بتصميمات عصرية في المنطقة الذهبية بمدينة السادات. يتميز المشروع بتشطيبات سوبر لوكس ومساحات واسعة مع إطلالات مميزة. يضم المشروع منطقة تجارية متكاملة ومرافق خدمية متنوعة تلبي جميع احتياجاتك اليومية.",
      "location": "المنطقة الذهبية، مدينة السادات",
      "status": "جاري التنفيذ",
      "price130": "تبدأ من 920,000 جنيه",
      "price160": "تبدأ من 1,150,000 جنيه",
      "price220": "تبدأ من 1,600,000 جنيه"
    },
    "project76": {
      "name": "مشروع 76",
      "description": "مشروع سكني متكامل بمساحات متنوعة تناسب جميع الاحتياجات",
      "statusDescription": "مشروع 76 هو مشروع سكني متكامل يقع في موقع استراتيجي بمدينة السادات. يوفر المشروع مساحات متنوعة تبدأ من 100 متر مربع مع تصميمات ذكية تستغل كل متر. يتميز المشروع بشوارع واسعة ومساحات خضراء وكافة الخدمات الأساسية التي تجعله الاختيار الأمثل للعائلات.",
      "location": "منطقة الروضة، مدينة السادات",
      "status": "جاري التنفيذ",
      "price100": "تبدأ من 700,000 جنيه",
      "price140": "تبدأ من 980,000 جنيه",
      "price180": "تبدأ من 1,250,000 جنيه"
    },
    "project255": {
      "name": "مشروع 255",
      "description": "مشروع سكني راقي في الشريط المميز بالمنطقة السابعة",
      "location": "المنطقة السابعة، الشريط المميز",
      "status": "جاري التنفيذ"
    },
    "project29": {
      "name": "مشروع 29",
      "description": "مشروع سكني في بيت الوطن بالمنطقة السابعة",
      "location": "المنطقة السابعة، بيت الوطن",
      "status": "جاري التنفيذ"
    },
    "project336": {
      "name": "مشروع 336",
      "description": "مشروع سكني تم تسليمه بالكامل في المنطقة 14",
      "location": "المنطقة 14، مدينة السادات",
      "status": "تم التسليم"
    },
    "project331": {
      "name": "مشروع 331",
      "description": "مشروع سكني تم تسليمه بالكامل في المنطقة 14",
      "location": "المنطقة 14، مدينة السادات",
      "status": "تم التسليم"
    },
    "project348": {
      "name": "مشروع 348",
      "description": "مشروع سكني جاري التنفيذ في المنطقة 14",
      "location": "المنطقة 14، مدينة السادات",
      "status": "جاري التنفيذ"
    },
    "miniCompound": {
      "name": "ميني كومباوند الأهرام (593، 594، 595)",
      "description": "ميني كومباوند متكامل الخدمات في المنطقة الذهبية بمدينة السادات",
      "location": "المنطقة ٢١، مدينة السادات",
      "status": "قرب التسليم"
    },
    "project629": {
      "name": "مشروع 629",
      "description": "مشروع سكني متميز في المنطقة الذهبية قرب التسليم",
      "location": "المنطقة ٢١، مدينة السادات",
      "status": "قرب التسليم"
    },
    "project584": {
      "name": "مشروع 584",
      "description": "مشروع سكني متميز في المنطقة الذهبية بمدينة السادات",
      "location": "المنطقة ٢١، مدينة السادات",
      "status": "جاري التنفيذ"
    },
    "project947": {
      "name": "مشروع 947",
      "description": "مشروع سكني في المنطقة الذهبية بمدينة السادات",
      "location": "المنطقة ٢١، مدينة السادات",
      "status": "جاري التنفيذ"
    },
    "project791": {
      "name": "مشروع 791",
      "description": "مشروع سكني جاري التنفيذ في المنطقة الذهبية",
      "location": "المنطقة ٢١، مدينة السادات",
      "status": "جاري التنفيذ"
    },
    "project794": {
      "name": "مشروع 794",
      "description": "مشروع سكني جديد في المنطقة الذهبية بمدينة السادات",
      "location": "المنطقة ٢١، مدينة السادات",
      "status": "جاري التنفيذ"
    },
    "project799": {
      "name": "مشروع 799",
      "description": "مشروع سكني جديد في المنطقة الذهبية بمدينة السادات",
      "location": "المنطقة ٢١، مدينة السادات",
      "status": "جاري التنفيذ"
    },
    "project870": {
      "name": "مشروع 870",
      "description": "مشروع سكني جاري إصدار ترخيص الإنشاءات",
      "location": "المنطقة ٢١، مدينة السادات",
      "status": "جاري إصدار ترخيص الإنشاءات"
    },
    "project1102": {
      "name": "مشروع 1102",
      "description": "مشروع سكني متميز في المنطقة ٢٢ بمدينة السادات",
      "location": "المنطقة ٢٢، مدينة السادات",
      "status": "جاري التنفيذ"
    },
    "project1290": {
      "name": "مشروع 1290",
      "description": "مشروع سكني تم تسليمه بالكامل في المنطقة ٢٩",
      "location": "المنطقة ٢٩، مدينة السادات",
      "status": "تم التسليم"
    },
    "project94": {
      "name": "مشروع 94",
      "description": "مشروع سكني جاري التنفيذ في منطقة الروضة بمدينة السادات",
      "location": "منطقة الروضة، مدينة السادات",
      "status": "جاري التنفيذ"
    },
    "project137": {
      "name": "مشروع 137",
      "description": "مشروع سكني متميز في المنطقة ٣٥ بمدينة السادات",
      "location": "المنطقة ٣٥، مدينة السادات",
      "status": "جاري التنفيذ"
    },
    "relatedTitle": "مشاريع أخرى في نفس المنطقة"
  },
  "about": {
    "hero": {
      "eyebrow": "شركتنا",
      "title": "من نحن — الأهرام للتطوير العقاري",
      "subtitle": "نبني مجتمعات سكنية متميزة في قلب مدينة السادات منذ أكثر من 5 سنوات"
    },
    "story": {
      "eyebrow": "مسيرتنا",
      "title": "قصتنا",
      "paragraph1": "تأسست شركة الأهرام للتطوير والاستثمار العقاري بهدف تقديم مشاريع سكنية متميزة تجمع بين الجودة العالية والأسعار المناسبة. منذ انطلاقتنا، ونحن نعمل على تطوير مشاريع سكنية في المنطقة الذهبية بمدينة السادات، وهي واحدة من أكثر المناطق الواعدة في مصر.",
      "paragraph2": "نؤمن بأن كل عائلة تستحق منزلاً يوفر لها الراحة والأمان. لذلك نحرص على تقديم وحدات سكنية بتصميمات عصرية وتشطيبات عالية الجودة، مع توفير كافة المرافق والخدمات التي تضمن حياة مريحة ومستقرة."
    },
    "mission": {
      "eyebrow": "القيم والغاية",
      "sectionTitle": "رسالتنا ورؤيتنا",
      "title": "مهمتنا",
      "description": "تقديم مشاريع سكنية عالية الجودة بأسعار تنافسية، مع الالتزام بأعلى معايير الشفافية والنزاهة في التعامل مع عملائنا، لنكون الخيار الأول للعائلات الباحثة عن منزل أحلامها في مدينة السادات."
    },
    "vision": {
      "title": "رؤيتنا",
      "description": "أن نكون الشركة الرائدة في التطوير العقاري بمدينة السادات، من خلال بناء مجتمعات سكنية متكاملة تجمع بين التصميم العصري والاستدامة، وتساهم في رفع مستوى المعيشة لسكان المدينة."
    },
    "stats": {
      "projects": "مشاريع متميزة",
      "units": "وحدة سكنية",
      "years": "سنوات خبرة",
      "clients": "عميل سعيد"
    },
    "values": {
      "eyebrow": "مبادئنا الأساسية",
      "title": "قيمنا",
      "subtitle": "المبادئ التي توجه عملنا في كل مشروع",
      "quality": {
        "title": "الجودة",
        "description": "نلتزم بأعلى معايير البناء والتشطيب في جميع مشاريعنا لضمان رضا العملاء"
      },
      "integrity": {
        "title": "النزاهة",
        "description": "نتعامل بشفافية كاملة مع عملائنا من خلال عقود واضحة وتسعير عادل"
      },
      "innovation": {
        "title": "الابتكار",
        "description": "نوظف أحدث التصميمات المعمارية والتقنيات لتقديم وحدات سكنية عصرية ومريحة"
      },
      "customer": {
        "title": "خدمة العملاء",
        "description": "نضع رضا العملاء في صدارة أولوياتنا ونقدم دعماً متواصلاً قبل وبعد البيع"
      }
    },
    "cta": {
      "eyebrow": "ابدأ الآن",
      "title": "ابدأ رحلتك معنا",
      "subtitle": "تواصل معنا اليوم واكتشف مشاريعنا السكنية المتميزة في مدينة السادات",
      "whatsapp": "تواصل عبر واتساب",
      "call": "اتصل بنا"
    }
  },
  "contact": {
    "hero": {
      "eyebrow": "تواصل معنا",
      "title": "تواصل معنا",
      "subtitle": "نحن هنا لمساعدتك — تواصل معنا بأي طريقة تناسبك"
    },
    "info": {
      "phone": {
        "label": "اتصل بنا"
      },
      "whatsapp": {
        "label": "واتساب"
      },
      "email": {
        "label": "البريد الإلكتروني"
      }
    },
    "form": {
      "eyebrow": "راسلنا",
      "title": "أرسل لنا رسالة",
      "subtitle": "املأ النموذج وسنتواصل معك في أقرب وقت",
      "name": "الاسم الكامل",
      "namePlaceholder": "أدخل اسمك الكامل",
      "phone": "رقم الهاتف",
      "phonePlaceholder": "01xxxxxxxxx",
      "message": "الرسالة",
      "messagePlaceholder": "اكتب رسالتك هنا...",
      "submit": "إرسال الرسالة",
      "successTitle": "تم إرسال رسالتك بنجاح!",
      "successMessage": "شكراً لتواصلك معنا. سنرد عليك في أقرب وقت ممكن.",
      "sendAnother": "إرسال رسالة أخرى",
      "error": "حدث خطأ أثناء الإرسال. حاول مرة أخرى."
    },
    "map": {
      "title": "موقع الأهرام للتطوير العقاري",
      "loading": "جاري تحميل الخريطة...",
      "address": "دار مصر مول، مدينة السادات، المنوفية، مصر"
    },
    "cta": {
      "title": "نسعد بتواصلك معنا",
      "subtitle": "فريقنا جاهز للإجابة على جميع استفساراتك حول مشاريعنا السكنية",
      "whatsapp": "تواصل عبر واتساب",
      "call": "اتصل بنا"
    }
  },
  "gallery": {
    "hero": {
      "eyebrow": "أعمالنا",
      "title": "معرض الصور",
      "subtitle": "شاهد أحدث صور مشاريعنا ومراحل التنفيذ في مدينة السادات"
    },
    "filters": {
      "all": "الكل",
      "renders": "التصميمات التصورية للمشاريع",
      "selectProject": "تصفية بالمشروع...",
      "project865": "مشروع 865",
      "project868": "مشروع 868",
      "project76": "مشروع 76"
    },
    "alt": {
      "project865": "صورة من مشروع 865",
      "project868": "صورة من مشروع 868",
      "project76": "صورة من مشروع 76"
    }
  },
  "blog": {
    "hero": {
      "eyebrow": "أحدث المقالات",
      "title": "المدونة",
      "subtitle": "أحدث المقالات والأخبار حول سوق العقارات ومشاريعنا"
    },
    "filters": {
      "all": "الكل",
      "companyNews": "أخبار الشركة",
      "marketInsights": "رؤى السوق",
      "investmentTips": "نصائح الاستثمار"
    },
    "readMore": "اقرأ المزيد",
    "backToBlog": "العودة للمدونة",
    "share": "مشاركة المقال",
    "recentPosts": "مقالات حديثة",
    "readingTime": "{{ minutes }} دقيقة قراءة",
    "posts": {
      "post1": {
        "title": "مدينة السادات 2026: نظرة شاملة على مدينة المستقبل",
        "excerpt": "تعرف على مدينة السادات وأبرز مناطقها وخدماتها وأسباب تحوّلها إلى وجهة استثمارية رائدة في مصر",
        "content1": "مدينة السادات مدينة مخططة تقع في محافظة منوفية على بُعد نحو 90 كيلومتراً شمال غرب القاهرة، تربطها بالعاصمة طريق القاهرة-الإسكندرية الصحراوي بسهولة تامة. أُسِّست في سبعينيات القرن الماضي لتخفيف الضغط عن القاهرة، وباتت اليوم واحدة من أكثر المدن الجديدة نمواً وحيوية في مصر.",
        "content2": "تضم المدينة أحياء سكنية متنوعة تمتد عبر مناطق مرقّمة بدءاً من المنطقة الأولى وحتى المنطقة الحادية والعشرين، إلى جانب مناطق صناعية ضخمة تستوعب المئات من المصانع والشركات. هذا التوازن بين السكن والصناعة والخدمات يمنح المدينة استقراراً اقتصادياً يعكس قيمتها العقارية.",
        "content3": "في 2026، تشهد مدينة السادات طفرة عمرانية لافتة مع توسع المشاريع السكنية وتحديث شبكة الطرق والمرافق. الأهرام للتطوير العقاري رصدت هذا النمو مبكراً وأنشأت مشاريعها في أفضل مواقع المدينة لتوفر لعملائها استثماراً آمناً في المستقبل.",
        "content4": "شهدت البنية التحتية لمدينة السادات نضجاً ملحوظاً خلال العقد الماضي، إذ باتت المدينة تمتلك شبكة طرق داخلية مُرصَّفة بالكامل، وشبكة كهرباء موثوقة تخدم المناطق الصناعية والسكنية على حدٍّ سواء، فضلاً عن تغطية واسعة بشبكات الغاز الطبيعي. واستثمارات مستمرة في معالجة المياه وتوصيل شبكات الألياف الضوئية تؤشّر على انتقال المدينة إلى تجمّع حضري متكامل ومكتفٍ بذاته.",
        "content5": "تتميز مدينة السادات بمنظومة خدمات شاملة ومتنامية تلبّي احتياجات السكان يومياً؛ فهي تضم مستشفيات خاصة وعيادات متخصصة، وسلاسل تجارية محلية ودولية، ومدارس تغطّي جميع المراحل التعليمية، وعدداً متزايداً من الجامعات الخاصة. هذه الكثافة من الخدمات تُقلّص الاعتماد اليومي على القاهرة وتُرسّخ الطلب القوي على الإيجار من شريحتَي الطلاب والمهنيين.",
        "content6": "يُقدّم الاستثمار في مدينة السادات اليوم معادلة مخاطر-عوائد من أكثر المعادلات جاذبيةً في السوق العقاري المصري؛ إذ لا تزال أسعار الأراضي والوحدات أقل بفارق ملحوظ من نظيراتها في القاهرة أو الإسكندرية، في حين ترتفع العوائد الإيجارية مع تصاعد الطلب من طلاب الجامعات والعمال والشباب المهني. تواصل الأهرام للتطوير العقاري اقتناء مواقع استراتيجية في أفضل أحياء المدينة، مُوفِّرةً هذه الميزة التنافسية مباشرةً للعملاء الذين يختارون الاستثمار الآن."
      },
      "post3": {
        "title": "المنطقة الذهبية بمدينة السادات: دليلك الكامل",
        "excerpt": "كل ما تحتاج معرفته عن المنطقة الذهبية — موقعها وخدماتها وأسباب تصدّرها قائمة أفضل مناطق الاستثمار",
        "content1": "تُعرف المنطقة 21 بمدينة السادات شعبياً بـ«المنطقة الذهبية» نظراً لموقعها المميز في قلب المدينة وقربها من الجامعات والمستشفيات والمراكز التجارية. تتميز شوارعها بالاتساع والتخطيط المنتظم مع وفرة من المساحات الخضراء التي ترفع جودة الحياة فيها.",
        "content2": "تحتضن المنطقة الذهبية عدداً من أبرز مشاريع الإسكان المتكاملة في مدينة السادات، وتستقطب شريحة واسعة من الأسر المتوسطة والمستثمرين الباحثين عن عوائد إيجارية مجزية. يرتفع الطلب على الوحدات السكنية فيها باستمرار بسبب القرب من مؤسسات التعليم العالي والمنطقة التكنولوجية.",
        "content3": "الأهرام للتطوير العقاري تمتلك حضوراً راسخاً في المنطقة الذهبية بمشاريع متعددة تلبي احتياجات مختلف شرائح العملاء. إذا كنت تفكر في الاستثمار أو السكن في قلب مدينة السادات، فالمنطقة الذهبية هي نقطة البداية الصحيحة.",
        "content4": "عند اختيار وحدة في المنطقة الذهبية بهدف الاستثمار، تبرز ثلاثة معايير جوهرية: طابق الوحدة، والقرب من الحرم الجامعي، وسهولة الوصول إلى الشوارع الرئيسية. تُحقق الوحدات التجارية في الدور الأرضي بالقرب من الجامعات أعلى عوائد إيجارية، في حين تستقطب شقق الطوابق العليا ذات الإضاءة الطبيعية الجيدة الأسر القادمة من القاهرة أو الإسكندرية. أما الوحدات الاستوديو والغرفة والصالة التي تتراوح مساحتها بين 60 و80 مترًا مربعًا، فهي الأسرع إشغالًا وتُعدّ الخيار الأمثل للمستثمر الساعي لتعظيم العائد.",
        "content5": "تتميز المنطقة الذهبية بتنوع ملحوظ في شريحة المستأجرين. يُشكّل طلاب الجامعات القادمون من المنوفية والجيزة والفيوم الشريحة المسيطرة، إذ يستأجرون وحدات صغيرة بعقود أكاديمية سنوية. أما المهنيون من المستوى المتوسط العاملون في المنطقة التكنولوجية والمناطق الصناعية المجاورة، فيفضلون شققًا بغرفتين بعقود أطول أمدًا. وتتنامى بالتوازي شريحة ثالثة من الساكنين الدائمين، وهم أسر انتقلت من القاهرة الكبرى بحثًا عن تكلفة معيشية أقل وبيئة أهدأ، ويُقبلون على الوحدات القريبة من المستشفيات والمدارس الدولية.",
        "content6": "تعتمد الأهرام للتطوير العقاري معايير انتقاء دقيقة داخل المنطقة الذهبية، إذ تُرجّح القطع الأرضية التي لا تبعد مشيًا عن جامعة واحدة على الأقل ومنشأة طبية وشارع خدمي رئيسي. يخدم هذا التموضع المقيمين والمستثمرين في آنٍ واحد، لأن الوحدات المتميزة الموقع تفرض إيجارًا أعلى وتحافظ على قيمة إعادة البيع بصورة أكثر ثباتًا مقارنة بوحدات مماثلة في شوارع هامشية. يستفيد المشتري الذي يختار مشاريع الأهرام في هذه المنطقة من عملية انتقاء المواقع التي كانت ستستدعي منه بحثًا مستقلًا مضنيًا."
      },
      "post4": {
        "title": "كيف تختار المطور العقاري المناسب؟ 7 معايير لا تتنازل عنها",
        "excerpt": "دليل عملي لتقييم المطورين العقاريين قبل الشراء وحماية حقوقك كمشترٍ في السوق المصري",
        "content1": "اختيار المطور العقاري المناسب لا يقل أهمية عن اختيار الوحدة ذاتها. أول المعايير التي يجب التحقق منها: سجل المطور في تسليم المشاريع السابقة في المواعيد المحددة، وجودة التنفيذ في مشاريعه المكتملة، ومدى وضوح العقود وخلوّها من البنود المبهمة.",
        "content2": "تحقق كذلك من ترخيص المطور لدى الجهات الرسمية كوزارة الإسكان وهيئة المجتمعات العمرانية الجديدة، ومن امتلاكه الأرض بعقد موثق. اطلب الاطلاع على تراخيص البناء وعقود الأرض قبل التوقيع، وتجنب الاعتماد على الوعود الشفهية وحدها.",
        "content3": "الأهرام للتطوير العقاري تعمل في مدينة السادات منذ سنوات بسجل واضح في التسليم والجودة. كل مشاريعنا مرخصة ومسجلة لدى الجهات المختصة، وعقودنا شفافة تحمي حقوق المشتري بالكامل. اسأل، تحقق، ثم اقرر.",
        "content4": "إلى جانب التراخيص والسجل التنفيذي، تحقّق من الوضع المالي للمطوّر. المطوّر ذو الملاءة الجيدة يموّل المراحل الأولى من البناء من موارده الذاتية قبل الاستعانة بدفعات المشترين، وهذا دليل على انضباط تشغيلي يحمي المشتري من توقّف المشروع بسبب أزمات السيولة. اسأل عن ترتيبات التمويل الخارجية، وتحقق من أن مدفوعاتك محمية في حساب مخصص للمشروع.",
        "content5": "لا تُغفل النظر في بنية خطة السداد؛ فالخطة الممتدة على ثلاث إلى سبع سنوات تُعدّ مستدامة في الغالب، في حين قد تكشف الخطط التي تمتد لعشر أو خمس عشرة سنة بأقساط زهيدة عن ديون اقتناء أراضٍ مرتفعة لا رغبةً حقيقية في تيسيرك. اقرأ كل بند بعناية، ولا سيما بنود غرامات التأخير في التسليم وحقوق إنهاء العقد وإجراءات تعديل الوحدة.",
        "content6": "وأخيراً، زُر المشاريع المُسلَّمة مسبقاً قبل أن تضع توقيعك على أي وثيقة. تجوّل داخل المباني القائمة، وتحدّث إلى السكان، وقيّم جودة البناء الفعلية من خلال مستوى التشطيب وصيانة المساحات المشتركة، فهي تحكي قصة أصدق بكثير من أي كتيب دعائي. الأهرام للتطوير العقاري تُرحّب بهذه الزيارات لأي من مجمعاتها المُسلَّمة في مدينة السادات، واثقةً في أن التجربة الميدانية ستتكلم عن نفسها."
      },
      "post5": {
        "title": "المنطقة 14 بمدينة السادات: فرصة استثمارية في طور النضج",
        "excerpt": "تعرف على خصائص المنطقة 14 وأسباب اهتمام المستثمرين بها كموقع واعد ذي أسعار تنافسية",
        "content1": "تقع المنطقة 14 في الجزء الغربي من مدينة السادات وتشهد توسعاً عمرانياً ملحوظاً خلال السنوات الأخيرة. تمتاز بأسعارها التي لا تزال تنافسية قياساً بالمنطقة الذهبية، مما يجعلها خياراً جذاباً للمستثمر الباحث عن عوائد مرتفعة على المدى المتوسط.",
        "content2": "تتوفر في المنطقة 14 خدمات أساسية جيدة من مدارس حكومية وخاصة ومراكز صحية ومحلات تجارية. مع استمرار مشاريع البنية التحتية الجديدة في المنطقة، يتوقع خبراء العقارات أن تشهد أسعارها ارتفاعاً ملموساً خلال الثلاث سنوات القادمة.",
        "content3": "للمستثمر الذي يبحث عن نقطة دخول مناسبة قبل ارتفاع الأسعار، تمثل المنطقة 14 فرصة حقيقية. الأهرام للتطوير العقاري تتابع عن كثب التطورات في مختلف مناطق مدينة السادات وتقدم لعملائها مشورة استثمارية مبنية على بيانات حقيقية.",
        "content4": "تصبح المنطقة الناشئة نقطة دخول استثمارية سليمة حين تتوفر فيها الخدمات الأساسية دون أن تبلغ أسعارها بعد مستويات المناطق الناضجة. تستوفي المنطقة 14 هذا الشرط: فالمدارس الحكومية والعيادات والمحلات التجارية تعمل فيها، غير أن الأسعار لا تزال أقل بنحو 20 إلى 30 بالمئة من متوسط المنطقة الذهبية. أبرز مخاطر المناطق الناشئة تأخر تنفيذ البنية التحتية، لكن الضامن في المنطقة 14 أن توسيع الطرق وترقية المرافق بات قيد التنفيذ الفعلي، مما يُقلص هامش المخاطرة بصورة ملموسة.",
        "content5": "يستلزم تقييم المنطقة 14 تحديدًا دراسة محاور الوصول من الطريق الدائري الغربي وشبكة الشوارع الرئيسية الداخلية لمدينة السادات. للمنطقة حاليًا مسلكان وظيفيان، فيما يجري العمل على محور ثالث يُتوقع أن يُقلص زمن التنقل إلى مركز المدينة بنحو 15 دقيقة عند اكتماله. أبرز الفجوات الخدمية القائمة غياب مستشفى خاص داخل المنطقة وتواضع العرض التجاري مقارنة بالمنطقة الذهبية، وكلتاهما قيد المعالجة من قِبل مستثمرين من القطاع الخاص، وإتمامهما سيكون المحرك الرئيسي لتسارع الأسعار المتوقع.",
        "content6": "توقيت الاستثمار ربما يكون القرار الأكثر أثرًا في المنطقة الناشئة. الشراء قبل اكتمال البنية التحتية يُتيح استيعاب كامل قيمة الارتفاع السعري، لكنه يستدعي صبرًا على عوائد إيجارية متواضعة في مرحلة التطوير. النهج الأمثل في المنطقة 14 حاليًا هو شراء وحدة وتأجيرها بعقد متوسط الأمد لمستأجر من المهنيين أو الأسر، ثم الإمساك بها طوال نافذة اكتمال البنية التحتية المقدّرة بـ24 إلى 36 شهرًا. تتابع الأهرام للتطوير العقاري مستجدات المنطقة 14 عن كثب وتُقدم لعملائها بيانات آنية حول أقرب الفجوات الخدمية للحل، مما يُمكّنهم من ضبط توقيت دخولهم بدقة أكبر."
      },
      "post6": {
        "title": "وحدة تحت الإنشاء أم وحدة جاهزة؟ كيف تختار في مدينة السادات",
        "excerpt": "مقارنة عملية بين مزايا ومخاطر شراء وحدة قيد الإنشاء مقابل وحدة جاهزة للسكن في مدينة السادات",
        "content1": "الوحدة قيد الإنشاء (أوف بلان) تتيح للمشتري الدخول بسعر أقل مع خطط سداد ممتدة، وهي الخيار الأمثل لمن يملك وقتاً كافياً قبل الحاجة للسكن أو يهدف للاستثمار وانتظار ارتفاع القيمة. لكنها تحمل مخاطر التأخير في التسليم أو التغيير في المواصفات.",
        "content2": "الوحدة الجاهزة تمنح المشتري الدخول الفوري والتحقق المباشر من جودة التنفيذ والتشطيب قبل الدفع. سعرها أعلى عادة، لكنها تُجنّب المشتري مخاطر التأخير. هي الخيار الأنسب لمن يحتاج سكناً فورياً أو يريد تأجير الوحدة من اليوم الأول.",
        "content3": "في مدينة السادات، تُقدم الأهرام للتطوير العقاري كلا الخيارين: مشاريع قيد الإنشاء بأسعار تنافسية وخطط سداد مرنة، ووحدات جاهزة للتسليم الفوري. قرارك يعتمد على وضعك المالي وأهدافك — نحن هنا لمساعدتك في الاختيار الصحيح.",
        "content4": "لحماية نفسك عند الشراء على المخطط، لا تُوقِّع أي عقد قبل التحقق من ثلاثة عناصر: التسجيل الرسمي للأرض باسم المطور أو الحصول على توكيل تسجيل رسمي، ووجود بند غرامة تأخير واضح في العقد، وزيارة مشاريع سابقة للمطور للتحقق من سجله في الإنجاز. هذه الخطوات تُقلص مخاطر الأوف بلان بشكل كبير دون أن تُلغيها تماماً.",
        "content5": "أما اختيار الوحدة الجاهزة، فله حساباته الخاصة أيضاً. تحقق من تاريخ إنجاز المبنى ومدى التزام الساكنين السابقين بصيانته، وافحص الأنظمة الميكانيكية والكهربائية قبل التعاقد. الوحدة الجاهزة التي أُهملت لسنوات قد تحمل تكاليف إصلاح تُلغي ميزة السعر الأعلى الظاهري.",
        "content6": "في نهاية المطاف، القرار الصحيح ليس بين الأوف بلان والجاهزة بشكل مطلق، بل بين مشروع أوف بلان موثوق ووحدة جاهزة بحالة جيدة. الأهرام للتطوير العقاري تُرشدك في كلا الاتجاهين وتُزودك بالمعلومات الكاملة لاتخاذ القرار بثقة."
      },
      "post8": {
        "title": "المنطقة 21 بمدينة السادات: دليل السكن والاستثمار",
        "excerpt": "استكشاف معمّق لمنطقة 21 — خدماتها ومشاريعها وأسباب تميّزها عن سائر مناطق مدينة السادات",
        "content1": "المنطقة 21 أو المنطقة الذهبية هي النواة السكنية الأكثر نضجاً في مدينة السادات. تتميز بشبكة طرق مكتملة وتوفر كثيف للخدمات يشمل مستشفيات حكومية وخاصة، ومدارس دولية، وجامعات، ومراكز تجارية متعددة الأنشطة.",
        "content2": "يرتفع الطلب الإيجاري في المنطقة 21 بفضل قربها من الجامعات الخاصة التي تستقطب الطلاب من محافظات منوفية والجيزة والإسكندرية. هذا يجعل الاستثمار فيها مجزياً للباحث عن دخل إيجاري منتظم إلى جانب ارتفاع القيمة طويل الأمد.",
        "content3": "الأهرام للتطوير العقاري تمتلك مشاريع رائدة داخل المنطقة 21 تلبي أعلى التوقعات. سواء كنت تبحث عن وحدة للسكن أو الاستثمار، فلدينا الحل المناسب لك في أفضل مواقع المنطقة الذهبية.",
        "content4": "يتمتع السكان الدائمون في المنطقة 21 بجودة حياة يومية يصعب تكرارها في أي منطقة أخرى بمدينة السادات. سلاسل البقالة والصيدليات والعيادات الطبية ومطاعم الأطعمة المتخصصة في متناول اليد من معظم التجمعات السكنية. يمنح وجود النوادي الرياضية والمقاهي والمراكز الثقافية المنطقةَ طابعًا مجتمعيًا حقيقيًا بدلًا من الطابع العابر الشائع في المناطق التي يهيمن عليها الطلاب. تُقرّ الأسر بأن أمان الشوارع وسهولة الوصول إلى التعليم وقرب الرعاية الصحية تجعل المنطقة 21 وجهتها السكنية الدائمة لا مجرد مقر مؤقت.",
        "content5": "داخل المنطقة 21 ذاتها، تقدم المناطق الفرعية الأقرب إلى الجامعات الخاصة والشريان التجاري الرئيسي أعلى العوائد الإيجارية لكنها الأغلى شراءً أيضًا. يجد الباحث عن قيمة أفضل فرصته في التجمعات السكنية الشمالية للمنطقة، حيث تنخفض الأسعار بنسبة 10 إلى 15 بالمئة عن الشوارع المركزية مع الاستفادة من البنية الخدمية ذاتها. تلائم هذه المناطق الفرعية الأسرَ التي تُقدّم الهدوء والمستثمرين الذين يُفضلون انخفاض تكلفة الدخول ويتقبلون فترات أطول قليلًا في البحث عن مستأجرين.",
        "content6": "تنبثق الميزة التنافسية للأهرام للتطوير العقاري في المنطقة 21 من علاقات راسخة بالمواقع ومعرفة عميقة بديناميكيات السوق الفرعي للمنطقة. رصدت الشركة الشوارع الأعلى سرعة في إعادة البيع، والاتجاهات المعمارية التي تُعظم الإضاءة الطبيعية في المناخ المصري، وتكوينات الوحدات التي تستقطب أكثر المستأجرين موثوقية. تنعكس هذه المعرفة المتراكمة على كل قرار من الاستحواذ على الأرض إلى تصميم المسقط، وهو ما يصعب على الداخلين الجدد استنساخه بسرعة. المشتري في مشاريع الأهرام يستفيد مباشرة من هذه الخبرة المؤسسية."
      },
      "post9": {
        "title": "دليل التمويل العقاري في مصر: كيف تحصل على قرض بأفضل الشروط",
        "excerpt": "خطوات عملية للحصول على تمويل عقاري مناسب في مصر وأبرز شروط البنوك وصندوق الإسكان الاجتماعي",
        "content1": "التمويل العقاري أداة فعّالة تتيح لك امتلاك وحدتك بقسط شهري بدلاً من دفع كامل الثمن مرة واحدة. في مصر، يمكنك اللجوء إلى البنوك التجارية أو صندوق الإسكان الاجتماعي ودعم التمويل العقاري حسب دخلك ونوع الوحدة المطلوبة.",
        "content2": "لضمان قبول طلب التمويل، احرص على: أن يكون دخلك الشهري الموثق كافياً لتغطية القسط (لا يتجاوز 40% من الدخل الصافي)، وأن تكون الوحدة مسجلة رسمياً أو قابلة للتسجيل، وأن يكون لديك الدفعة المقدمة جاهزة (تتراوح بين 10% و20% عادة).",
        "content3": "الأهرام للتطوير العقاري تتعاون مع عدد من البنوك لتسهيل إجراءات التمويل على عملائها. يمكننا مساعدتك في تقدير قدرتك الشرائية وتوجيهك نحو أنسب خيارات التمويل المتاحة لوحداتنا في مدينة السادات.",
        "content4": "لتعزيز فرص قبول طلبك، احرص على تحسين ملفك الائتماني قبل التقدم: سدّد أي مديونيات متأخرة، وتجنّب الاقتراض من جهات متعددة في وقت قصير، واحتفظ بنسخ من كشوف حسابك البنكي لآخر ستة أشهر. البنوك تنظر إلى الاستقرار الوظيفي والانتظام في الإيداع بالقدر ذاته الذي تنظر فيه إلى رقم الراتب.",
        "content5": "قارن بين عروض التمويل المتاحة قبل الالتزام بأي منها. معدل الفائدة ليس المعيار الوحيد — احسب التكلفة الإجمالية للقرض (مجموع الأقساط طوال مدة التمويل) لمعرفة التكلفة الفعلية. بعض العروض ذات الفائدة الأعلى قليلاً قد تُوفر شروطاً مرنة للسداد المبكر تجعلها أوفر على المدى الكلي.",
        "content6": "صندوق الإسكان الاجتماعي ودعم التمويل العقاري يُتيح قروضاً بفائدة مدعومة لمن تنطبق عليهم شروط الدخل وحجم الوحدة. إذا كانت وحدتك المستهدفة ضمن الشريحة المؤهلة، فهذا الخيار يُوفر لك آلاف الجنيهات سنوياً. الأهرام للتطوير العقاري تُساعدك في تحديد أهليتك لهذا البرنامج وتُرشدك خلال إجراءات التقديم."
      },
      "post10": {
        "title": "المنطقة التكنولوجية بمدينة السادات: محرك النمو الاقتصادي الجديد",
        "excerpt": "كيف تُسهم المنطقة التكنولوجية في رفع الطلب على العقارات السكنية وتنشيط الاقتصاد المحلي لمدينة السادات",
        "content1": "أُنشئت المنطقة التكنولوجية في مدينة السادات لاستيعاب الشركات الصناعية والتقنية ذات التقنية المتوسطة والعالية، وهي تجتذب حالياً استثمارات ضخمة من شركات الإلكترونيات والصناعات الخفيفة والخدمات اللوجستية. هذا التوسع الصناعي يخلق آلاف فرص العمل لصالح سكان المدينة والمحافظات المجاورة.",
        "content2": "الأثر المباشر للمنطقة التكنولوجية على سوق العقارات السكني واضح: ارتفاع الطلب على الوحدات للسكن والإيجار من العمالة الوافدة، وزيادة الكثافة السكانية التي تستدعي مزيداً من الخدمات والتجارة. هذه الدورة الاقتصادية المتكاملة ترفع من قيمة العقارات السكنية المحيطة.",
        "content3": "المستثمر الذكي يرصد العلاقة بين النمو الصناعي والطلب السكني. مشاريع الأهرام للتطوير العقاري تقع في المواقع التي تستفيد مباشرة من هذا النمو، مما يضمن لك عوائد مجزية سواء من الارتفاع في القيمة أو العائد الإيجاري.",
        "content4": "تستضيف المنطقة التكنولوجية حاليًا أنشطة فعلية عبر ثلاثة تجمعات صناعية رئيسية: تجميع الإلكترونيات الاستهلاكية وتصنيع مكوناتها، والهندسة الخفيفة والآلات الدقيقة، والخدمات اللوجستية والتخزين من الطرف الثالث لخدمة سوق القاهرة الكبرى. أنشأت موردون تابعون لشركات متعددة الجنسيات منشآتها هنا إلى جانب شركات وطنية، مما خلق قاعدة توظيف متنوعة تجذب فنيين مهرة ومديرين من المستوى المتوسط إضافة إلى عمال الإنتاج العام. هذا التنوع في أصحاب العمل يُثبّت الطلب السكني المحلي في مواجهة أي تقلب في قطاع بعينه.",
        "content5": "تتباين مستويات الأجور في المنطقة التكنولوجية بحسب الوظيفة، لكنها تتجاوز بصورة واضحة الحد الأدنى الصناعي العام. يكسب الفنيون المهرة ومشرفو الأقسام ما بين ثلاثة وستة آلاف جنيه مصري شهريًا فوق رواتب الأساس، مما يمنحهم قوة شرائية حقيقية في سوق الإيجار المحلي. يضع هذا المستوى من التوظيف سقفًا واقعيًا للإيجارات الشهرية في المناطق السكنية القريبة — يجعل شقق الغرفتين والثلاثة المنتج الأكثر تنافسية — ويؤكد أن الطلب مدعوم بدخل فعلي لا بإشغال وهمي.",
        "content6": "القرب من المنطقة التكنولوجية عامل دفع إيجابي، لكن العلاقة بين المسافة والجاذبية السكنية ليست خطية. العقارات الملاصقة مباشرة للمواقع الصناعية قد تعاني من الضوضاء وحركة الشاحنات الثقيلة وجودة الهواء، مما يُضعف جاذبيتها السكنية. الموضع الاستثماري الأمثل هو ضمن نطاق تنقل لا يتجاوز 10 إلى 15 دقيقة من المنطقة — قريب بما يكفي ليُقدّر العمال ميزة الوصول، وبعيد بما يكفي لتجنب التداعيات البيئية الصناعية. تُطبق الأهرام للتطوير العقاري هذا المبدأ الوقائي عند انتقاء الأراضي، لضمان أن يحظى المشترون بمكاسب الجذب الاقتصادي للمنطقة دون تحمّل تكاليفها البيئية."
      },
      "post11": {
        "title": "دليل خطط السداد في مدينة السادات: كيف تختار الأنسب لك",
        "excerpt": "مقارنة بين أنظمة السداد المختلفة المتاحة في مدينة السادات ونصائح لاختيار الخطة التي تناسب دخلك",
        "content1": "تتنوع خطط السداد في مشاريع مدينة السادات بين دفع مقدم وأقساط شهرية، أو دفع مقدم وأقساط نصف سنوية، أو خطط بدون فوائد تمتد حتى 10 سنوات. الاختيار الصحيح يعتمد على تدفقاتك النقدية الشهرية ومدى استقرار دخلك.",
        "content2": "قاعدة مفيدة: لا يتجاوز القسط الشهري 30% من صافي دخلك لتجنب ضغط مالي غير مبرر. إذا كان دخلك متذبذباً، فالأقساط نصف السنوية أو الأقساط المتناقصة (ترتفع تدريجياً مع الوقت) قد تناسبك أكثر من القسط الثابت.",
        "content3": "الأهرام للتطوير العقاري توفر خطط سداد مرنة تناسب مختلف الأوضاع المالية. مستشارونا متاحون لمساعدتك في تحليل خياراتك واختيار خطة السداد التي تحقق لك هدفك في امتلاك الوحدة دون إجهاد ميزانيتك.",
        "content4": "من الجوانب التي يُغفلها كثيرون عند مقارنة خطط السداد: التكلفة الكلية للوحدة عند اختيار مدة أطول. خطة بفائدة مدمجة تمتد عشر سنوات قد تعني دفع ضعف السعر الأصلي. احسب دائماً مجموع ما ستدفعه في نهاية الخطة ولا تكتفي بمقارنة القسط الشهري.",
        "content5": "إذا كان دخلك يتضمن مكافآت أو موسمية، فكّر في خطة تُتيح السداد المبكر بدون غرامة. بعض العقود تسمح بتسديد دفعات إضافية تُقلص من رصيد القرض وتُخفف العبء الإجمالي. هذا المرونة تستحق التفاوض عليها مسبقاً حتى لو لم تكن تنوي استخدامها في البداية.",
        "content6": "تذكّر أن خطة السداد التي تختارها اليوم ستُرافقك لسنوات. خُذ وقتك في المقارنة، واستعن بمستشار مالي أو استشِر الأهرام للتطوير العقاري للحصول على تحليل مقارن شامل يُوضح الخيار الأمثل لوضعك تحديداً — لأن أنسب خطة هي التي تُحقق لك السكن المريح دون ضغط مالي مزمن."
      },
      "post12": {
        "title": "الحي المتميز بمدينة السادات: أرقى مناطق السكن الهادئ",
        "excerpt": "تعرف على ما يميز الحي المتميز ولماذا يختاره أصحاب الذوق الرفيع الباحثون عن بيئة سكنية راقية",
        "content1": "يُعرف الحي المتميز بمدينة السادات بهدوئه النسبي ووفرة مساحاته الخضراء وانخفاض كثافته السكانية مقارنة بباقي الأحياء. يضم تجمعات سكنية فيلات ومنازل تاون هاوس بتصميمات معمارية راقية، ما يجعله الخيار المفضل للأسر التي تبحث عن خصوصية ومساحة.",
        "content2": "رغم ابتعاده قليلاً عن مركز المدينة، إلا أن الحي المتميز يقع على مقربة من الطرق الرئيسية وخدمات التعليم والصحة. أسعار العقارات فيه أعلى نسبياً من متوسط المدينة، غير أن الطلب عليه ثابت من شريحة المشترين ذوي الدخل المرتفع.",
        "content3": "إذا كانت أولويتك الهدوء والخصوصية والمساحة على حساب القرب من مركز النشاط التجاري، فالحي المتميز خيار يستحق النظر. تواصل مع فريق الأهرام للتطوير العقاري للاطلاع على مشاريع قريبة من هذا الحي.",
        "content4": "من منظور الاستثمار البحت، يُقدم الحي المتميز مقترحًا مختلفًا عن المنطقة الذهبية. تكون القيمة بالمتر المربع أعلى، نظرًا لكبر مساحة القطع وانخفاض كثافتها وارتفاع مواصفات البناء المعتادة في الفيلات والتاون هاوس. بيد أن السيولة أبطأ: فشريحة المشترين للوحدات العائلية المنفردة ذات القيمة المرتفعة أضيق، والطلب الإيجاري أقل عمقًا. ينبغي للمستثمر الداخل إلى الحي المتميز أن يخطط لفترة احتجاز أطول وأن يُقدّم تقدير رأس المال على العائد الإيجاري قصير الأمد — وهي استراتيجية أثبتت تاريخيًا عوائد جيدة للمستثمر الصبور في هذه الشريحة وما يماثلها.",
        "content5": "المشتري النموذجي في الحي المتميز متخصص رفيع المستوى أو رجل أعمال، غالبًا لديه مقر إقامة رئيسي في القاهرة ويبحث عن منزل ثانٍ أو للتقاعد يتمتع بمساحة وخصوصية. المستأجرون قلة نسبيًا لكنهم في الغالب من الشريحة الممتازة: مديرون تنفيذيون في مأموريات عمل، ومهندسون رئيسيون موفَدون إلى المناطق التكنولوجية أو الصناعية، وأحيانًا موظفون تقنيون مرتبطون بجهات أجنبية. تميل عقود إيجار وحدات الفيلات إلى الأمد الأطول والمبالغ الأعلى، مما يجعل عبء الإدارة على المؤجر أقل مقارنة بسوق الشقق — ميزة تشغيلية يُقللها كثيرون من قيمتها.",
        "content6": "رصدت الأهرام للتطوير العقاري اهتمامًا قويًا من العملاء بالعقارات الواقعة على أطراف الحي المتميز، حيث تنخفض الأسعار وتُتاح بعض سمات الحي الراقي دون التكلفة الكاملة لتملّك فيلا. تُقيّم الشركة باستمرار فرص الأراضي في هذا الحي وما حوله وتُقدم المشورة للمشترين المحتملين. يُنصح العملاء المهتمون بهذه الشريحة بالتواصل المبكر مع فريقنا، إذ أن القطع التي تجمع بين الموقع المثالي وسهولة الوصول للخدمات والامتثال التخطيطي محدودة وتُباع بسرعة حين تُطرح في السوق."
      },
      "post13": {
        "title": "التزام الأهرام للتطوير العقاري بمواعيد التسليم: أرقام وحقائق",
        "excerpt": "نرصد سجل شركة الأهرام للتطوير العقاري في تسليم مشاريعها ونستعرض أهم الآليات التي تضمن الالتزام بالمواعيد",
        "content1": "التسليم في الموعد المحدد هو أحد أبرز معايير تقييم المطور العقاري ويأتي في صدارة مخاوف المشترين. الأهرام للتطوير العقاري تدرك هذه الأولوية وتعمل وفق منهجية مدروسة تشمل التخطيط المسبق للجدول الزمني وتخصيص احتياطيات للطوارئ.",
        "content2": "تعتمد الشركة على مقاولين ذوي خبرة ومصادر مواد موثوقة لتجنب تأخيرات سلسلة التوريد. كما تُجري مراجعات دورية لتقدم الإنشاء وتُعلم العملاء بالتحديثات الدورية، مما يبني ثقة حقيقية ويتيح التخطيط المبكر للتسليم.",
        "content3": "إذا كنت تفكر في التعاقد مع مطور عقاري في مدينة السادات، فاطلب منه مشاريعه المكتملة وموازين التسليم. الأهرام فخورة بسجلها وتُرحب بأي تحقق من جانب العملاء قبل اتخاذ قرار الشراء.",
        "content4": "تبدأ منظومة التسليم لدى الأهرام قبل وضع أول طوبة؛ إذ يُعدّ لكل مشروع جدول إنشائي مفصّل مُقسَّم على أهداف ربع سنوية تشمل أعمال الهيكل والتركيبات الميكانيكية والكهربائية والسباكة والتشطيبات والتنسيق الخارجي. يتابع الفريق التقني الإنجاز مقارنةً بهذه الأهداف مرتين شهرياً، مما يُمكّن من رصد أي تأخّر مبكراً وتدارُكه قبل أن يتراكم.",
        "content5": "يُشكّل التواصل مع العميل ركيزةً رسمية في منظومة التسليم لا ملحقاً يُستهان به؛ إذ يتلقّى المشترون تحديثات دورية مرفقةً بصور ونسب اكتمال لكل مرحلة من مراحل وحدتهم. ومع اقتراب موعد التسليم، يُدعى العملاء إلى جولة استلام أولية لرصد أي ملاحظات تُعالَج قبل إصدار شهادة التسليم النهائية.",
        "content6": "التسليم في موعده ليس مجرد وعد، بل له أثر مباشر على قيمة العقار؛ فالوحدات التي تُسلَّم في مواعيدها ضمن مجمعات حسنة الصيانة تحقق أسعار إعادة بيع وعوائد إيجارية أعلى مقارنةً بمشاريع التأخير المطوّل. من خلال الاستثمار في ضبط التسليم، تحمي الأهرام للتطوير العقاري القيمة الطويلة الأمد لكل وحدة تبيعها وتصون الثقة التي منحها إياها عملاؤها."
      },
      "post14": {
        "title": "المحور المركزي لمدينة السادات: تأثيره على أسعار العقارات المجاورة",
        "excerpt": "كيف يعيد المحور المركزي الجديد تشكيل خريطة العقارات في مدينة السادات ويرفع من قيمة المناطق المحيطة",
        "content1": "المحور المركزي لمدينة السادات مشروع طرق كبرى يهدف إلى تحسين حركة المرور الداخلية ووصل المناطق السكنية والصناعية بشكل أكثر كفاءة. بمجرد اكتمال المراحل الأولى منه، لوحظ ارتفاع ملموس في الطلب على العقارات القريبة من محوره.",
        "content2": "تاريخياً، كل مشروع بنية تحتية كبير في مدينة السادات رفع من قيمة العقارات في المناطق المحيطة بنسب تراوحت بين 15% و35% خلال سنتين إلى ثلاث سنوات من افتتاحه. المحور المركزي يُتوقع أن يحقق تأثيراً مماثلاً أو أكبر نظراً لشموله مناطق سكنية متعددة.",
        "content3": "يرى خبراء التقييم العقاري أن الاستثمار في المناطق القريبة من المشاريع الكبرى قبل اكتمالها يُدر أعلى العوائد. الأهرام للتطوير العقاري تمتلك وحدات في مناطق ستستفيد مباشرة من هذا المحور — تواصل معنا لمعرفة التفاصيل.",
        "content4": "يخترق المحور المركزي أو يربط مباشرةً عدة أحياء استراتيجية في مدينة السادات. يصل مساره الرئيسي المناطق السكنية الشمالية والشرقية — بما فيها المنطقة 21 والمنطقة 14 — بالمناطق الصناعية والتكنولوجية في الجنوب، فيما يمتد فرع ثانوي باتجاه المركز التجاري للمدينة. والنتيجة هي منظومة طرق هرمية تُحوّل رحلات التنقل العرضية غير المباشرة إلى مسارات مباشرة محددة الزمن، مُقلّصة مدد التنقل الداخلية التي كانت تتراوح بين 25 و40 دقيقة إلى أقل من 15 دقيقة على الأجزاء المكتملة.",
        "content5": "تسير المراحل المتبقية من المحور المركزي على التوالي، مع نشاط حالي في أعمال الهندسة المدنية على الامتداد الجنوبي الذي يربط المنطقة التكنولوجية بالنواة السكنية. يُتوقع اكتمال هذا الجزء الأخير في غضون 18 إلى 24 شهرًا وفق وتيرة البناء الراهنة. لهذا الجدول الزمني أثر مباشر على المستثمرين: العقارات على طريق الامتداد الجنوبي مسعّرة اليوم قبل تعكّس الاتصالية الكاملة في قيمتها. بمجرد افتتاح الجزء الأخير، يُرجَّح تكرار الارتفاع اللحاقي الموثق بين 15 و35 بالمئة على الأجزاء المكتملة في هذه المناطق مجهولة القيمة حاليًا.",
        "content6": "يستدعي تقييم أي عقار مجاور للطريق الموازنة بين مكاسب الاتصالية ومخاطر الضوضاء وحركة المرور. كمبدأ عام، تستوعب الوحدات المُبعدة 50 مترًا على الأقل عن مسار المحور — مفصولة بطريق خدمي أو حاجز أخضر — معظم علاوة سهولة الوصول مع تعرض أدنى بكثير للضوضاء مقارنة بالوحدات المواجهة مباشرة للطريق. تُطبق الأهرام للتطوير العقاري هذا المعيار بانتظام، منتقيةً مواقع قريبة بما يكفي لتمتّع السكان بتقليص أوقات التنقل دون وضع المباني السكنية على حافة الطريق حيث يُفسد ضجيج المرور جودة الحياة."
      },
      "post15": {
        "title": "شقة أم فيلا في مدينة السادات؟ دليل القرار الصحيح",
        "excerpt": "مقارنة معمّقة بين الشقق السكنية والفيلات في مدينة السادات تساعدك على الاختيار وفق أهدافك وميزانيتك",
        "content1": "الشقة السكنية خيار عملي يناسب الأسر الصغيرة والمتوسطة والمستثمرين الباحثين عن سيولة أعلى وإدارة أسهل. تكاليف الصيانة أقل، والتأجير أسرع، والبيع أيسر. أسعارها في مدينة السادات تتراوح بين 700,000 جنيه و2.5 مليون جنيه حسب المنطقة والمساحة.",
        "content2": "الفيلا تمنح مساحة أوسع وخصوصية أعلى وقيمة هيبة اجتماعية لا تُقارن بالشقة. هي الخيار الأمثل للأسر الكبيرة أو من يريد مساحة خارجية خاصة. تكاليف بنائها وصيانتها أعلى، لكن ارتفاع قيمتها على المدى البعيد عادة يتفوق على الشقق.",
        "content3": "الأهرام للتطوير العقاري تقدم في مدينة السادات شققاً سكنية فاخرة ووحدات تاون هاوس. قرارك يجب أن ينبثق من حجم أسرتك وطريقة حياتك وأهدافك الاستثمارية. نحن هنا لمساعدتك في الوصول إلى الاختيار الأنسب.",
        "content4": "من الزاوية الاستثمارية، الشقة أسهل في التأجير والبيع نظراً لوفرة المستأجرين في هذا الشريحة وحجم السوق الأكبر. الفيلا تستهدف شريحة أضيق من المستأجرين لكن القيمة الإيجارية لكل متر مربع قد تكون أعلى. اختر بحسب الطلب السائد في المنطقة التي تنوي الاستثمار فيها.",
        "content5": "التكاليف المخفية هي المفاجأة الكبرى في الفيلا: الصيانة الدورية للحديقة، وإصلاحات الأسطح والجدران الخارجية، وفواتير الكهرباء المرتفعة نسبياً نظراً للمساحة. احسب هذه التكاليف ضمن ميزانيتك السنوية قبل اتخاذ قرار الشراء حتى لا تُفاجأ لاحقاً.",
        "content6": "في نهاية المقارنة، تذكّر أن السعادة في المنزل ليست رقماً في جدول حسابي. الأسرة التي تحتاج فناء خاصاً لأطفالها ستجد في الفيلا قيمة لا تُعوَّض بالسعر. والمستثمر الذي يريد سهولة الإدارة وعوائد سريعة سيجد في الشقة ما يُلبي هدفه. الأهرام للتطوير العقاري تُرشدك نحو القرار الذي يجمع بين احتياجاتك وإمكاناتك."
      },
      "post16": {
        "title": "المناطق الصناعية في مدينة السادات: قوة دافعة للاقتصاد والعقار",
        "excerpt": "استعراض شامل للمناطق الصناعية بمدينة السادات وأثرها المباشر على أسواق السكن والخدمات المحيطة",
        "content1": "تمتلك مدينة السادات واحدة من أكبر المناطق الصناعية في مصر، تضم أكثر من 1500 منشأة صناعية في قطاعات الغزل والنسيج والأغذية والمعادن والبلاستيك والصناعات الكيميائية. هذا التنوع الصناعي يوفر قاعدة اقتصادية متينة تحمي المدينة من التقلبات الاقتصادية.",
        "content2": "العلاقة بين المناطق الصناعية وسوق العقارات السكني مباشرة: العمالة الصناعية تحتاج إلى سكن بالقرب من مواقع العمل، مما يرفع الطلب على الوحدات الصغيرة والمتوسطة ويُبقي عوائد الإيجار مرتفعة باستمرار. الطلب المستقر من هذه الشريحة يُقلل من مخاطر الشغور في استثمارك.",
        "content3": "عند اختيار وحدة للاستثمار الإيجاري في مدينة السادات، ضع في الاعتبار قربها من المناطق الصناعية الكبرى. الأهرام للتطوير العقاري تُقدم مشاريع في مواقع تستفيد من هذا الطلب المستدام، مما يضمن لك عوائد ثابتة.",
        "content4": "يُشكّل القطاع الصناعي في مدينة السادات نسيجاً تجارياً متكاملاً يمتد خارج أسوار المصانع: محلات تجهيزات الصناعة، وخدمات الصيانة، والمطاعم ومحلات الوجبات السريعة التي تُخدم العمالة، والمستودعات اللوجستية — كل هذه الأنشطة تخلق طلباً إضافياً على الوحدات التجارية والسكنية على حدٍّ سواء.",
        "content5": "اجتذبت المناطق الصناعية في مدينة السادات فئة متنامية من الكوادر المتوسطة — مهندسون وتقنيون ومديرون يُفضلون السكن قريباً من مواقع عملهم ويبحثون عن وحدات أوسع وبيئة أهدأ مما توفره أحياء القاهرة بأسعارها المرتفعة. هذه الفئة مستأجر مثالي: ملاءة مالية أعلى، والتزام بالمواعيد، واهتمام أكبر بصيانة الوحدة.",
        "content6": "الأهرام للتطوير العقاري تُدرج القرب من المناطق الصناعية ومعدلات الطلب الإيجاري المرتبطة بها ضمن معايير اختيار مواقع مشاريعها. هذا التموضع يضمن للمستثمر طلباً مستداماً يتجاوز أعمار الدورات الاقتصادية القصيرة ويحمي قيمة المحفظة العقارية على المدى البعيد."
      },
      "post17": {
        "title": "مجمع الغزل والنسيج: أثره في تشكيل هوية مدينة السادات العقارية",
        "excerpt": "كيف أسهم مجمع الغزل والنسيج في بناء الاقتصاد المحلي لمدينة السادات وتأثيره على الطلب السكني",
        "content1": "مجمع الغزل والنسيج بمدينة السادات أحد أكبر مجمعات الصناعة النسيجية في منطقة الشرق الأوسط وأفريقيا، ويعمل فيه عشرات الآلاف من العمال والموظفين. هذا المجمع الضخم شكّل جزءاً أساسياً من الهوية الاقتصادية للمدينة منذ تأسيسها.",
        "content2": "الوجود الدائم للعمالة الكبيرة المرتبطة بهذا المجمع أوجد طلباً سكنياً ثابتاً في المناطق المحيطة به. أسعار الإيجار في هذه المناطق تتمتع بثبات نسبي حتى في أوقات تراجع الطلب العام، نظراً لاستمرارية الحاجة السكنية للعمالة.",
        "content3": "التوسعات المخططة لمجمع الغزل والنسيج خلال 2026-2028 ستزيد الطاقة الاستيعابية وتستقطب المزيد من العمالة، مما يعني مزيداً من الطلب على السكن. الأهرام للتطوير العقاري ترصد هذه الديناميكيات وتوجّه مشاريعها في المناطق الأكثر استفادة.",
        "content4": "النظام التجاري الذي نما حول مجمع النسيج ضخم ومعزز لذاته. في دائرة نصف قطرها كيلومتران من البوابات الرئيسية، تتركز مطاعم وأكشاك طعام تخدم عمال الورديات، ومحلات قطع الغيار والصيانة الداعمة لاحتياجات المصنع التشغيلية، وشريط تجاري يوفر الملابس والسلع المنزلية والخدمات المصرفية. يُولّد هذا النظام بدوره فرص عمل وطلبًا سكنيًا إضافيين، خالقًا طبقات من النشاط الاقتصادي التي تمتد إلى ما هو أبعد بكثير من أرضية المصنع وتُغذّي السوق السكنية المحيطة طوال العام.",
        "content5": "التركيبة السكانية لقوى العمل في مجمع النسيج أكثر تنوعًا مما توحي به صورة القطاع. يشكّل عمال الإنتاج أكبر مجموعة فردية، لكن المجمع يضم أيضًا مهنيين من المستوى المتوسط كمشرفي الإنتاج ومهندسي ضبط الجودة ومنسقي سلاسل الإمداد والموظفين الإداريين. تُمكّن رواتب هذه الفئة المهنية أصحابها من استئجار شقق بغرفتين بمواصفات لائقة، ولديهم توقعات ثابتة حول جودة السكن — يبحثون عن قرب من المجمع وعن مبانٍ نظيفة بمرافق موثوقة، وهي سمات تتوافق تمامًا مع ما يُقدمه المطورون الراسخون كالأهرام.",
        "content6": "تُدرج الأهرام للتطوير العقاري قرب مجمع النسيج وتركيبة قواه العاملة ضمن المدخلات الصريحة عند تقييم مواقع المشاريع. تُعامل الشركة القرب الصناعي لا بوصفه إيجابيًا صرفًا ولا سلبيًا صرفًا، بل بوصفه متغيرًا يُدار عبر انتقاء دقيق للموقع. تقع المشاريع قريبًا بما يكفي للاستفادة من طلب إسكان العمال، لكن في عمق خارج المحيط المباشر حيث تتركز الضوضاء وحركة الشاحنات الثقيلة. الناتج عرض سكني يستقطب الفئة المهنية والإدارية المتوسطة من القوى العاملة في المجمع — مستأجرون يدفعون بانتظام ويصونون الممتلكات جيدًا، مما يُقلص الاحتكاك التشغيلي للمستثمرين."
      },
      "post18": {
        "title": "عملاؤنا يحكون: تجارب حقيقية مع الأهرام للتطوير العقاري",
        "excerpt": "قصص نجاح حقيقية لعملاء الأهرام للتطوير العقاري في مدينة السادات — رحلة من الحلم إلى المفتاح",
        "content1": "خلف كل وحدة سكنية تسلّمها الأهرام للتطوير العقاري، ثمة قصة أسرة وجدت منزلها أو مستثمر حقق هدفه. نرصد في هذا المقال نماذج من تجارب عملائنا التي تعكس قيمنا الجوهرية في الشفافية والجودة والالتزام.",
        "content2": "يروي أحد عملائنا كيف بدأ رحلته بزيارة موقع المشروع قبل التعاقد، وكيف فوجئ بشفافية فريق المبيعات في تقديم معلومات دقيقة عن موعد التسليم والمواصفات. آخر يحكي عن عائد الإيجار الذي حققه من وحدته في المنطقة الذهبية منذ أول شهر بعد التسليم.",
        "content3": "نحن في الأهرام للتطوير العقاري نؤمن بأن أفضل شهادة على جودة عملنا هي رضا عملائنا وتوصيتهم لذويهم وأصدقائهم. أكثر من 60% من مبيعاتنا تأتي عبر التوصيات المباشرة — وهذا أعلى تقدير يمكن أن نتلقاه.",
        "content4": "تحكي إحدى الأسر القادمة من القاهرة أن ما أدهشها لم يكن جودة البناء وحدها، بل دفء الجيران الذين وجدوهم في انتظارهم. منذ الأسبوع الأول، طرق الجيران الباب لترحيبهم، وتجاوب فريق إدارة المبنى مع استفساراتهم بسرعة وودّ. ذلك الإحساس بالانتماء لم يكونوا يتوقعونه بمثل هذه السرعة.",
        "content5": "من ناحية المستثمرين، القصة مشجّعة بالقدر ذاته. عدد من أصحاب الوحدات في مشاريع المنطقة الذهبية يُفيدون بمعدلات إشغال إيجارية مستمرة منذ اليوم الأول بعد الاستلام، ومستأجرون يجددون عقودهم عاماً بعد عام. إحدى المستثمرات في وحدة غرفتين شهدت ارتفاع إيجارها بأكثر من 30% على ثلاث دورات تجديد متتالية دون أي فترة شغور تتجاوز أسبوعين.",
        "content6": "نشارككم هذه القصص لا لتحلّ محل بحثكم الخاص، بل لتكشف النمط الذي يتشكّل حين يلتزم المطور بوعوده. حين يتطابق التسليم مع العقد، وتتوافق الجودة مع الكتيب التعريفي، ويرفع فريق ما بعد البيع الهاتف — تتبنى الثقة لبنةً فوق لبنة. هذه هي التجربة التي تسعى الأهرام للتطوير العقاري إلى تقديمها لكل عميل."
      },
      "post19": {
        "title": "المخطط العمراني لمدينة السادات: رؤية التصميم ومستقبل التطوير",
        "excerpt": "استعراض المخطط العمراني الشامل لمدينة السادات وكيف يُحدد توزيع الأحياء والخدمات والاستثمارات",
        "content1": "صُمِّمت مدينة السادات وفق مخطط عمراني شامل يُوزع المدينة إلى مناطق وظيفية واضحة: مناطق سكنية ومناطق صناعية ومنطقة تجارية مركزية ومناطق خدمات. هذا التخطيط المدروس يُقلل من التضارب في الاستخدامات ويرفع من جودة الحياة.",
        "content2": "المخطط العمراني لمدينة السادات يتضمن محاور رئيسية تربط مختلف المناطق، وشبكة طرق هرمية تبدأ بالشوارع الرئيسية العريضة وتتدرج نحو الشوارع الفرعية الداخلية. كذلك يُحدد المخطط أماكن المدارس والمستشفيات والمتنزهات لضمان توزيعها العادل.",
        "content3": "فهم المخطط العمراني يساعد المستثمر على اختيار أفضل المناطق بحسب الخدمات المحيطة وطبيعة الاستخدام المستقبلي. الأهرام للتطوير العقاري تضع مشاريعها في مناطق تتوافق مع التخطيط العمراني الأمثل لضمان القيمة على المدى البعيد.",
        "content4": "قراءة المخطط العمراني بعيون المستثمر تستلزم التركيز على ثلاثة فحوصات قبل الالتزام بالشراء. أولًا: التحقق من تصنيف المنطقة التخطيطية للأرض، إذ تحمل المناطق السكنية مسارات قيمة مختلفة عن التصنيفات التجارية أو المتعددة الاستخدامات. ثانيًا: تحديد مدى قرب القطعة من المساحات الخضراء المخصصة، لأن المناطق الخضراء المخططة تُضيف علاوة سعرية ملموسة ودائمة على العقارات المجاورة. ثالثًا: مراجعة خطط الطرق، فالقرب من طريق رئيسي مقرر يزيد القيمة، بينما الوقوع مباشرة داخل ممر طريق مستقبلي قد ينشئ خطر الاستملاك الجبري. يمكن التحقق من الفحوصات الثلاثة من سجلات هيئة مدينة السادات.",
        "content5": "خضع المخطط العمراني لعدة تعديلات منذ تأسيس المدينة، أبرزها توسيع المنطقة التكنولوجية شرقًا عام 2019 وتخصيص أراضٍ سكنية إضافية في الأحياء الشمالية لاستيعاب نمو السكان. تدور حاليًا نقاشات حول إضافة مركز تجاري ثانوي في الأحياء الغربية لخدمة السكان الذين يتنقلون الآن إلى الشريان التجاري الرئيسي لاحتياجاتهم الأساسية. ينبغي للمستثمرين الاطلاع على المخطط المعتمد الحالي — لا الإصدارات السابقة — للتأكد من أن تحليلهم يعكس استخدام الأراضي الفعلي المعتمد لا التصنيفات المُلغاة.",
        "content6": "تُحيل عملية انتقاء المواقع في الأهرام للتطوير العقاري صراحةً إلى المخطط العمراني المعتمد في كل مرحلة من مراحل تقييم الأراضي. تتجنب الشركة المواقع المُصنّفة خطأ أو المجاورة لاستخدامات متعارضة أو الواقعة في ممرات تخطيطية قد تؤثر عليها حقوق الطريق المستقبلية. يستفيد المشترون في مشاريع الأهرام من هذا العناية الواجبة بصورة غير مباشرة، إذ يعلمون أن الموقع تم التحقق منه في ضوء تصنيفات المخطط العمراني الراهنة وأنه لا يحمل أي تعارضات في تقسيم المناطق غير محلولة — وهو خطر جوهري يُغفله كثير من المستثمرين الأفراد."
      },
      "post20": {
        "title": "الحزام الأخضر في مدينة السادات: كيف يرفع جودة الحياة وقيمة العقار",
        "excerpt": "دور المساحات الخضراء والحدائق العامة في تعزيز جاذبية السكن ورفع أسعار العقارات المجاورة",
        "content1": "يمتد الحزام الأخضر لمدينة السادات على مساحات شاسعة تفصل بين المناطق الصناعية والسكنية وتُوفر رئة خضراء لسكان المدينة. هذه المساحات ليست رفاهية، بل ضرورة صحية وبيئية تُحسن جودة الهواء وتُقلل من درجات الحرارة في الصيف.",
        "content2": "أبحاث السوق العقاري تُثبت باستمرار أن العقارات المطلة على مساحات خضراء أو القريبة منها تحقق علاوة سعرية تتراوح بين 10% و20% مقارنة بالعقارات المماثلة في مناطق بلا خضرة. هذه العلاوة تزيد مع ازدياد الوعي البيئي لدى المشترين.",
        "content3": "مشاريع الأهرام للتطوير العقاري في مدينة السادات تُولي اهتماماً خاصاً بالمساحات الخضراء الداخلية، إذ يُخصص جزء من كل مشروع لحدائق ومسطحات خضراء. نؤمن بأن البيئة الخضراء ليست تفصيلة تصميمية بل ركيزة جودة حياة أصيلة.",
        "content4": "أكثر المساحات الخضراء إتاحةً للسكان اليوم هي الحديقة العامة المركزية بالقرب من الشريان التجاري الرئيسي للمنطقة 21، والشارع المزروع على طول الطريق الرئيسي شمالًا-جنوبًا، وعدة مناطق مشجّرة على مستوى الأحياء توزّعت عبر المناطق السكنية. شبكة الممرات الرسمية لا تزال في طور التطوير، لكن الممرات الخضراء القائمة تُستخدم بانتظام للمشي صباحًا ومساءً ونزهات الأسر والرياضة غير الرسمية. هذا التوفر يُميّز البيئة السكنية لمدينة السادات تمييزًا ملموسًا عن المناطق الحضرية العشوائية الأقدم في الدلتا والقاهرة الكبرى.",
        "content5": "تقع مسؤولية صيانة الحزام الأخضر والحدائق العامة أساسًا على عاتق هيئة إدارة مدينة السادات التي تُشرف على الري وإعادة الزراعة والصيانة العامة. في الواقع العملي، يتفاوت وضع المساحات الخضراء الفردية بحسب الحي، وتحظى مناطق الأحياء السكنية الأكثر رسوخًا بعناية أكثر انتظامًا. تُكمّل الأهرام للتطوير العقاري الصيانة العامة بإدارة احترافية للتشجير الداخلي في مشاريعها، مما يضمن حصول السكان على جودة خضراء على مستوى المشروع والحي معًا لا الاتكال فقط على ما تُوفره الجهة الحكومية.",
        "content6": "تُوصل الأهرام للتطوير العقاري مزايا المساحات الخضراء للمشترين عبر توثيق الأعمال الشفاف لا الصور الترويجية الطموحة وحدها. تُظهر المخططات الموقعية التخصيص الدقيق للمساحة الخضراء داخل كل مشروع، وتُفصّل مواصفات التشجير الأنواع النباتية ونسبة التغطية المخططة، فيما تُتيح جلسات المعاينة الميدانية للمشترين رؤية حجم الحدائق الداخلية قبل الالتزام. بالنسبة للمستثمر الذي يدرك أن العقارات المجاورة للمساحات الخضراء تفرض علاوة إيجارية دائمة، تُمثل هذه التفاصيل أهمية حقيقية: تخصيص 15 بالمئة موثق من إجمالي أرض المشروع للمساحات الخضراء أصل قابل للتحقق لا مجرد ادعاء تسويقي."
      },
      "post21": {
        "title": "مدينة السادات مقابل العاصمة الإدارية الجديدة: أيهما أنسب لاستثمارك؟",
        "excerpt": "مقارنة موضوعية بين مدينة السادات والعاصمة الإدارية الجديدة من حيث السعر والعائد والموقع والخدمات",
        "content1": "العاصمة الإدارية الجديدة والسادات كلتاهما مدينتان مخططتان تستهدفان المستثمر العقاري، لكنهما تختلفان اختلافاً جوهرياً في المستوى السعري ونوعية المشترين. أسعار العاصمة الإدارية أعلى بكثير، مما يعني حاجز دخول أعلى وسيولة أبطأ في بعض الأحيان.",
        "content2": "مدينة السادات تقدم أسعاراً أكثر تنافسية وطلباً إيجارياً فعلياً مدعوماً بالنشاط الصناعي والتعليمي. في المقابل، العاصمة الإدارية مشروع قومي طموح يستهدف الشريحة الأعلى دخلاً وقد تحتاج إلى أفق استثماري أطول لتحقيق العوائد المأمولة.",
        "content3": "الاختيار بينهما يعتمد على حجم رأس المال المتاح وأفق الاستثمار الزمني. للمستثمر ذي الميزانية المتوسطة والرغبة في عوائد أسرع، تبقى مدينة السادات الخيار الأكثر عملية. الأهرام للتطوير العقاري تقدم في السادات أفضل قيمة مقابل السعر.",
        "content4": "السيولة — أي قدرتك على إيجاد مشترٍ بسرعة حين تقرر الخروج — تتباين تبايناً واضحاً بين المدينتين. مدينة السادات تمتلك رصيداً من الوحدات المكتملة والمأهولة يُتيح حضور مجموعة مشترين فعلية في السوق اليوم: عمال ومشترون وأسر تقيم في المدينة بالفعل ويُولّدون حجم تداول حقيقياً. أما سيولة العاصمة الإدارية الجديدة فلا تزال محدودة بسبب مجموعة مشترين أضيق وأعلى ثمناً، وبسبب كون كثير من وحداتها قيد الإنشاء أو مُسلَّمة حديثاً في سوق لا يزال يُرسّخ نماذجه الإيجارية وأسعار إعادة البيع. هذا مقبول لمن يمتلك أفقاً استثمارياً من خمس إلى سبع سنوات، لكنه قيد حقيقي ينبغي احتسابه لمن يحتاج مرونة الخروج خلال ثلاث سنوات.",
        "content5": "هياكل المخاطر مختلفة في طبيعتها لا في حجمها فحسب. جاذبية العاصمة الإدارية تعتمد اعتماداً كبيراً على استمرار وتيرة انتقال المؤسسات الحكومية إليها والالتزام بتنفيذ البنية التحتية المُعلنة — وكلاهما خارج سيطرة المستثمر. أما حجة الاستثمار في مدينة السادات فترتكز على قاعدة صناعية وجامعية تعمل بالفعل وتُولّد طلباً سكنياً منذ عقود. هذا لا يعني أن مدينة السادات خالية من المخاطر، لكن مرتكزاتها الاقتصادية أصول تشغيلية قائمة لا وعوداً مستقبلية.",
        "content6": "ملف المشتري المثالي لكل مدينة يعكس هذه الفوارق بوضوح. العاصمة الإدارية تناسب المستثمر صاحب رأس المال الكبير والمتحمّل لانتظار نضج السوق وتقبّل مخاطر التركيز في مشروع قومي ضخم. مدينة السادات تناسب المستثمر متوسط الميزانية أو المشتري للسكن الذاتي الذي يريد دخلاً إيجارياً متوقعاً وبيئة خدمية راسخة وقدرة على الخروج في أفق زمني معقول. كلتا المدينتين تمتلك مزاياها الخاصة — والسؤال هو أيهما يتوافق مع وضعك الرأسمالي وتوقعاتك الاستثمارية."
      },
      "post22": {
        "title": "ممارسات البناء المستدام في الأهرام للتطوير العقاري",
        "excerpt": "كيف تدمج الأهرام للتطوير العقاري مبادئ الاستدامة في مشاريعها لتوفير مساكن أكثر كفاءة وصحة",
        "content1": "تبنّت الأهرام للتطوير العقاري في مشاريعها الأخيرة جملة من ممارسات البناء المستدام التي تُقلل من استهلاك الطاقة وتحسن صحة ساكنيها. تشمل هذه الممارسات: توجيه المباني بحيث تستفيد من التهوية الطبيعية، واستخدام عازل حراري متطور في الأسقف والجدران الخارجية.",
        "content2": "على مستوى المواد، تعتمد الشركة مواد بناء موثوقة المصدر منخفضة الانبعاثات الكيميائية، ونوافذ زجاج مزدوج لتقليل الحمل على أجهزة التكييف. هذه الخيارات تُوفر على الساكن من 15% إلى 25% من فاتورة الكهرباء الشهرية.",
        "content3": "الاستدامة في البناء ليست فقط مسؤولية بيئية، بل هي قيمة مُضافة حقيقية للمشتري. الأهرام للتطوير العقاري تُؤمن بذلك وتعكسه في كل قرار تصميمي وإنشائي، لأن منزلك يجب أن يكون مريحاً ومعقول التكلفة اليومية.",
        "content4": "الترشيد في استهلاك المياه بُعد آخر للاستدامة تعتمده الشركة من خلال تركيب أدوات صرف صحي منخفضة التدفق في الحمامات والمطابخ، واعتماد مساحات خضراء بنباتات مقاومة للجفاف في الحدائق المشتركة. هذه الإجراءات تُقلل استهلاك المياه بصورة ملموسة دون أن تُخلّ بجودة الحياة التي يتوقعها ساكن تطوير راقٍ.",
        "content5": "جودة الهواء الداخلي — وهو بُعد يُغفله السوق المصري في الغالب — تُعالجه الشركة عبر انتقاء دقيق للمواد منخفضة الانبعاثات الكيميائية، وتصميم فتحات تهوية طبيعية تسمح بتجديد الهواء. الوحدات التي تتنفس جيداً وتبقى باردة طبيعياً تستدعي تكييفاً أقل، مما يُوفر على الساكن في فاتورة الكهرباء ويُحسّن صحته على المدى البعيد.",
        "content6": "تعتزم الأهرام للتطوير العقاري المضيّ نحو اعتماد شهادات البناء الأخضر في مشاريعها المقبلة، مما يُتيح للعملاء تحققاً مستقلاً من طرف ثالث بأن وحداتهم تستوفي معايير بيئية معترفاً بها دولياً — قيمة مُضافة حقيقية ليس فقط في الراحة اليومية، بل في قيمة إعادة البيع مستقبلاً."
      },
      "post23": {
        "title": "مدينة السادات مقابل مدينة السادس من أكتوبر: أين تستثمر؟",
        "excerpt": "مقارنة شاملة بين مدينتين رائدتين في محيط القاهرة الكبرى من حيث الأسعار والخدمات والعوائد",
        "content1": "مدينة السادس من أكتوبر ومدينة السادات كلتاهما في الاتجاه الغربي من القاهرة، لكن يفصل بينهما فارق سعري ملموس. أكتوبر أقرب جغرافياً للقاهرة وأعلى ثقلاً خدمياً، مما ينعكس في أسعار أعلى بنسبة 40%-60% في المتوسط.",
        "content2": "مدينة السادات تُعوّض عن البُعد الجغرافي النسبي بأسعار عقارية أكثر تنافسية وعوائد إيجارية مرتفعة نسبة لسعر الشراء. المطور العقاري الباحث عن أعلى نسبة عائد على رأس المال سيجد في السادات بيئة أفضل بكثير من أكتوبر للاستثمار بنفس الميزانية.",
        "content3": "للساكن الباحث عن خفض تكاليف المعيشة مع الحفاظ على جودة حياة مقبولة، مدينة السادات تُقدم هذا التوازن بشكل متميز. الأهرام للتطوير العقاري توفر في السادات مشاريع مُصممة لتلبية هذا التوقع بدقة.",
        "content4": "لمن يتنقل يومياً إلى القاهرة، المسافة الحقيقية تستحق النظر بموضوعية. مدينة السادس من أكتوبر تقع على مسافة 30 إلى 40 كيلومتراً من وسط القاهرة ويمكن الوصول إليها في 40 إلى 60 دقيقة في ظروف مرور عادية. أما مدينة السادات فتبعد نحو 90 كيلومتراً وتستغرق 90 دقيقة إلى ساعتين واقعياً بحسب وقت المغادرة. هذا يعني أن الساكن الذي يعمل يومياً في القاهرة سيواجه تنقلاً أطول وأكثر تكلفة من مدينة السادات. غير أن معظم سكان مدينة السادات يعملون محلياً — في المناطق الصناعية أو الجامعات أو قطاع الخدمات المتنامي — مما يجعل بُعدها عن القاهرة غير ذي أثر في حياتهم اليومية.",
        "content5": "على مستوى الشارع، تمتلك مدينة السادس من أكتوبر منظومة خدمية أكثر كثافة ونضجاً. تجارة التجزئة الكبيرة، وسلاسل المستشفيات الراسخة، والمدارس الخاصة ذات المناهج الدولية، وقطاع الترفيه والمطاعم الأوسع — كلها أكثر توفراً في أكتوبر مقارنةً بمدينة السادات. مدينة السادات تُغطي الاحتياجات اليومية الأساسية جيداً — بقالة وصيدليات وعيادات ومدارس وتجارة أساسية — لكن السكان الذين يبحثون عن خدمات متخصصة أو ترفيه يتوجهون بصورة منتظمة إلى أكتوبر أو القاهرة. هذه الفجوة تضيق مع نمو سكان مدينة السادات وقاعدتها التجارية، لكنها اعتبار صادق للأسر المعتادة على كثافة خدمية عالية.",
        "content6": "ملامح المستثمر المستفيد من كل مدينة تعكس هذه الفوارق بالمثل. أكتوبر تُناسب المستثمر ذا رأس المال الأعلى الذي يستهدف شريحة من المستأجرين من المهنيين القاهريين وعائلات الشركات والمصريين وكبار الدخل. العوائد أقل نسبةً لسعر الشراء لكن جودة المستأجر واستقرار الطلب على الوحدات راسخان بشكل عام. مدينة السادات تُناسب المستثمر الموجّه نحو العائد الذي يُخصص رأس مال أصغر ويستهدف العمال والطلاب والأسر متوسطة الدخل مستأجرين — محققاً نسبة عائد أعلى على رأس المال المستثمر حتى وإن كانت قيمة الإيجار المطلقة أدنى."
      },
      "post24": {
        "title": "كيف تختار مساحة الشقة المثالية لعائلتك؟ دليل عملي",
        "excerpt": "معايير عملية لاختيار مساحة الشقة الصحيحة بحسب حجم أسرتك وأسلوب حياتك في مدينة السادات",
        "content1": "المساحة الصحيحة للشقة ليست أكبر مساحة ممكنة، بل هي المساحة التي تُغطي احتياجاتك الفعلية دون إهدار للمال في مساحة لا تستخدمها. للأسرة المكونة من 3 أشخاص، شقة من 100-120 متراً مربعاً توفر غرفتي نوم وصالة وطعاماً مريحة.",
        "content2": "للأسرة من 4 إلى 5 أشخاص، استهدف مساحة 140-160 متراً مربعاً لاستيعاب 3 غرف نوم وصالة وطعام ومطبخ مناسب. إذا كان لديك أطفال في سن المدرسة يحتاجون إلى غرف منفصلة للمذاكرة، أضف 20 متراً مربعاً على الأقل لتوقعاتك.",
        "content3": "الأهرام للتطوير العقاري توفر مساحات متنوعة في مشاريعها بمدينة السادات تبدأ من 110 أمتار مربعة وتصل إلى 190 متراً مربعاً. زر موقعنا أو تواصل مع مستشارينا لاستعراض الخيارات المتاحة بحسب ميزانيتك.",
        "content4": "تأمين المستقبل في قرار الحجم الحالي. الزوجان اللذان يخططان لإنجاب طفل في السنتين القادمتين يستحسنان بناء غرفة النوم الإضافية في اختيارهما الراهن، لا في انتقال لاحق مكلف. بالمثل، الأسرة التي قد تستضيف أحد الوالدين في المستقبل تستفيد من غرفة مخصصة تخدم ضيفاً حتى تصبح ضرورية.",
        "content5": "لا تستهن بمساحات التخزين والممرات عند مقارنة الوحدات. شقتان بمساحة إجمالية متساوية قد تختلفان كثيراً في الإحساس الفعلي إذا أنفقت إحداهما 15 متراً على ممرات وتخزين بينما حوّلت الأخرى تلك المساحة إلى غرف صالحة للاستخدام. تفحّص المخطط دائماً وليس الرقم الإجمالي وحده.",
        "content6": "اعتبارات التمويل تُؤثر أيضاً في المساحة العملية التي تستطيع شراءها بارتياح. وحدة أكبر مع قسط شهري يضغط على ميزانيتك أسوأ من وحدة أنسب لاحتياجاتك بأقساط مريحة. مستشارو الأهرام للتطوير العقاري يساعدونك في نمذجة سيناريوهات مختلفة للمساحة والسداد حتى تختار وحدة تعيش فيها بسعادة وتدفع ثمنها باطمئنان."
      },
      "post25": {
        "title": "ميزة طريق القاهرة-الإسكندرية الصحراوي: لماذا يُميّز الموقع كل شيء",
        "excerpt": "كيف يمنح طريق القاهرة-الإسكندرية الصحراوي مدينة السادات ميزة تنافسية فريدة على خريطة العقارات المصرية",
        "content1": "طريق القاهرة-الإسكندرية الصحراوي شريان رئيسي يربط أكبر مدينتين في مصر، ومدينة السادات تجلس على هذا الطريق مباشرة. هذا الموقع يمنح المدينة إمكانية وصول استثنائية: 90 دقيقة من قلب القاهرة، و60 دقيقة من الإسكندرية في ظروف مرور عادية.",
        "content2": "هذه المركزية الجغرافية جذبت مصانع كبرى ومستودعات لوجستية تُفضل الوجود على هذا المحور الحيوي، مما عزز قاعدة فرص العمل في المدينة وزاد الطلب على السكن. كما تُتيح لساكن السادات الحركة بين القاهرة والإسكندرية بيُسر لا تتيحه المدن الداخلية.",
        "content3": "عند تقييم أي استثمار عقاري، اسأل دائماً: ما إمكانية الوصول؟ مدينة السادات تُجيب بثقة. الأهرام للتطوير العقاري تؤمن بأن الموقع ركيزة لا تُعوَّض، ولهذا اختارت السادات وجهةً لمشاريعها.",
        "content4": "المحور الصناعي على طريق القاهرة-الإسكندرية الصحراوي بالقرب من مدينة السادات يُعدّ من أبرز المحاور التصنيعية في مصر. إنتاج الأغذية والمشروبات، والنسيج، والأدوية، والكيماويات، ومواد البناء — جميعها ممثَّلة بين المصانع العاملة على هذا المحور أو بجواره. كثير من هذه المنشآت توظف آلاف العمال، يستأجر أو يشتري كثيرون منهم مسكناً في مناطق السادات السكنية. هذه الصلة المباشرة بين توظيف المصانع والطلب السكني محرك أصيل ودائم لا يعتمد على المزاج أو المضاربة.",
        "content5": "جودة الطريق وإدارة حركة المرور على طريق القاهرة-الإسكندرية الصحراوي تحسّنت تحسناً ملموساً في السنوات الخمس الأخيرة. إضافة مسارات جديدة وتحسين الإضاءة وتوفير خدمات الطوارئ الطرقية على قطاعات رئيسية قلّصت أوقات التنقل ورفعت مستوى الأمان. وبالتوازي، طوّر الداخل في مدينة السادات نفسها شبكة طرقه — بما في ذلك توسيع الشرايين التجارية والسكنية الرئيسية — مما جعل التنقل داخل المدينة أكثر سهولة مما كان عليه منذ خمس سنوات. هذه التحسينات تُعزز بعضها: طرق داخلية أفضل ترفع قيمة المناطق التي كانت في الأطراف، وطريق بين المدينتين أفضل يوسّع نطاق الاستقطاب لأرباب العمل والسكان على حد سواء.",
        "content6": "التوسع اللوجستي والصناعي على هذا المحور لا يتوقف. المشاريع المُعلنة والجارية تشمل مناطق صناعية جديدة على أراضٍ ملاصقة أو قريبة من المنطقة الصناعية القائمة في مدينة السادات، ومرافق تبريد وتوزيع موسّعة تخدم تجارة ميناء الإسكندرية، ومجمعات مستودعات خاصة تستهدف مشغّلي التجارة الإلكترونية. كل إضافة من هذه الإضافات تجلب معها وظائف جديدة وطلباً سكنياً إضافياً. المستثمر الذي يدرك هذا الخط الزمني للمشاريع يُدرك أن السوق السكني في مدينة السادات لا يسير مع النمو السكاني العام فحسب — بل يُجذب نحو الأمام بقاعدة توظيف متوسعة لها سجل امتد على أربعة عقود."
      },
      "post26": {
        "title": "الكمباوندات السكنية في مدينة السادات: دليلك الكامل",
        "excerpt": "استعراض شامل لنماذج الكمباوند المغلق في مدينة السادات ومزاياه مقارنة بالسكن في المجمعات المفتوحة",
        "content1": "الكمباوند السكني المغلق نموذج سكني يتميز بالأمن الكامل والمرافق المشتركة كالحدائق والمسابح والنوادي الرياضية، ويُتيح لساكنيه مجتمعاً متجانساً بمستوى اجتماعي متقارب. هذا النموذج يشهد إقبالاً متزايداً في مدينة السادات خاصة من الأسر الشابة.",
        "content2": "تكاليف الكمباوند أعلى من المجمعات العادية نظراً لرسوم الخدمات الشهرية التي تغطي الأمن والنظافة وصيانة المرافق. لكن الطلب الإيجاري عليه أعلى أيضاً، مما يُعوّض عن الفارق السعري بعوائد إيجارية مميزة.",
        "content3": "الأهرام للتطوير العقاري تُقدم مشاريع كمباوند في مدينة السادات تجمع بين الأمان والمرافق المتكاملة والأسعار التنافسية. إذا كان نمط الكمباوند يناسب أسلوب حياتك أو استراتيجيتك الاستثمارية، فلدينا ما يُلبي توقعاتك.",
        "content4": "قبل توقيع عقد في كمباوند، ثلاثة محاور تستوجب التحقق تحديداً بما يتجاوز تفاصيل الوحدة ذاتها. أولاً، احصل على جدول رسوم الخدمات مكتوباً وتأكد مما يُغطيه تحديداً — ينبغي أن تُفصَّل رسوم الأمن والتنظيف والمساحات الخضراء وصيانة المسبح والإدارة كل منها على حدة حتى تعرف التزامك الشهري قبل الانتقال. ثانياً، ابحث في سجل شركة الإدارة: الكمباوند الذي تُديره شركة محترفة بمراجع موثّقة من مشاريع أخرى استثمار مختلف جوهرياً عن الكمباوند الذي لم تُحسم إدارته بعد التسليم تعاقداً. ثالثاً، تحقق من أي المرافق الموعودة قائم وتشغيلي بالفعل وأيها مؤجل لمرحلة لاحقة — المرافق غير المُنجزة تحمل مخاطر التسليم.",
        "content5": "الشريحة الإيجارية التي تسعى بنشاط للسكن في كمباوندات مدينة السادات محددة المعالم نسبياً. موظفو الشركات والمديرون في المناطق الصناعية الذين يُفضّلون إبقاء أسرهم في بيئة مؤمنة مُدارة الخدمات يُمثّلون شريحة واسعة من هذا الطلب. أعضاء هيئة التدريس الجامعي وكبار الكوادر الطبية في المستشفيات المحلية شريحة أخرى ثابتة. والأزواج الشباب من الدخلين العاملين الذين يُقدّمون الأمن والمرافق المشتركة على حساب مساحة الوحدة يُكمّلون هذا المشهد. هذا الملف من المستأجرين أكثر استقراراً وأطول مدة وأعلى موثوقية مالية من المجموع العام للمستأجرين، مما يُؤثر إيجابياً على تجربة المؤجر في تحصيل دخله الإيجاري.",
        "content6": "عقارات الكمباوند في مدينة السادات تُظهر سيولة أعلى عند إعادة البيع مقارنةً بوحدات مكافئة في مباني سكنية مفتوحة. الإدارة المنظّمة والمناطق المشتركة المُصانة وسجل الأمن معاً يُشكّلون إشارة جودة موضوعية تُسرّع قرار المشتري في صفقة إعادة البيع. غير أن سيولة الكمباوند تبقى مرهونة بسمعة التطوير ذاته: كمباوند ذو مرافق مُصانة وعلاقات إيجابية مع السكان يسهل بيعه بكثير مقارنةً بكمباوند تعاني جمعيته اضطراباً ومناطقه المشتركة تدهوراً. حالة الكمباوند وقت إعادة البيع بالغة الأثر بقدر مواصفاته الأصلية."
      },
      "post27": {
        "title": "كيف تحسب العائد على الاستثمار العقاري في مدينة السادات؟",
        "excerpt": "دليل خطوة بخطوة لحساب العائد الإيجاري وعائد رأس المال لعقارك في مدينة السادات",
        "content1": "العائد على الاستثمار العقاري يقاس بمعيارين رئيسيين: العائد الإيجاري السنوي (صافي الإيجار السنوي ÷ سعر الشراء × 100)، وعائد رأس المال (نسبة ارتفاع قيمة العقار على مدى فترة الاحتفاظ). في مدينة السادات، يتراوح العائد الإيجاري الصافي بين 6% و9% سنوياً في المتوسط.",
        "content2": "لحساب العائد الإيجاري بدقة، اطرح من الإيجار السنوي: رسوم الصيانة السنوية، والضرائب العقارية، وتكاليف الإدارة إن وُجدت. النتيجة هي صافي الدخل الإيجاري. قسّمه على سعر شراء الوحدة للحصول على نسبة العائد الصافي.",
        "content3": "في مدينة السادات، الجمع بين العائد الإيجاري المرتفع نسبياً وارتفاع القيمة طويل الأمد يجعلها سوقاً جذابة للمستثمر. الأهرام للتطوير العقاري تُقدم لك تحليلاً مفصلاً للعوائد المتوقعة على أي وحدة تفكر في شرائها.",
        "content4": "ارتفاع رأس المال في مدينة السادات بلغ تاريخياً متوسط 15% إلى 25% سنوياً خلال السنوات الثلاث الماضية، مدفوعاً بارتفاع تكاليف البناء والطلب المتصاعد من الأسر الساعية للخروج من القاهرة. لحساب عائدك الإجمالي خلال خمس سنوات، اجمع بين العائد الإيجاري التراكمي والارتفاع المتوقع في القيمة — كلاهما معاً يُشكّل صورتك الاستثمارية الكاملة.",
        "content5": "لا تُغفل الضرائب وتكاليف الاحتفاظ عند بناء نموذجك للعائد. تُطبّق مصر ضريبة عقارية سنوية مبنية على القيمة الإيجارية التقديرية، وإدارة العقار المحترفة — إن لم تكن تُديره بنفسك — تستهلك عادةً 8% إلى 10% من الإيجار المحصّل. احسب هذين البندين في نسبة العائد الصافي لتتجنب توقعات متفائلة مُبالغاً فيها.",
        "content6": "الأهرام للتطوير العقاري تُزود المشترين المحتملين بجدول تحليل عائد موحّد يُنمذج العائد الإيجاري الصافي والارتفاع المتوقع في القيمة والعائد الإجمالي خلال خمس سنوات لأي وحدة متاحة. اطلبه من مستشارينا كجزء أساسي من عملية اتخاذ قرارك — المستثمر المُدرك يتخذ قرارات أفضل ويُبني شراكة أطول أمداً."
      },
      "post28": {
        "title": "الأهرام للتطوير العقاري: عشر سنوات من البناء في مدينة السادات",
        "excerpt": "رحلة الأهرام للتطوير العقاري في مدينة السادات خلال عشر سنوات من المشاريع والتسليمات والنمو",
        "content1": "منذ انطلاق مشاريعها الأولى في مدينة السادات، واصلت الأهرام للتطوير العقاري مسيرة نمو متواصلة بُنيت على أساس الثقة والجودة والالتزام. خلال العقد الماضي، سلّمت الشركة مئات الوحدات السكنية لعائلات وجدت فيها أحلامها واستثماراتها.",
        "content2": "خلال هذه السنوات، طوّرت الشركة منهجيتها في التخطيط والتنفيذ، ووسّعت شراكاتها مع مقاولين ومموّدين يضمنون أعلى مستويات الجودة. كما وسّعت محفظتها لتشمل مشاريع في أفضل مناطق مدينة السادات تلبيةً للطلب المتنامي.",
        "content3": "عشر سنوات من التجربة في سوق مدينة السادات منحت الأهرام للتطوير العقاري فهماً عميقاً لاحتياجات السكان والمستثمرين. هذا الفهم ينعكس في كل مشروع جديد نطلقه ليكون أفضل من سابقه.",
        "content4": "على مدى تلك السنوات العشر، تراكمت محطات تُمثّل نقاط تحوّل في مسيرة الشركة: أول مبنى مكتمل في المنطقة الذهبية، وأول مشروع يُطلق تطبيقاً رقمياً لخدمات السكان، وأول تطوير كمباوند يضم منطقة رياضية مجهّزة بالكامل. كل محطة كانت استجابة لما قاله العملاء إنهم يحتاجون إليه.",
        "content5": "خلف الأرقام أثر إنساني تفتخر الشركة بقياسه: مئات الأسر في مدينة السادات تُسمّي الآن وحدة أهرام بيتها. أطفال ترعرعوا في هذه المباني. أزواج شباب أسّسوا أسراً. متقاعدون وجدوا البيئة الهادئة التنظيفة التي طالما بحثوا عنها. هذا البُعد الإنساني هو ما يمنح عقود العمل معناها الحقيقي.",
        "content6": "في العقد القادم، تُواصل الأهرام للتطوير العقاري توسيع حضورها في مدينة السادات بمشاريع تعتمد تصميماً أذكى ومواد أكثر خضرةً وحزماً أوسع من المرافق. خط الإنتاج المقبل للشركة يشمل مشاريع في مناطق ناشئة ستستفيد من استثمارات بنية تحتية قيد الإنشاء حالياً — مما يُهيّئ للمستثمرين الداخلين اليوم موقعاً مثالياً للاستفادة من الارتفاع القادم في القيمة."
      },
      "post29": {
        "title": "مراكز التسوق والتجارة في مدينة السادات: دليل شامل",
        "excerpt": "استعراض لأبرز مراكز التسوق والمناطق التجارية في مدينة السادات وتأثيرها على جاذبية العقارات المجاورة",
        "content1": "تضم مدينة السادات مجموعة من مراكز التسوق والأسواق التجارية الموزعة عبر مناطقها المختلفة، توفر للسكان احتياجاتهم اليومية من البقالة والملابس والإلكترونيات والمطاعم. هذه الخدمات التجارية رفعت من جاذبية المدينة للسكن الدائم.",
        "content2": "وجود مراكز تجارية متطورة قريبة من المناطق السكنية يرفع من قيمة العقارات المحيطة بشكل ملموس. المشتري العصري لم يعد يقبل بالسكن في منطقة بعيدة عن الخدمات التجارية، لذلك المشاريع القريبة من الأنشطة التجارية تحظى بطلب أعلى وأسعار أفضل.",
        "content3": "مشاريع الأهرام للتطوير العقاري في مدينة السادات تقع في مواقع تضمن قرباً كافياً من المراكز التجارية والخدمات اليومية. نؤمن بأن راحة الساكن تبدأ من قُرب الخدمات، ونُعكس هذا الإيمان في اختياراتنا لمواقع مشاريعنا.",
        "content4": "المشهد التجاري في مدينة السادات منظّم حول عدة مراكز متمايزة. المحور التجاري الرئيسي في المنطقة الذهبية يحتضن مرافق تسوق متعددة الطوابق بمحلات كبرى وسلاسل ملابس وتجارة إلكترونيات ومطاعم. وتوجد أسواق تجارية أخرى في مناطق الخدمة المجاورة للمنطقة الصناعية تخدم الجملة والتجارة المواجهة للعمال وأنشطة المصانع. لكل منطقة سكنية أيضاً أسواقها المحلية التي تُغطي البقالة اليومية والمخابز والجزارة والخدمات الأساسية. هذه الجغرافيا التجارية متعددة الطبقات تعني أن السكان نادراً ما يحتاجون للتنقل أكثر من عشر دقائق لتلبية احتياجاتهم اليومية، في حين تستقطبهم المراكز التجارية الرئيسية في رحلات التسوق الأكبر.",
        "content5": "كثافة الخدمات التجارية تُؤثر تأثيراً قابلاً للقياس وخاصاً بالمنطقة على الطلب الإيجاري داخل مدينة السادات. الوحدات على مسافة مشي من شارع تجاري نشط تُحقق علاوة إيجارية تتراوح بين 10% و15% فوق الوحدات المماثلة في مناطق أكثر هدوءاً، وتتسم بفترات شغور أقصر بين المستأجرين. في المناطق التي لا تزال بنيتها التجارية في طور النشوء، قد تكون العوائد الإيجارية أعلى نسبةً — انعكاساً لأسعار شراء أدنى — لكن مخاطر الشغور أعلى أيضاً لأن البيئة الخدمية التي ترسّخ الطلب السكني لا تزال تتشكّل. على المستثمر تقييم ليس كثافة الخدمات التجارية الحالية فحسب، بل مسارها: المنطقة ذات التوسع التجاري المخطط كثيراً ما تكون الأوفر حظاً، شريطة أن يكون التطوير المخطط قيد التنفيذ لا مجرد إعلان.",
        "content6": "خط مشاريع التطوير التجاري في مدينة السادات نشط وملموس. شرائح تجزئة تخدم التجمعات السكنية الجديدة في المناطق الشرقية والشمالية المتوسعة قيد الإنشاء، وعدة مشاريع متعددة الاستخدامات تجمع تجارة في الطابق الأرضي وسكنياً في الطوابق العلوية تمضي للأمام. مشغّلو الأغذية والمشروبات والمراكز الطبية وخدمات التعليم يُتابعون النمو السكاني إلى هذه المناطق الأحدث مُكرِّسين نمطاً متكرراً: السكن يجلب الخدمات، التي تجلب مزيداً من السكان، الذين يُولّدون مزيداً من الطلب على الخدمات والسكن معاً. للمستثمر العقاري، تتبّع أين هذه الدورة في بدايتها لا أين اكتملت — هو المكان الذي تتواجد فيه أعلى العوائد المستقبلية في الغالب."
      },
      "post30": {
        "title": "الاستثمار في الوحدات التجارية بمدينة السادات: دليل المستثمر",
        "excerpt": "لماذا تُعدّ الوحدات التجارية في مدينة السادات فرصة استثمارية مميزة وما الذي يجب مراعاته قبل الشراء",
        "content1": "الوحدة التجارية تُدرّ عائداً إيجارياً أعلى بكثير من الوحدة السكنية في الغالب، وتمتاز بعقود إيجار أطول أمداً وملاءة مالية أفضل للمستأجرين التجاريين. في مدينة السادات، العائد الإيجاري للوحدات التجارية يتراوح بين 8% و14% سنوياً.",
        "content2": "المعايير الحاسمة لاختيار وحدة تجارية ناجحة: الموقع (حركة المرور البشرية والسيارات)، المساحة والواجهة، وطبيعة النشاط المحيط. وحدة في شارع تجاري نشط داخل حي سكني كثيف أفضل بكثير من وحدة في موقع أقل حيوية رغم مساحتها الأكبر.",
        "content3": "الأهرام للتطوير العقاري تُدرج وحدات تجارية في بعض مشاريعها بمدينة السادات مصممة لتحقيق أعلى إمكانية تشغيلية. تواصل معنا لمعرفة المتاح وتحليل العوائد المتوقعة من الاستثمار التجاري في المنطقة الذهبية.",
        "content4": "تنوّع المستأجرين التجاريين في ممرات مدينة السادات التجارية تنوّعاً ملحوظاً في السنوات الأخيرة؛ إذ لم تعد الوحدات تستضيف التجزئة التقليدية فحسب، بل باتت تحتضن صيدليات وعيادات طبية خاصة ومراكز دروس خصوصية ومحلات أغذية ومشروبات ومكاتب خدمات مهنية. هذا التنويع يُعني مزيداً من أنواع المستأجرين المحتملين لوحدتك وانخفاضاً في مخاطر الشغور حين يتراجع قطاع بعينه.",
        "content5": "عند التفاوض على عقود الإيجار التجاري، احرص على شروط تحمي مصلحتك على المدى البعيد. عقد ثلاث سنوات بشرط تصعيد سنوي بنسبة 15% يُوفر للمستأجر الاستقرار ويضمن لك دخلاً يُواكب التضخم. الأهرام للتطوير العقاري يمكنها وصلك بمديري عقارات متمرسين يُتفاوضون على مثل هذه الاتفاقيات يومياً.",
        "content6": "قبل شراء وحدة تجارية، تجاوز حسابات العائد الإيجاري إلى ما هو أعمق: تحقق من الاستخدامات المرخّصة للوحدة وفق تقسيم المناطق المحلي، وتأكد من أن القدرة الكهربائية بالأمبير تستوعب النشاط التجاري المستهدف، واستفسر عن طبيعة المستأجرين الحاليين في المبنى. الوحدة التجارية المختارة بعناية في تطوير متعدد الاستخدامات هي من بين أعلى الأصول العقارية عائداً المتاحة للمستثمر المصري اليوم."
      },
      "post31": {
        "title": "النوادي الرياضية والترفيه في مدينة السادات: دليل الحياة النشطة",
        "excerpt": "استعراض لأبرز النوادي الرياضية ومرافق الترفيه في مدينة السادات وكيف تُعزز جودة الحياة لسكانها",
        "content1": "لا تكتمل جودة الحياة في أي مدينة دون بنية ترفيهية ورياضية متكاملة، ومدينة السادات تُدرك ذلك جيداً. تضم المدينة عدداً من النوادي الرياضية التي توفر ملاعب كرة قدم ومضارب تنس وحمامات سباحة وصالات لياقة، إلى جانب مسارات المشي والجري في الأحياء الراقية.",
        "content2": "أهمية هذه المرافق لا تقتصر على الصحة البدنية، بل تمتد إلى البناء الاجتماعي للمجتمع السكاني وتمنح الأبناء بيئة آمنة للنمو. الأسرة التي تجد نادياً رياضياً قريباً تُقلل من وقت التنقل وتُكثّف وقت الجودة مع الأبناء.",
        "content3": "عند اختيار وحدتك في مدينة السادات، تحقق من قرب المشروع من النوادي والمرافق الترفيهية. مشاريع الأهرام للتطوير العقاري في المنطقة الذهبية قريبة من أبرز هذه المرافق، مما يمنح ساكنيها حياة نشطة ومتكاملة.",
        "content4": "النوادي الرياضية في مدينة السادات تعمل وفق نماذج وصول مختلفة تبعاً لجهة ملكيتها وإدارتها. بعضها مرافق يُديرها المطور مدمجة داخل كمباوندات سكنية وتكون حكراً على سكان الكمباوند ضمن حزمة رسوم الخدمات. وأخرى تعمل كنوادٍ مستقلة بعضويات مفتوحة للسكان في أرجاء المدينة وفق اشتراكات سنوية أو شهرية تتفاوت بحسب الفئة العمرية ونوع العضوية. وثمة عدد أقل من المرافق العامة أو شبه العامة ذات الدخول المدعوم تديرها عادةً الجهات الحكومية أو النقابات. معرفة النموذج المعمول به في كل ناد — والتكلفة السنوية الواقعية لأسرتك — معلومة لها وزنها حين تختار مشروعاً سكنياً جزئياً على أساس قربه من مرافق رياضية.",
        "content5": "وجود ناد رياضي داخل مشروع سكني أو ملاصق له مباشرةً يُؤثر تأثيراً إيجابياً قابلاً للقياس على التسعير الإيجاري في مدينة السادات. الوحدات التي تستطيع تسويق النادي بوصفه ميزة مدرجة أو متاحة على الفور تحقق عادةً علاوة إيجارية تتراوح بين 8% و12% فوق الوحدات المماثلة في مشاريع تفتقر لهذه الخاصية. هذه العلاوة تعكس تفضيلاً حقيقياً لدى المستأجر: الأسر ذات الأبناء، والمهنيون المعنيون بصحتهم، وكبار السن خاصةً يعتبرون إمكانية الوصول إلى النشاط الرياضي والترفيهي معياراً لجودة الحياة يُؤثر مباشرةً في استعدادهم للدفع ومدة إقامتهم. متوسط مدة إيجار أطول في ذاته ذو قيمة مالية للمؤجر لأنه يُقلص تكاليف التناوب ومخاطر الشغور.",
        "content6": "خارج نموذج النادي الرياضي الرسمي، تُقدم مدينة السادات خيارات ترفيه خارجي تحسّنت بالتوازي مع التطور السكاني للمدينة. مسارات مخصصة للجري والمشي موجودة في المنطقة الذهبية وعدة أحياء راقية. ممشيات خضراء وممرات مفتوحة — مُدرجة في التخطيط العمراني لمدينة السادات منذ تصميمها المبكر — توفر أماكن للنشاط الخارجي غير الرسمي. مناطق لعب الأطفال والحدائق الصغيرة موزّعة في المناطق السكنية بجودة متفاوتة. للأسر والمشترين الذين يُقيّمون أسلوب الحياة، يُشكّل الجمع بين المرافق الرياضية الرسمية والمساحات الخارجية المتاحة ميزة حقيقية تُميّز المنطقة الذهبية والأحياء الراقية المماثلة عن المناطق السكنية الأكثر أساسية داخل المدينة."
      },
      "post32": {
        "title": "الجامعات في مدينة السادات: منظومة تعليمية تدعم الاستثمار العقاري",
        "excerpt": "كيف تُسهم الجامعات الخاصة والحكومية في مدينة السادات في رفع الطلب على الإيجار وتعزيز القيمة العقارية",
        "content1": "تحتضن مدينة السادات عدداً من الجامعات الحكومية والخاصة التي تستقطب آلاف الطلاب من مختلف المحافظات سنوياً. هذا التجمع الطلابي يخلق طلباً ثابتاً ومتجدداً على الوحدات السكنية الصغيرة والمتوسطة في المناطق المحيطة.",
        "content2": "الاستثمار في شقق قريبة من الجامعات بمدينة السادات يُدر عوائد إيجارية مرتفعة نسبياً وبشغور منخفض، إذ يجدد الطلاب الجدد الطلب في بداية كل عام دراسي. هذا النوع من الاستثمار يناسب المستثمر الذي يبحث عن دخل إيجاري منتظم بأقل مخاطر الشغور.",
        "content3": "الأهرام للتطوير العقاري تمتلك مشاريع في مناطق تستفيد من القرب من هذا الحزام التعليمي. إذا كانت العوائد الإيجارية الثابتة هي هدفك الأول، فالمنطقة الجامعية في مدينة السادات هي الجواب.",
        "content4": "الجامعات المتمركزة في مدينة السادات قوية بشكل خاص في المجالات التطبيقية والتقنية. كليات الهندسة — التي تشمل تخصصات المدني والميكانيكي والكهربائي وهندسة الحاسوب — تستقطب أعداداً كبيرة من الملتحقين. الطب البيطري والعلوم الزراعية بارزان أيضاً، وهو انعكاس لقرب المدينة من قلب الزراعة في الدلتا. وتستكمل البرامج العلمية والطبيعية منظومة العروض الأكاديمية. هذا التركيز في التخصصات التطبيقية يعني أن الخريجين يجدون توظيفاً مباشراً في القاعدة الصناعية الإقليمية في الغالب، ما يُشكّل مساراً من المستأجر الطالب إلى الساكن الموظف يُديم الطلب السكني بما يتجاوز الدورة الأكاديمية الصرفة.",
        "content5": "التقويم الأكاديمي يُنشئ نمطاً إيجارياً موسمياً متوقعاً ينبغي للمستثمر فهمه والتخطيط على أساسه. الطلب على الوحدات القريبة من الجامعات يبلغ ذروته بشكل حاد في سبتمبر وأكتوبر مع افتتاح العام الدراسي، ثم يتكرر في فبراير في الجامعات ذات قبول الفصل الدراسي الثاني. مخاطر الشغور تبلغ أعلى مستوياتها في يوليو وأغسطس حين يعود كثير من الطلاب إلى محافظاتهم في الصيف. المستثمرون الذين يُقدّمون وحدات مفروشة بخيارات إيجار صيفي قصير الأمد أو الذين يُبرمون عقوداً تمتد لمدة العام الأكاديمي بدلاً من السنة التقويمية يستطيعون إدارة هذه الموسمية بفاعلية. بعض الملاك في الحزام الجامعي يُبلّغون عن شغور شبه معدوم بفضل إدارتهم الاستباقية لدورات تجديد العقود بدلاً من الانتظار.",
        "content6": "للمستأجرين من الطلاب متطلبات محددة للوحدة تُحدد ما يُؤجَّر بسهولة في المناطق الجامعية وما لا يُؤجَّر. القرب من الحرم الجامعي — مشياً أو بركوب ميكروباص قصير — هو معيار الاختيار الأول لمعظم الطلاب. الإنترنت السريع الموثوق بات غير قابل للتفاوض عملياً: ضعف الاتصال يُقصي الوحدة لدى معظم الطلاب بغض النظر عن مزاياها الأخرى. الأمن بالغ الأهمية، خاصةً للأسر التي تُسكن بناتها في سكن الطلبة. الوحدات ذات الدخول المؤمّن والإضاءة الجيدة في المناطق المشتركة والإدارة المُستجيبة هي الأكثر طلباً باستمرار. مستوى التأثيث مهم أيضاً: أثاث أساسي متين يُوفره المؤجر يُفضّله كثير من الطلاب القادمين بممتلكات محدودة على الوحدة غير المفروشة."
      },
      "post33": {
        "title": "مراحل البناء في مشاريع الإسكان المصرية: ما الذي يحدث من وضع الحجر إلى التسليم؟",
        "excerpt": "دليل خطوة بخطوة يشرح مراحل إنشاء المبنى السكني في مصر ويساعد المشتري على فهم تقدم مشروعه",
        "content1": "يمر المبنى السكني بست مراحل رئيسية من البداية إلى التسليم: الحفر وأعمال الأساس، ثم الهيكل الخرساني، فالبناء والطوب، ثم المرافق (كهرباء وسباكة وتكييف)، ثم التشطيبات الداخلية، وأخيراً الأعمال الخارجية والمشتركة.",
        "content2": "كل مرحلة لها مدة زمنية معتادة تعتمد على حجم المبنى وعدد الأدوار. الهيكل الخرساني لمبنى من 6 أدوار يستغرق عادة 4-6 أشهر، بينما تستغرق التشطيبات 3-5 أشهر. مجموع الفترة من الحفر إلى التسليم يتراوح عادة بين 18 و30 شهراً.",
        "content3": "معرفة هذه المراحل تُعينك على متابعة تقدم مشروعك بشكل واعٍ والتحقق من أن التطور يسير وفق الجدول. الأهرام للتطوير العقاري تُعلم عملاءها بتحديثات دورية عن مرحلة البناء الراهنة ويمكن لأي مشترٍ زيارة الموقع للتحقق الميداني.",
        "content4": "في زيارات الموقع، اعرف ما تبحث عنه في كل مرحلة. في مرحلة الهيكل الإنشائي، تفحّص توحيد أبعاد الأعمدة الخرسانية وانتظام توزيع حديد التسليح — أي اضطراب هنا مكلف الإصلاح لاحقاً. في مرحلة التشطيب، افحص استواء الأبواب والنوافذ، ووحدة فجوات البلاط، وجودة تركيب مآخذ الكهرباء. طرح أسئلة تقنية محددة يُوصل للمطور رسالة واضحة: أنت مشترٍ مُدرك.",
        "content5": "إشارات تحذير تستدعي حواراً مباشراً مع المطور: توقف الإنشاء لأكثر من ثلاثة أسابيع دون تفسير، وتغيير مواصفات مذكورة في العقد دون ملحق رسمي، والتحفظ على السماح بزيارات ميدانية للمشترين. لا يعني أيٌّ من هذه العلامات بالضرورة إشكالية قانونية، لكن كلاً منها يستوجب إجابة مكتوبة صريحة من المطور قبل المضيّ.",
        "content6": "تُطبّق الأهرام للتطوير العقاري بروتوكول ضبط جودة متعدد المراحل في كل مرحلة إنشاء: توقيع مهندس مستقل عند اكتمال الأساس، واختبار نسبة خلط الخرسانة في مرحلة الهيكل، وجلسة معاينة يُرافق فيها العميل الفريق التقني قبيل التسليم للتحقق من مطابقة التنفيذ للمواصفات المتعاقَد عليها. هذا الإشراف متعدد الطبقات يمنح المشتري ثقة مبنية على الإجراء لا على حسن النية وحده."
      },
      "post34": {
        "title": "خدمة ما بعد البيع في الأهرام للتطوير العقاري: لأن علاقتنا لا تنتهي بالتسليم",
        "excerpt": "نستعرض منظومة خدمة ما بعد البيع التي تقدمها الأهرام للتطوير العقاري لعملائها بعد استلام وحداتهم",
        "content1": "تسليم مفتاح الوحدة ليس نهاية العلاقة بين المطور والعميل، بل هو بداية مرحلة جديدة. الأهرام للتطوير العقاري تُدرك ذلك وتوفر منظومة خدمة ما بعد البيع تشمل: ضمان الإنشاء لمدة سنة على العيوب الإنشائية، وصيانة المرافق المشتركة، وفريق دعم لمتابعة أي ملاحظات.",
        "content2": "تعتمد الشركة على قناة تواصل مباشرة مع العملاء بعد التسليم لمتابعة حالة الوحدات وحل أي إشكاليات تنشأ في فترة التشغيل الأولى. الشفافية في التعامل مع الملاحظات وسرعة الاستجابة هما ركيزتا هذه الخدمة.",
        "content3": "نؤمن في الأهرام للتطوير العقاري بأن المشتري الراضي هو أفضل سفير لنا. لهذا نستثمر في جودة خدمة ما بعد البيع بنفس الجدية التي نستثمر بها في جودة البناء — كلاهما يعكسان التزامنا الحقيقي تجاه عملائنا.",
        "content4": "إجراء الضمان بسيط وموثّق. حين يُبلّغ العميل عن ملاحظة بعد الاستلام، يُقدّمها عبر القناة المخصصة ويتلقى تأكيد استلام خلال 48 ساعة. يزوره ممثل تقني خلال أسبوع لتقييم المشكلة، وتُجدوَل أعمال الإصلاح وتُنفَّذ ضمن نافذة الضمان. كل حالة مُسجَّلة ومتابَعة ومُغلَقة بموافقة العميل — لا شيء يضيع بين الشقوق.",
        "content5": "أكثر الملاحظات شيوعاً بعد استلام الوحدات في المباني السكنية المصرية تتعلق بالسباكة والطلاء وتفاصيل التشطيب — وكلها مشمولة بضمان الإنشاء والتشطيب. نتعامل معها بشكل استباقي لا انتظاري. كثير من العملاء يخبروننا أن تجربتهم في معالجة الملاحظة بنت لديهم ثقة أكبر من تجربة الشراء الأصلية، لأن ذلك هو اللحظة التي يُثبت فيها المطور حقيقة التزامه.",
        "content6": "للتخطيط طويل الأمد للصيانة، تُزوّد الأهرام للتطوير العقاري المالكين الجدد بتقويم صيانة للمبنى يُحدّد الفترات الموصى بها لخدمة سخانات المياه ولوحات الكهرباء وتركيبات السباكة ومعدات المناطق المشتركة. هذا التوجيه الاستباقي يُقلل من تكاليف الإصلاح المفاجئ ويُعين المالكين على الحفاظ على حالة وحداتهم وقيمتها عبر السنين."
      },
      "post35": {
        "title": "الجامعات الخاصة في مدينة السادات: دليل الآباء والمستثمرين",
        "excerpt": "نظرة على أبرز الجامعات الخاصة في مدينة السادات وكيف تُشكّل عاملاً حاسماً في قرارات السكن والاستثمار",
        "content1": "تضم مدينة السادات عدداً من الجامعات الخاصة ذات السمعة الأكاديمية المتنامية في تخصصات الهندسة والإدارة والطب البيطري والعلوم. هذه الجامعات تستقطب سنوياً آلاف الطلاب من محافظات منوفية والجيزة والإسكندرية والقاهرة.",
        "content2": "للأسرة التي لديها أبناء في مرحلة الجامعة، السكن في مدينة السادات قرار ذكي يُلغي تكاليف الإيجار والتنقل اليومي. للمستثمر، القرب من الجامعات الخاصة يعني طلباً إيجارياً مستداماً يتجدد في بداية كل عام دراسي.",
        "content3": "الأهرام للتطوير العقاري تفهم هذه المعادلة وتُقدم وحدات في مناطق قريبة من هذا الحزام الجامعي. تواصل معنا لمعرفة المشاريع الأكثر قرباً من الجامعات الخاصة في المنطقة الذهبية.",
        "content4": "رسوم الدراسة في الجامعات الخاصة بمدينة السادات تتباين تبايناً ملحوظاً بحسب المؤسسة والكلية، لكن النطاق العام للطلاب المصريين يتراوح من نحو 35,000 إلى 120,000 جنيه مصري سنوياً بحسب التخصص وموضع الجامعة في السوق. هذا المستوى من الرسوم يعني أن طلاب الجامعات الخاصة في مدينة السادات ينحدرون في الغالب من أسر متوسطة إلى متوسطة-عليا — ليست ثرية بما يكفي لإيداع أبنائها في أرقى مؤسسات القاهرة، لكن لديها دخل يُتيح التعليم الخاص خارج العاصمة. بالنسبة للمستثمر العقاري، هذا يعني أن الشريحة الإيجارية بالقرب من الجامعات الخاصة تمتلك قدرة ذات معنى على دفع إيجارات معقولة بانتظام، مما يُقلص مخاطر التخلف عن السداد والشغور مقارنةً بالمجتمعات الطلابية في مناطق أكثر تنوعاً اقتصادياً.",
        "content5": "أعداد الملتحقين بالجامعات الخاصة في مدينة السادات في مسار نمو مستمر ويُتوقع أن يتواصل هذا الاتجاه. الهرم السكاني الشاب في مصر والقبول الاجتماعي المتسع للتعليم العالي الخاص بديلاً عن الجامعات الحكومية المكتظة كلاهما يدعمان نمواً مستداماً في الالتحاق. هذا وثيق الصلة بالمستثمر العقاري لأن الطلب الإيجاري بالقرب من هذه الجامعات طلب مُشتق: يتنامى مع الالتحاق الذي يرتكز على ركيزة ديموغرافية مواتية بنيوياً على مدى العقد القادم. المستثمر الداخل لهذا السوق الآن يُؤسس موقعه على مسار طلب إيجاري يمتلك زخماً تصاعدياً حقيقياً، لا على سوق بلغ ذروته.",
        "content6": "أنواع الوحدات الأكثر طلباً بالقرب من الجامعات الخاصة في مدينة السادات تتبع نمطاً واضحاً. الوحدات أحادية الغرفة والاستوديوهات بمساحة 55 إلى 75 متراً مربعاً تُناسب الطالب الفردي أو زوج من الطلاب وتُمثّل الشريحة الأوسع من حيث حجم التداول الإيجاري. الوحدات ذات الغرفتين من 80 إلى 100 متر تخدم مجموعات طلابية صغيرة أو طلاباً يتشاركون لتخفيض التكاليف، وتستقطب أيضاً أعضاء هيئة التدريس الجدد وموظفي الدعم الجامعي. الوحدات المفروشة تتفوق باستمرار على غير المفروشة في هذا القطاع الفرعي — التناوب المرتبط بدورات المستأجرين السنوية يجعل التأثيث المُصان ميزة تمييزية قوية. القرب من الجامعة في خمس دقائق مشياً أو عشر دقائق بوسيلة نقل محلية هو معيار الموقع الأول الذي يتغلب على تقريباً كل خصائص الوحدة الأخرى."
      },
      "post36": {
        "title": "التدقيق في عقود الشراء العقاري في مصر: حقوقك ومسؤولياتك",
        "excerpt": "دليل قانوني مبسّط لفهم بنود عقود شراء العقارات في مصر وأهم النقاط التي يجب التدقيق فيها",
        "content1": "عقد شراء العقار هو الوثيقة القانونية التي تحمي حقوقك كمشترٍ. قبل التوقيع، تأكد من وجود هذه البنود الجوهرية: وصف دقيق للوحدة بالمساحة والموقع والدور، وسعر البيع الإجمالي وجدول السداد المفصّل، وموعد التسليم مع غرامة التأخير، ومواصفات التشطيب.",
        "content2": "تحقق كذلك من: صحة بيانات المطور وترخيصه، وأن الأرض مسجلة وخالية من أي نزاعات أو رهونات، وأن البناء مرخص من الجهة المختصة. أي غموض في هذه النقاط يستوجب التوضيح قبل التوقيع ولا يُستهان به.",
        "content3": "الأهرام للتطوير العقاري تُقدم عقوداً واضحة ومفصّلة تحمي حقوق المشتري بالكامل. ننصح كل عميل بالاستعانة بمحامٍ لمراجعة أي عقد قبل التوقيع عليه — الوقت المستثمر في المراجعة يُوفر مشكلات كثيرة لاحقاً.",
        "content4": "انتبه بشكل خاص إلى جدول السداد وما يترتب على الغياب عن قسط. العقود الموثوقة تتضمن فترة علاج محددة — عادة 30 إلى 60 يوماً — قبل تفعيل أي غرامة أو بند فسخ. العقود التي تُجيز للمطور الفسخ مع الاحتفاظ بجميع ما دُفع دون سابق إنذار بعد قسط واحد متأخر، عقود تستحق التفاوض أو الانسحاب.",
        "content5": "بنود الغرامات والقوة القاهرة تستحق الفحص بالقدر ذاته. بند غرامة التأخير الذي يُحدد تعويضاً يومياً رمزياً لا يُشكّل حماية فعلية للمشتري. وبند قوة قاهرة مفتوح الصياغة قد يُعذر المطور من أي إخفاق في التسليم. ابحث عن بنود محددة ومحدودة زمنياً ومتوازنة — العقد الجيد يحمي الطرفين لا طرفاً واحداً.",
        "content6": "بعد التوقيع، أوْلِ التسجيل الرسمي أولوية قصوى — سواء تسجيل العقد أو الوصول إلى سند الملكية النهائي عبر الشهر العقاري. منظومة التسجيل الرقمي في مصر تحسّنت بشكل ملحوظ وباتت الإجراءات أكثر يُسراً رغم بيروقراطيتها. سند الملكية المُسجَّل هو أقوى حماية قانونية للمشتري — فهو يُرسّخ الملكية بصورة لا يستطيع أي عقد خاص وحده أن يُحققها."
      },
      "post37": {
        "title": "المدارس والتعليم في مدينة السادات: دليل الأسرة المُنتقلة",
        "excerpt": "استعراض للمنظومة التعليمية في مدينة السادات من مدارس حكومية وخاصة ودولية لمساعدة الأسر على اتخاذ قرار الانتقال",
        "content1": "تتوفر في مدينة السادات منظومة تعليمية متكاملة تشمل مدارس حكومية في كل حي، ومدارس خاصة ذات مستويات أكاديمية متفاوتة، وعدداً من المدارس الخاصة التي تتبع المناهج الوطنية المطورة. الاختيار بينها يعتمد على الميزانية والتوجه الأكاديمي المرجو.",
        "content2": "للأسر التي تبحث عن التعليم الدولي، ثمة مدارس تتبع المنهج البريطاني أو الأمريكي في المناطق الراقية بالمدينة. رسومها أعلى نسبياً لكنها تُوفر بيئة تعليمية تنافسية وتُعدّ الطلاب لمواصلة تعليمهم العالي في مصر أو خارجها.",
        "content3": "وجود خيارات تعليمية متنوعة هو عامل رئيسي يجذب الأسر للإقامة الدائمة في مدينة السادات. الأهرام للتطوير العقاري تُراعي هذا العامل في اختيار مواقع مشاريعها لتضمن قرباً مناسباً من أبرز المؤسسات التعليمية.",
        "content4": "هيكل الرسوم عبر مستويات المدارس في مدينة السادات يحمل دلالات مباشرة على الملف الدخلي لأسر السكان. المدارس الحكومية مجانية اسمياً مع رسوم إدارية بسيطة، وتخدم أوسع نطاق من الدخول وتستقطب في الغالب أسر العمال والطبقة المتوسطة-الدنيا. المدارس الخاصة الوطنية — التي تتبع المنهج المصري بمرافق أفضل وأحجام فصول أصغر — تتقاضى رسوماً سنوية تتراوح من نحو 8,000 إلى 25,000 جنيه للطالب، وتستقطب الأسر متوسطة الدخل. أما المدارس الخاصة الدولية التي تتبع المناهج البريطانية أو الأمريكية فتعمل في نطاقات أعلى بين 50,000 و180,000 جنيه سنوياً، وهو مؤشر على أسرة بدخل أعلى بكثير وتفضيل راسخ للمؤهلات المعترف بها دولياً. للمستثمر، كثافة كل مستوى مدرسي في محيط معين مؤشر موثوق على الملف الدخلي للمجتمع السكاني المحيط.",
        "content5": "القرب من المدارس من أكثر محركات اختيار الشقق ثباتاً لدى الأسر المنتقلة إلى مدينة السادات. الأسر ذات الأبناء في سن الدراسة تُحدد عادةً أقصى وقت قبول للتنقل إلى المدرسة قبل أن تبدأ البحث العقاري — خمس عشرة إلى عشرون دقيقة في الغالب — ثم تُصفّي جميع الخيارات المتاحة ضمن تلك الدائرة. هذا السلوك يعني أن الوحدات داخل نطاق خدمة مدرسة خاصة محل ثقة تحقق علاوة ملموسة في سعر الشراء وفي الطلب الإيجاري. كما يعني أن افتتاح مدرسة جديدة أو رقي مدرسة قائمة لمستوى منهجي أعلى يُحدث تحولاً في أنماط الطلب في الشوارع المحيطة خلال عام أو عامين أكاديميين.",
        "content6": "عرض المدارس في مدينة السادات مُرشَّح للتوسع مع نمو سكان المدينة. عدة مشغّلي مدارس خاصة يُدرسون افتتاح حرمات جديدة في مدينة السادات مستقطَبين بالسكان المتوسطي الدخل المتنامين وأسعار الأراضي المعقولة نسبياً مقارنةً بالقاهرة الكبرى. الحرمات الجديدة التي تتبع المناهج الوطنية المطورة وفي بعض الحالات الاعتمادات الدولية ستُوسّع الخيارات المتاحة للأسر وتُقلص العلاوة الحالية التي تفرضها المدارس الخاصة القائمة. للمستثمر، افتتاح مدرسة جديدة بالقرب من مشروع سكاني قائم عادةً حدث إيجابي للطلب يرفع جاذبية المشروع للمستأجرين والمشترين من الأسر — سبب إضافي لمتابعة خط عرض التعليم كجزء من رصد السوق المستمر."
      },
      "post38": {
        "title": "المرافق الصحية في مدينة السادات: دليل شامل للمستشفيات والعيادات",
        "excerpt": "نظرة على المنظومة الصحية في مدينة السادات وكيف تُعزز جاذبيتها للإقامة الدائمة",
        "content1": "تضم مدينة السادات عدداً من المستشفيات الحكومية والخاصة الموزعة عبر مناطقها الرئيسية، توفر خدمات طبية شاملة من الطوارئ والإقامة وعمليات الجراحة إلى العيادات التخصصية. هذه البنية الصحية جزء أساسي من جاذبية المدينة للأسر.",
        "content2": "على مستوى الرعاية الأولية، تنتشر في مدينة السادات عيادات ومراكز صحية وصيدليات في معظم الأحياء، مما يُتيح الحصول على الرعاية الطبية الأساسية بسهولة دون الحاجة للتنقل إلى القاهرة إلا في الحالات الدقيقة.",
        "content3": "توفر الرعاية الصحية الجيدة بالقرب من السكن اعتبار مهم للأسر عند اختيار مكان الإقامة، خاصة لمن لديهم أطفال أو كبار سن. مشاريع الأهرام للتطوير العقاري تُراعي هذا العامل ضمن معايير اختيار المواقع.",
        "content4": "يمكن لسكان مدينة السادات الحصول على طيف ذي معنى من الخدمات الطبية التخصصية دون التنقل إلى القاهرة. عيادات القلب ذات القدرة التشخيصية — بما يشمل الموجات فوق الصوتية على القلب واختبارات الجهد — تعمل في المستشفيات الخاصة الأكبر في المدينة. خدمات العظام التي تُغطي الإصابات الحادة والعمليات الانتخابية للمفاصل متوفرة. خدمات الأمومة بما تشمل التوليد وأمراض النساء ورعاية حديثي الولادة مُقدَّمة في عدة منشآت، وهو انعكاس للتركيبة الديموغرافية الشابة للمدينة. خدمات طب الأطفال بعيادات خارجية وأجنحة استشفاء قائمة. وبينما تتطلب حالات الأورام المعقدة والجراحة العصبية المتقدمة التحويل إلى منشآت القاهرة المتخصصة في الغالب، فإن نطاق الرعاية التخصصية الاعتيادية والمتوسطة التعقيد المتوفرة محلياً توسّع توسعاً جوهرياً ويُغطي احتياجات غالبية السكان في إدارتهم الصحية اليومية.",
        "content5": "جودة الرعاية الصحية في مدينة السادات تحسّنت بشكل مرئي خلال السنوات الخمس الماضية، مدفوعةً في المقام الأول بالاستثمار الخاص لا بالتوسع الحكومي. مراكز ومستشفيات طبية خاصة جديدة فُتحت في المنطقة الذهبية والمناطق المجاورة، تعمل فيها أطقم من أطباء يُدوّرون من القاهرة أو اختاروا الإقامة الدائمة في مدينة السادات. التكنولوجيا التشخيصية — التصوير المقطعي والموجات فوق الصوتية والأشعة الرقمية والمختبرات — واكبت دخول القطاع الخاص وقلّصت الحاجة للتنقل لإجراء الفحوصات. أبرز التحسن كان في اتساع رعاية المستوى الأول والثاني؛ السكان الذين كانوا يتوجهون منتظماً إلى القاهرة للاستشارات التخصصية الاعتيادية باتوا يجدون رعاية كافية أو مكافئة محلياً.",
        "content6": "خط مشاريع الرعاية الصحية في مدينة السادات نشط. عدة مشاريع لمستشفيات ومراكز طبية خاصة مخطط لها أُعلن عنها أو هي في مراحل بناء أولية، تستهدف السكان متوسطي الدخل المتنامين في المدينة. سلاسل صيدليات جديدة ومراكز أسنان وعيادات علاج طبيعي وخدمات بصريات تُتابع النمو السكاني إلى المناطق الأحدث. على المدى البعيد، خطط لتوسيع طاقة المستشفيات الحكومية لخدمة السكان المتنامين تندرج ضمن التزامات البنية التحتية لدى الجهات الحكومية المعنية. على المستثمرين والمشترين للسكن الأسري النظر إلى هذا المسار باعتباره تعزيزاً تدريجياً لركيزة جوهرية في جودة الحياة — ركيزة تحسّنت تحسناً ملحوظاً بالفعل ويقف خلفها استثمار مستمر."
      },
      "post39": {
        "title": "عقلية الأسرة مقابل عقلية المستثمر في شراء العقار: أيهما أنت؟",
        "excerpt": "تمييز مهم بين مدخل شراء العقار كمسكن وشرائه كاستثمار وكيف يؤثر هذا التمييز على قرارك",
        "content1": "المشتري الأسري يُقيّم الوحدة بمعايير الراحة اليومية: قرب المدارس والمستشفيات والأسواق، وحجم الغرف وتوزيعها، والطابق والإطلالة. أولويته هي جودة حياة أسرته وليس العائد المالي الأقصى.",
        "content2": "المستثمر يُقيّم الوحدة بمعايير مختلفة: العائد الإيجاري المتوقع، ونسبة الارتفاع في قيمة العقار، وسهولة البيع والتسييل مستقبلاً. قد يختار وحدة أصغر أو في طابق أقل لأن تكلفتها ترفع العائد على رأس المال.",
        "content3": "بعض المشترين يجمعون بين الهدفين: يشترون وحدة للسكن مع الوضع في الاعتبار مستقبلاً بيعها بربح. هذا النهج يتطلب توازناً دقيقاً. الأهرام للتطوير العقاري يمكنها مساعدتك في اتخاذ القرار الأنسب وفق هدفك الأساسي.",
        "content4": "استراتيجية الاستخدام المزدوج تنجح حين يُختار الموقع ونوع الوحدة بحيث يُلبّي المعيارين في آنٍ واحد. وحدة ثلاث غرف في مبنى محكوم الصيانة قريب من جامعة أو مستشفى تُلبّي احتياج الأسرة بالسكن المريح، وتستوفي في الوقت ذاته معايير الطلب الإيجاري القوي حين يقرر أصحابها الانتقال. تحقيق هذا التوافق يتطلب تحليلاً مسبقاً لكنه يُؤتي ثماره في المرونة طويلة الأمد.",
        "content5": "اعتبارات التوقيت تختلف بحسب الهدف. المشتري الأسري أقل تأثراً بدورات السوق لأنه يُخطط للاحتفاظ بالوحدة طويلاً — الوقت المناسب هو حين تكون جاهزاً وتناسبك الوحدة. المستثمر بالمقابل يستفيد من الدخول في فترات ضعف السوق أو في مرحلة الإطلاق المبكر حين تكون الأسعار أكثر قابلية للتفاوض ومساحة الارتفاع أوسع.",
        "content6": "مستشارو الأهرام للتطوير العقاري مدرَّبون على البدء بفهم هدفك الأساسي قبل عرض أي وحدة. المشتري الأسري يُقدّمون له التخطيط والطابق والإطلالة والقرب من الخدمات. المستثمر تبدأ المحادثة معه من تقديرات العائد وتوقيت الخروج. والجامع بين الهدفين يُساعدونه في إيجاد الوحدة التي تتقاطع فيها المعيارتان — وهي قائمة أقصر لكن أجدى بكثيراً."
      },
      "post40": {
        "title": "شبكة النقل والمواصلات في مدينة السادات: روابط تُيسّر الحياة",
        "excerpt": "دليل شامل لوسائل النقل المتاحة داخل مدينة السادات وللوصول إليها من القاهرة والإسكندرية والمحافظات",
        "content1": "يمكن الوصول إلى مدينة السادات بسهولة عبر طريق القاهرة-الإسكندرية الصحراوي من القاهرة، وعبر طريق الإسكندرية-الصحراوي القادم من الإسكندرية. كما تتوفر خطوط سيارات الأجرة المشتركة والميكروباص من مركز شبين الكوم عاصمة منوفية وبعض المحافظات المجاورة.",
        "content2": "داخل المدينة، تنتشر وسائل النقل الصغيرة كالميكروباص والتوك توك التي تربط مناطق المدينة المختلفة. الشوارع الرئيسية واسعة وتستوعب حركة مرور جيدة، وتوقف السيارات الخاصة متاح وغير مكلف مقارنة بالمدن الكبرى.",
        "content3": "مع التحسينات المستمرة في شبكة الطرق والإعلان عن مشاريع ربط جديدة، تتحسن إمكانية الوصول إلى مدينة السادات تدريجياً. هذا التحسن ينعكس إيجابياً على أسعار العقارات ويجعل الاستثمار فيها قراراً سليماً.",
        "content4": "تحسينات النقل المحددة في السنوات الأخيرة عزّزت الاتصالية بشكل ملموس. صيانة الطريق وإعادة رصفه على قطاعات رئيسية من طريق القاهرة-الإسكندرية الصحراوي قلّصت التعطل في التنقل. داخل مدينة السادات، أسهمت تحسينات إضاءة الشوارع على الطرق الرئيسية وإضافة مناطق تحميل وتفريغ مخصصة في الأحياء التجارية في تنظيم الحركة اليومية. كذلك ازدادت كثافة وسائل النقل غير الرسمية — أساساً شبكات السيارات الأجرة المشتركة والميكروباص — مع نمو سكان المدينة، مما قلّص أوقات الانتظار على الخطوط الرئيسية مقارنةً بما كان قبل خمس سنوات. وفي حين لم تكتمل بعد وصلة نقل جماعي كبرى كخط سكك حديدية أو نظام حافلات سريعة مخصصة، فإن التجربة العملية للتنقل اليومي داخل المدينة وإليها تحسّنت بشكل قابل للقياس.",
        "content5": "بالنسبة للساكن الموظف في القاهرة المتنقل يومياً من مدينة السادات، الحسابات الواقعية للتكلفة مهمة. سيارة أجرة مشتركة أو ميكروباص إلى شبين الكوم تلي اتصالها بالقاهرة هي الخيار العام الأكثر شيوعاً، بإجمالي يتراوح تقريباً بين 50 و80 جنيهاً ذهاباً بحسب الخط والدرجة — تكلفة يومية ذات وزن عند مستويات التضخم الحالية تجعل امتلاك السيارة الخاصة جذاباً للمتنقلين المنتظمين. تكاليف السيارة الخاصة — وقوداً ورسوم طريق واستهلاكاً — تُشكّل نسبة أقل من تكلفة كل رحلة لمن يمتلك سيارة بالفعل. هذا الواقع التكلفوي يُرسّخ أن مدينة السادات تعمل اقتصادياً بشكل أمثل للساكن الذي يعمل محلياً، وأن التنقل اليومي إلى القاهرة، رغم إمكانيته، التزام مالي وزمني مستمر يُؤثر على جودة الحياة.",
        "content6": "جودة البنية التحتية للنقل لها تأثير قابل للقياس ومحدد بالمنطقة داخل مدينة السادات. المناطق الملاصقة مباشرةً لطريق القاهرة-الإسكندرية الصحراوي أو للطرق الشريانية الداخلية الرئيسية — خاصة المنطقة الذهبية والمحور المركزي — تستفيد من اتصالية متفوقة وأوقات تنقل داخلية أقصر، مما يُحقق علاوة ملموسة في أسعار الشراء والإيجارات مقارنةً بالمناطق الواقعة في أطراف المدينة حيث تتراجع جودة الطرق وتردد وسائل النقل. للمستثمر الذي يُقيّم مشاريع متعددة، موقع المنطقة نسبةً لشبكة الطرق الرئيسية في مدينة السادات إشارة جودة موقع دائمة لن تتآكل وتميل إلى التراكم في القيمة مع تطور البنية التحتية المحيطة."
      },
      "post41": {
        "title": "سوق العقارات في مدينة السادات 2025-2026: اتجاهات وأرقام",
        "excerpt": "تحليل موضوعي لاتجاهات سوق العقارات في مدينة السادات خلال 2025-2026 وأبرز المؤشرات التي تهم المستثمر",
        "content1": "شهد سوق العقارات في مدينة السادات خلال عام 2025 ارتفاعاً ملحوظاً في الأسعار بلغ متوسطه 18%-25% مقارنة بالعام السابق، مدفوعاً بارتفاع تكاليف مواد البناء والطلب المتزايد من الساعين للخروج من القاهرة الكبرى.",
        "content2": "توقعات 2026 إيجابية مع استمرار مشاريع البنية التحتية والتوسع الصناعي. يتوقع المحللون نمواً إضافياً في الأسعار بنسبة 15%-20%، مع ارتفاع في الطلب الإيجاري خاصة في المناطق القريبة من الجامعات والمناطق الصناعية.",
        "content3": "الفرصة الاستثمارية في مدينة السادات لا تزال ناضجة لمن يدخل السوق الآن قبل تسارع وتيرة الارتفاع. الأهرام للتطوير العقاري تُقدم تحليلاً مفصلاً للسوق لأي عميل مهتم بالاستثمار في المدينة.",
        "content4": "خط إمداد الوحدات الداخل لسوق مدينة السادات في 2026 ذو حجم معتبر لكنه ليس طاغياً نسبةً للطلب الكامن. عدة مشاريع سكنية أُسّست في 2023 و2024 يُتوقع تسليم وحداتها في 2026، مضيفةً إمداداً جديداً لسوق شهدت تسليمات محدودة في السنوات السابقة. هذا الإمداد الجديد سيُمارس ضغطاً معتدلاً على الأسعار في قطاعات ومناطق معينة، لا سيما الوحدات متوسطة الحجم في مناطق يتوفر فيها رصيد قائم وافر. غير أن خط الإمداد ليس ضخماً بما يكفي لعكس الاختلال الجوهري بين العرض والطلب الذي دفع نمو الأسعار — بل يُرجَّح أن يُبطئ تسارع الأسعار لا أن يعكسه، مما يعني من منظور المستثمر أن مسافة الارتفاع لا تزال قائمة لكن إلحاحية توقيت الدخول ازداد.",
        "content5": "داخل سوق مدينة السادات ككل، لا تنمو جميع القطاعات بالوتيرة ذاتها. الوحدات الصغيرة — شقق غرفة نوم واحدة وغرفتين من 65 إلى 110 أمتار مربعة — القطاع الأسرع حركةً مدفوعاً بطلب الطلاب والمهنيين المنفردين وصغار الأزواج. الوحدات الأسرية متوسطة الحجم من 130 إلى 160 متراً تُمثّل الشريحة الأعمق من طلب السكن الذاتي وتشهد نمواً سعرياً ثابتاً دون التذبذب الذي يُميّز قطاع الوحدات الأصغر. الوحدات التجارية في الطوابق الأرضية الجيدة الموقع لمشاريع سكنية جديدة تستقطب اهتماماً متنامياً من المستثمرين مع تصاعد طلب التجزئة والخدمات بنمو السكان. القطاع الأبطأ حركةً حالياً هو الوحدات الكبيرة الأكثر من 180 متراً حيث الطلب أضعف ومجموعة المشترين المؤهّلين أضيق.",
        "content6": "عدة مؤشرات استباقية تستحق المتابعة لتقييم ما إذا كان سوق مدينة السادات سيُواصل مسار ارتفاعه أم يقترب من الاستقرار. اتجاهات تكاليف البناء هي الأكثر آنية: إذا استقرت أسعار الحديد والأسمنت أو تراجعت، يتبعها ضغط هبوطي على نوايا تسعير المطورين. معدلات شغور الإيجارات عبر المناطق الجامعية والصناعية إشارة طلب في الزمن الفعلي — الشغور المتصاعد عادةً أبكر تحذير قبل تباطؤ نمو الأسعار. أحجام إطلاق المشاريع الجديدة من المطورين العاملين في المدينة تُقدم قراءة من جانب العرض: تضاخم الإطلاقات المتزامن يدل على ثقة المطورين لكنه يعني أيضاً إمداداً مستقبلياً أكبر. وأخيراً، وتيرة التوسع المؤسسي والمصنعي على امتداد الممر الصناعي هي أكثر مرتكزات الطلب الدوامية للمتابعة، إذ تُحرّك مباشرةً التوظيف وبالتالي الطلب السكاني."
      },
      "post42": {
        "title": "دليل المرافق والخدمات في عقارات مدينة السادات: ما الذي يجب التحقق منه؟",
        "excerpt": "الخدمات الأساسية التي يجب التحقق من توفرها في أي وحدة سكنية قبل الشراء في مدينة السادات",
        "content1": "قبل إتمام صفقة أي عقار في مدينة السادات، تحقق من اشتراكات وتوصيلات المرافق الأساسية: الكهرباء (التوصيل من الشبكة الرئيسية وليس توليداً مستقلاً)، ومياه الشرب (شبكة عامة أو محطة تحلية محلية)، والصرف الصحي (شبكة مركزية وليس فوسا).",
        "content2": "تحقق أيضاً من توفر خدمة الغاز الطبيعي المركزي إن كان المبنى يدّعي ذلك، وليس الاعتماد على أسطوانات الغاز فقط. خدمة الإنترنت وتغطية شبكات الهاتف المحمول باتت ضرورة لا رفاهية — اسأل عن المزودين المتاحين في المنطقة.",
        "content3": "الأهرام للتطوير العقاري تُوفر في جميع مشاريعها توصيلات المرافق الكاملة من شبكات الكهرباء والمياه والصرف الصحي والغاز الطبيعي. نؤمن بأن توفر هذه الخدمات الأساسية ليس ميزة إضافية بل معيار لا نقبل دونه.",
        "content4": "الاستعداد للطاقة الشمسية اعتبار بنية تحتية ناشئة يستحق انتباه المشتري المستقبليّ النظرة. المباني التي تتيح الوصول إلى السطح وتتمتع بطاقة إنشائية كافية لتركيب الألواح ومنظومة كهربائية مُهيَّأة لقياس الطاقة الصافية ستكون ذات قيمة أعلى بكثير مع تسارع انتشار الطاقة الشمسية في مصر. اسأل عن هذه الإمكانية اليوم — فالإجابة ستكتسب أهمية أكبر في غضون خمس سنوات.",
        "content5": "الإنترنت عبر الألياف الضوئية وجودة تغطية شبكات الهاتف المحمول باتا متطلبين وظيفيين لا ترفاً لمن يعمل عن بُعد ولأسر ذات أبناء في مراحل دراسية. قبل التعاقد، اختبر قوة الإشارة على عدة شبكات أثناء زيارتك الميدانية، واسأل المطور عن مزودي الألياف الضوئية الذين يمتلكون بنية تحتية في المبنى أو الشارع المحيط.",
        "content6": "أخيراً، حدّد منظومة إدارة المبنى بوضوح. من يجمع رسوم الصيانة؟ من يتولى الإصلاحات الطارئة؟ هل ثمة جمعية سكان أم يتولى المطور إدارة العقار بعد التسليم؟ المباني ذات شركات الإدارة المحترفة وجمعيات السكان الفاعلة تحافظ على حالتها — وعلى قيمتها — بشكل أفضل بكثير من تلك التي تفتقر إلى أي إشراف منظّم. الأهرام للتطوير العقاري تُقدم هذا الوضوح مسبقاً لكل مشروع."
      },
      "post43": {
        "title": "أثر مشاريع البنية التحتية على القيم العقارية في مدينة السادات",
        "excerpt": "كيف تُرجمت مشاريع الطرق والمرافق الجديدة إلى ارتفاع فعلي في أسعار العقارات بمناطق مدينة السادات المختلفة",
        "content1": "يُثبت التاريخ العقاري أن كل مشروع بنية تحتية كبير يُعيد رسم خريطة القيم العقارية في المناطق المحيطة به. مدينة السادات نموذج واضح: توسيع الطرق الرئيسية في المنطقة الذهبية خلال 2022-2023 أسفر عن ارتفاع أسعار الوحدات المطلة على تلك الشوارع بنسبة تجاوزت 30% خلال عامين.",
        "content2": "المشاريع الجارية حالياً مثل المحور المركزي وتطوير شبكة الصرف الصحي في المناطق الشرقية تُتيح فرصة الاستثمار قبل انعكاس أثرها في الأسعار. المستثمر الذكي يشتري قبل اكتمال المشروع ويبيع أو يُؤجّر بعد اكتماله.",
        "content3": "الأهرام للتطوير العقاري تُتابع خريطة مشاريع البنية التحتية في مدينة السادات وتوجّه استثماراتها في المناطق التي ستستفيد من الموجة القادمة من التطوير. هذا التموضع الاستراتيجي يُترجم إلى قيمة فعلية لعملائنا.",
        "content4": "استثمارات البنية التحتية التي تُؤثر على القيم العقارية تمتد بما يتجاوز الطرق والرصف. ترقيات شبكة الكهرباء — بما يشمل إضافة طاقة تحويلية لدعم التطوير السكاني المتزايد الكثافة — تُتيح مبانيَ أكبر وتُلغي الاعتماد على المولدات الذي يُقلص ثقة المشترين في بعض المناطق. توسعات شبكات المياه والصرف الصحي نحو مناطق كانت تعاني نقصاً تجعل تلك المناطق صالحة للتطوير السكاني الدائم لأول مرة، وكثيراً ما تُشعل الموجة الأولى من دخول المطورين الرسميين. وتمديد شبكات الألياف الضوئية، رغم أنه أقل وضوحاً مادياً من مشاريع الطرق، بات ذا أثر قابل للقياس متصاعد على الجاذبية، خاصةً لدى المشترين والمستأجرين الأصغر سناً الذين يعملون عن بُعد أو لديهم متطلبات اتصال رقمي عالية.",
        "content5": "الارتفاع في القيمة الذي يعقب مشروع البنية التحتية لا يتجلّى عادةً فور الاكتمال. النمط الملاحظ في مدينة السادات ومدن مماثلة هو أن الارتفاع الأكثر أهمية يحدث في نافذتين: نافذة مضاربية قبل اكتمال المشروع — حين يشتري المستثمرون المدركون توقعاً — ونافذة جوهرية بعد الاكتمال بـ12 إلى 24 شهراً، حين يجذب الواقع التشغيلي للتحسين قاعدة أوسع من المشترين والمستأجرين المستجيبين للتجربة المعاشة لا للخطط فقط. الفترة الوسطى — مرحلة الإنشاء الفعلية — كثيراً ما تتسم بليونة سعرية في المناطق المجاورة لموقع الإنشاء بسبب الإزعاج والغبار والضجيج، مما يُتيح فرصة شراء لمن يتحمل الإزعاج المؤقت.",
        "content6": "تحديد مشاريع البنية التحتية المُقبلة قبل أن تُصبح معروفة على نطاق واسع يتطلب بحثاً مقصوداً لا مراقبة سلبية. أكثر المصادر موثوقية هي إعلانات هيئات التطوير العمراني الرسمية والموازنات المفصّلة المنشورة في خطط التطوير على مستوى المحافظة — وكلها وثائق عامة لكنها تستوجب رصداً نشطاً. المقاولون المحليون وموردو مواد البناء العاملون في السوق لديهم معرفة عملية بالمشاريع المُقبلة في الغالب قبل الإعلان الرسمي عنها. قرارات اختيار المواقع لدى المطورين — خاصةً حين يُحكم مطوّر راسخ قبضته على أراضٍ في منطقة بدت بلا جاذبية — كثيراً ما تكون إشارة استباقية أن تلك المنطقة على وشك الاستفادة من استثمار في البنية التحتية. الأهرام للتطوير العقاري تُتابع هذا الخط باستمرار وتُموضع مشاريعها وفقاً لذلك."
      },
      "post44": {
        "title": "لماذا اختارت الأهرام للتطوير العقاري مدينة السادات؟ رؤية استراتيجية",
        "excerpt": "الأسباب الاستراتيجية التي دفعت الأهرام للتطوير العقاري للتركيز على مدينة السادات وبناء محفظتها العقارية فيها",
        "content1": "حين قررت الأهرام للتطوير العقاري التركيز على مدينة السادات، كان ذلك قراراً مدروساً مبنياً على قراءة عميقة للسوق. الموقع الجغرافي المتوسط بين القاهرة والإسكندرية، والبنية الصناعية الراسخة، والتوسع الجامعي المتسارع — كلها مؤشرات أسست نمواً سكنياً مستداماً.",
        "content2": "على مدى السنوات الماضية، أثبتت هذه الرؤية صحتها مع نمو الطلب وارتفاع الأسعار وازدياد أعداد الأسر المنتقلة إلى المدينة. الأهرام وسّعت محفظتها في المدينة لأنها ترى في مدينة السادات قصة نجاح طويلة الأمد لم تبلغ ذروتها بعد.",
        "content3": "قرارنا باختيار مدينة السادات ليس فقط قراراً تجارياً، بل التزام بمجتمع سكاني نامٍ نشاركه طموحاته. الأهرام للتطوير العقاري ستواصل البناء في مدينة السادات وستُطلق مشاريع جديدة تُرسّخ حضورها في أفضل مواقع المدينة.",
        "content4": "قبل الالتزام بمدينة السادات، أجرت الأهرام للتطوير العقاري تحليلاً مقارناً معمّقاً لسبع مدن مصرية من الدرجة الثانية. اعتمد التحليل على خمسة معايير: الارتكاز الصناعي، والبنية التعليمية، وإمكانية الوصول الطرقي، ومسار أسعار الأراضي، والتوازن بين العرض والطلب. حققت مدينة السادات أعلى تصنيف في أربعة معايير من الخمسة — الاستثناء كان سعر الأرض الخام الأعلى نسبياً من بعض البدائل الأبعد، وهو فارق تبرره تفوقاً في إمكانية الوصول والأسس الاقتصادية.",
        "content5": "اختيار المنطقة الذهبية تحديداً داخل مدينة السادات جاء بالمنهجية ذاتها. رسمت الشركة خريطة لكثافة الخدمات والقرب من المنطقة الصناعية والجامعات وجودة الطرق وتصنيفات تقسيم الاستخدامات قبل اختيار مواقع التطوير. حققت المنطقة الذهبية أعلى درجات في جميع الأبعاد — وهو ما يفسر تحقيق مشاريع الأهرام فيها أعلى نسب ارتفاع في القيمة وأكثر الطلب الإيجاري استدامةً في المحفظة.",
        "content6": "هذا الانضباط التحليلي ليس تمريناً يُؤدَّى مرة واحدة. تواصل الأهرام للتطوير العقاري رصد بيانات البنية التحتية لمدينة السادات والاتجاهات السكانية وبيانات سوق الإيجار ربع سنوياً. هذا البحث المستمر يُغذّي مباشرةً قرارات مواقع المشاريع المقبلة ومزيج الوحدات والتسعير — لضمان أن كل إطلاق جديد يحظى بأفضل تموضع ممكن لصالح العملاء الذين يأتمنون الشركة على مدخراتهم ومستقبلهم."
      },
      "post45": {
        "title": "مزايا المدن الجديدة في مصر: لماذا يتزايد الإقبال على العيش خارج القاهرة؟",
        "excerpt": "استعراض للأسباب التي تدفع المزيد من الأسر المصرية إلى اختيار المدن الجديدة وجهة للسكن الدائم",
        "content1": "تشهد المدن الجديدة في مصر إقبالاً متزايداً لأسباب موضوعية: الاكتظاظ المتصاعد في القاهرة الكبرى، وارتفاع أسعار العقارات فيها إلى مستويات تعجز عنها الأسر المتوسطة، وتدهور جودة الهواء والطرق وخدمات البنية التحتية في كثير من أحيائها.",
        "content2": "المدن الجديدة تُقدم بديلاً متوازناً: أسعار أكثر تنافسية، شوارع أوسع وأكثر تنظيماً، مساحات خضراء أوفر، وبنية تحتية حديثة تنافس أو تفوق ما هو متاح في العاصمة. مدينة السادات بالتحديد تجمع هذه المزايا مع قاعدة اقتصادية صناعية وتعليمية متينة.",
        "content3": "التوجه نحو المدن الجديدة ليس موضة عابرة، بل تحول ديموغرافي حقيقي تدعمه سياسات الدولة المتمثلة في تطوير البنية التحتية وتوسيع الفرص الاقتصادية خارج القاهرة. الأهرام للتطوير العقاري في طليعة المستثمرين الذين أدركوا هذا التحول مبكراً.",
        "content4": "الملف الديموغرافي لمن ينتقل فعلياً إلى المدن الجديدة في مصر اليوم أكثر تنوعاً مما يُفترض عادةً. الأسر الشابة ذات الأطفال دون العاشرة تُمثّل المجموعة الأكبر — مستقطَبةً بالجمع بين انخفاض تكاليف السكن وجودة هواء أفضل وشوارع أكثر هدوءاً لتربية الأبناء. مجموعة ثانية ناشئة ومتنامية من المهنيين متوسطي العمر الذين اشتروا وحدات استثمارية في المدن الجديدة ويختارون الانتقال إليها مع اقترابهم من سن التقاعد بحثاً عن بيئة أهدأ. العاملون عن بُعد — الذين تزايدت أعدادهم بشكل ملحوظ بعد 2020 — يُمثّلون شريحة ثالثة باتت لديها أهمية أقل للقرب الجسدي من القاهرة، مما يجعل بُعد مدينة السادات عن العاصمة عاملاً قابلاً للاحتمال لا معوّقاً. كل هذه المجموعات تجلب طلباً مستداماً متعدد السنوات لا نشاطاً آنياً أو مضاربياً.",
        "content5": "السياسة الحكومية كانت مُسرِّعاً ثابتاً للتحول الديموغرافي نحو المدن الجديدة، وآليات الدعم متعددة. الاستثمار في البنية التحتية من طرق وكهرباء ومياه وصرف صحي يُخفّض مباشرةً الفجوة في جودة الحياة التي جعلت تاريخياً المدن الجديدة أقل جاذبية من أحياء القاهرة بالسعر ذاته. خلق فرص العمل عبر تطوير المناطق الصناعية ونقل وظائف حكومية يُولّد نشاطاً اقتصادياً محلياً يُديم السكان بصورة مستقلة عن القاهرة. برامج الرهن العقاري المدعوم من البنوك الحكومية وصندوق الإسكان الاجتماعي جعلت الحصول على الوحدات أكثر يُسراً للأسر متوسطة الدخل التي تُمثّل المحرك الأساسي لنمو سكان المدن الجديدة. بمجموعها، هذه الروافع السياسية ليست مُرشَّحة للانعكاس — مما يمنح التحول الديموغرافي طابعاً بنيوياً لا دورياً.",
        "content6": "مزايا مدينة السادات الخاصة على المدينة الجديدة المصرية المتوسطة تشمل عوامل تُعالج أبرز الانتقادات الشائعة على حياة المدن الجديدة. المنطقة الصناعية توفر توظيفاً محلياً غائباً في المدن الجديدة ذات الطابع السكاني الخالص، مما يُقلص اعتماد السكان على التنقل إلى القاهرة. التجمع الجامعي يضمن منظومة خدمية — مقاهٍ ومطاعم ومراكز دروس ومكتبات — تفتقر إليها المدن الجديدة ذات الطابع السكاني أو الإداري الصرف في الغالب. موقع مدينة السادات على طريق القاهرة-الإسكندرية الصحراوي يمنح سكانها شعوراً بالاتصال بمدينتين كبريين بدلاً من العزلة عن كلتيهما. التحديات المتبقية حقيقية: عروض الترفيه والحياة الليلية في المدينة لا تزال محدودة مقارنةً بالقاهرة أو مدينة السادس من أكتوبر، وبعض المناطق الطرفية لا تزال تُعاني فجوات في الخدمات. لكن هذه فجوات تضيق مع نمو السكان، وأساس مدينة السادات الاقتصادي يمنحها مساراً أكثر مصداقية نحو ردمها مقارنةً بالمدن الجديدة التي تعتمد كلياً على الاستيطان السكاني لحيويتها."
      },
      "post46": {
        "title": "مدينة السادات والبيئة الهادئة: بعيداً عن ضجيج المدن الكبرى",
        "excerpt": "كيف توفر مدينة السادات بيئة معيشية هادئة وصحية بعيداً عن تلوث الضوضاء وزحام القاهرة الكبرى",
        "content1": "يُعدّ تلوث الضوضاء من أبرز مشكلات المدن الكبرى في مصر، وله تأثير مباشر على الصحة النفسية والجسدية لسكانها. مدينة السادات تُقدم بيئة معيشية أكثر هدوءاً بفضل انخفاض الكثافة المرورية وبعدها عن ضجيج المصانع الكبرى في أحيائها السكنية.",
        "content2": "الفصل الواضح بين المناطق الصناعية والسكنية في تخطيط مدينة السادات يضمن ألا تتأثر الأحياء السكنية بضجيج المصانع أو روائحها. هذا التخطيط المدروس يجعل الحياة اليومية في الأحياء السكنية أشبه بهدوء الضواحي مع قرب الخدمات.",
        "content3": "لمن يبحث عن بيئة هادئة لتربية الأبناء والعمل من المنزل والحياة اليومية المريحة، مدينة السادات خيار يستحق الجدية. الأهرام للتطوير العقاري تختار مواقع مشاريعها في الأحياء السكنية الهادئة لتضمن لساكنيها أفضل مستوى معيشي.",
        "content4": "تُشير الدراسات العمرانية باستمرار إلى أن الأحياء الكثيفة في القاهرة تتعرض لمستويات ضوضاء محيطية تصل إلى ما يصنفه الباحثون بوصفه مزعجًا للتركيز والتواصل الاجتماعي بصورة مزمنة. في المقابل، تنتمي المناطق السكنية في مدينة السادات إلى فئة مختلفة تمامًا. فكثافة المرور المنخفضة على الطرق الداخلية، وندرة ضجيج الأبواق، وغياب الازدحام التجاري، كلها عوامل تخلق بيئة صوتية أقرب إلى ضاحية هادئة منظمة، ملموسة الفارق فور الوصول.",
        "content5": "جودة النوم من أكثر العوامل التي يُستهان بها في قرارات الشراء العقاري السكني. إذ ترفع الضوضاء الليلية المستمرة مستويات الكورتيزول وتُجزّئ دورات النوم وترتبط بالإجهاد القلبي على المدى البعيد. تُفيد الأسر المنتقلة من القاهرة باستمرار بأن أول تغيير ملموس يلفت انتباههم في مدينة السادات هو اختلاف نوم أطفالهم جذريًا. لمن يضع صحته وإنتاجيته في سلم أولوياته، فإن البيئة الصوتية للمسكن ليست اعتبارًا ثانويًا بل ركيزة أساسية.",
        "content6": "هدوء المناطق السكنية في مدينة السادات ليس وليد الصدفة، بل نتاج تخطيط عمراني مقصود ومحكم. فالمناطق الصناعية مفصولة عن التجمعات السكنية بأحزمة أرضية واسعة، وتسلك الطرق الشريانية الخادمة للشحن والصناعة مسارات بعيدة عن الممرات السكنية. وتصميم الشوارع الداخلية يُفضي إلى أنماط حركة منخفضة السرعة والكثافة. وهذه قرارات بنيوية على مستوى التخطيط لا يمكن التراجع عنها مع ازدياد الكثافة مستقبلًا، مما يمنح المستثمرين والسكان ثقة راسخة بديمومة هذا الطابع الهادئ."
      },
      "post47": {
        "title": "مستقبل التوسع العمراني في مدينة السادات حتى 2030",
        "excerpt": "نظرة استشرافية على مشاريع التطوير العمراني المخططة لمدينة السادات والتأثيرات المتوقعة على أسعار العقارات",
        "content1": "تتضمن خطط التطوير العمراني لمدينة السادات حتى 2030 توسعات مخططة في عدة مناطق سكنية جديدة، وتطوير المنطقة التكنولوجية لاستيعاب صناعات أكثر تقدماً، وتطوير المحاور الطرقية الرئيسية التي ستربط المدينة بمشاريع الإسكان الجديدة المجاورة.",
        "content2": "مشاريع البنية التحتية المُعلنة تشمل توسعة محطة معالجة المياه لاستيعاب النمو السكاني المتوقع، وتطوير شبكة الطرق الداخلية، وإضافة مرافق خدمية جديدة في المناطق النامية. كل هذه المشاريع تُقوي الجاذبية الاستثمارية للمدينة.",
        "content3": "المستثمر الذي يدخل سوق مدينة السادات الآن يُؤسس موقعه قبل أن تنعكس هذه التوسعات في أسعار السوق. الأهرام للتطوير العقاري تُرحب بمناقشة الفرص الاستثمارية المتاحة اليوم في ضوء خارطة التطوير المستقبلية.",
        "content4": "لا تحمل جميع مناطق التوسع المخططة احتمالية متساوية للتطوير المبكر. أدق مؤشر على قرب التنفيذ هو وجود بنية تحتية محيطة قائمة وعاملة فعلاً؛ فالمنطقة التي تمتلك شبكة صرف صحي ممدودة وطرق معبّدة وخدمات كهرباء وغاز نشطة تقترب بصورة واضحة من الجاهزية للسكن، بخلاف تلك التي لا يزيد حضورها على وثائق رسمية وتصريحات مسؤولين. المستثمر الذكي يقرأ الأرض لا الخرائط وحدها.",
        "content5": "ينطوي الاستثمار استباقاً لتوسعة مخططة على مخاطر حقيقية تستدعي التقييم الموضوعي. فالتوسعات تتأخر أحياناً لأسباب مالية أو إدارية أو تغيّر في الأولويات، وقد تمتد فترة الانتظار بما يُرهق التدفق النقدي. السؤال الفاصل ليس: هل ستتوسع المدينة؟ بل: هل يمكن لمحفظتك الاستثمارية أن تتحمل سيناريو تأخر التوسعة سنتين إضافيتين؟ من يجيب بنعم يمكنه أن يُحقق مكاسب سعرية كبيرة؛ أما من لا يتحمل ذلك، فالمناطق المكتملة البنية خيار أكثر أماناً.",
        "content6": "تُعايَر خطط مشاريع الأهرام بعناية وفق خريطة التوسع 2030 لا مضاربةً على التوقعات وحدها. نحدد مواقعنا ضمن نطاقات تتوافر فيها البنية التحتية الأساسية اليوم، مع ضمان أن تُضاف التوسعات المستقبلية قيمةً فوق قيمة قائمة لا أن تكون الرهان الوحيد. هذا النهج يحمي المشتري ويمنحه مكسباً متدرجاً قابلاً للقياس بدلاً من وعد موقوت."
      },
      "post48": {
        "title": "حوافز الاستثمار في مدينة السادات: ما الذي تُقدمه الجهات الرسمية للمستثمرين؟",
        "excerpt": "نظرة على الحوافز والتسهيلات التي تمنحها الجهات الحكومية والهيئة العامة للاستثمار للمستثمرين في مدينة السادات",
        "content1": "تُصنَّف مدينة السادات ضمن المناطق التي تُقدم فيها الهيئة العامة للاستثمار والمناطق الحرة (جافي) حوافز لاستقطاب الاستثمارات الصناعية والتجارية. تشمل هذه الحوافز تسهيلات في الحصول على الأراضي الصناعية وإجراءات التراخيص المبسّطة في إطار نافذة الاستثمار الواحدة.",
        "content2": "على مستوى العقارات السكنية، يستفيد المشترون من برامج دعم الإسكان الحكومية كصندوق الإسكان الاجتماعي ومبادرات التمويل العقاري المدعومة التي تُتيح أسعار فائدة مخفضة لفئات الدخل المحدد والمتوسط.",
        "content3": "معرفة الحوافز المتاحة جزء أساسي من اتخاذ القرار الاستثماري الصحيح. الأهرام للتطوير العقاري تُحيط عملاءها بالمعلومات الكاملة حول برامج الدعم المتاحة لوحداتنا في مدينة السادات لضمان أفضل صفقة ممكنة.",
        "content4": "تُصنّف الهيئة العامة للاستثمار والمناطق الحرة مدينة السادات ضمن مناطق الجيل الثاني من المدن الصناعية التي تتلقى أولوية في منح تصاريح الاستثمار الصناعي والتجاري. يعني هذا عملياً تقليص الأعباء البيروقراطية ومركزة الخدمات الحكومية في نافذة واحدة، مما يُقلص الزمن اللازم من قرار الاستثمار إلى بدء التشغيل الفعلي، وهو عامل حاسم للمستثمر الصناعي.",
        "content5": "تعمل برامج الإسكان الاجتماعي المتاحة للمشترين السكنيين في مدينة السادات على خفض كلفة الاقتراض بصورة ملموسة لمن تنطبق عليهم شروط الأهلية. مبادرات البنك المركزي للتمويل العقاري المدعوم تُتيح أسعار فائدة مخفضة بصورة كبيرة قياساً بالسوق الحر، غير أن شروط الأهلية تتغير من دورة لأخرى، وتختلف سقوف الدعم باختلاف قيمة الوحدة ومساحتها.",
        "content6": "يستلزم الاستفادة الكاملة من الحوافز الحكومية معرفةً دقيقة بالشروط الحالية لا الاعتماد على معلومات دورات سابقة. الأهرام للتطوير العقاري تحرص على إطلاع عملائها بانتظام على برامج الدعم السارية المفعول المرتبطة بوحداتنا، وتسعى إلى ربطهم بالجهات التمويلية المعتمدة للاستفادة من أفضل الشروط المتاحة في وقت الشراء."
      },
      "post49": {
        "title": "المساجد والحياة الدينية والمجتمعية في مدينة السادات",
        "excerpt": "كيف تُسهم المساجد والمرافق الدينية في تشكيل الهوية المجتمعية لمدينة السادات وتعزيز الانسجام الاجتماعي",
        "content1": "تنتشر المساجد في مدينة السادات بكثافة جيدة في جميع أحيائها، وتعمل كمراكز روحية واجتماعية تجمع السكان في الصلوات اليومية والمناسبات الدينية. وجود مسجد قريب من السكن يُعدّ من الأولويات لكثير من الأسر المصرية عند اختيار مكان الإقامة.",
        "content2": "تُقام في مساجد مدينة السادات أنشطة اجتماعية متنوعة تشمل حلقات تحفيظ القرآن وبرامج التوعية والأنشطة الشبابية. هذا الدور المجتمعي للمسجد يُعزز الروابط بين السكان ويبني مجتمعاً متماسكاً ذا هوية راسخة.",
        "content3": "الأهرام للتطوير العقاري تُراعي في اختيار مواقع مشاريعها القرب من المساجد والمرافق الدينية إلى جانب الخدمات الأخرى، لأننا ندرك أن المنزل المثالي لا يكتمل دون محيط اجتماعي وروحي يُلبي احتياجات الأسرة الكاملة.",
        "content4": "تتجاوز المساجد في مدينة السادات دورها التعبدي لتُشكّل محوراً حقيقياً للحياة الاجتماعية. تستضيف كثير منها برامج تحفيظ قرآن للأطفال وحلقات علمية وأنشطة للمرأة والشباب، فضلاً عن جمعيات خيرية تُسهم في دعم الأسر المحتاجة بالحي. هذا الدور الاجتماعي الموسّع يُحوّل المسجد من مجرد مبنى ديني إلى مركز تلاقٍ وانسجام يومي بين السكان.",
        "content5": "يؤثر وجود مسجد راسخ ومكتظ بالمصلين في الحي تأثيراً إيجابياً موثقاً على شعور السكان بالأمان والانتماء. فالمناطق ذات الحضور الديني الفاعل تميل إلى امتلاك شبكات تعاون غير رسمية أكثر متانةً، وتشهد انخراطاً مجتمعياً أوسع في قضايا الحي، مما يُعزز التماسك الاجتماعي ويرفع جودة الحياة اليومية بصورة مستدامة.",
        "content6": "تدرج الأهرام للتطوير العقاري القرب من المساجد بوصفه معياراً صريحاً في تقييم المواقع، لا مجرد ملاحظة عابرة. عند دراسة أي موقع محتمل، نتحقق من المسافة الفعلية إلى أقرب مسجد جامع وحجم المصلين وما يُقدمه من خدمات مجتمعية. هذا المعيار يُترجم قيمنا إلى قرارات ملموسة تنعكس على رفاهية ساكني مشاريعنا يومياً."
      },
      "post50": {
        "title": "توقعات سوق العقارات المصري 2026: رؤية شاملة للمستثمر",
        "excerpt": "تحليل معمّق لمؤشرات سوق العقارات المصري في 2026 وأبرز الفرص والتحديات التي يجب أن يعيها المستثمر",
        "content1": "يستهل سوق العقارات المصري عام 2026 من موقع قوة نسبية، مدعوماً بتراجع التضخم تدريجياً وثبات نسبي في أسعار مواد البناء مقارنة بذروة 2023-2024. الطلب المحلي لا يزال قوياً، مدفوعاً بالنمو الديموغرافي وتنامي شريحة الشباب الباحثة عن الاستقلالية السكنية.",
        "content2": "على مستوى الجغرافيا الاستثمارية، تتصدر المدن الجديدة متوسطة الحجم كمدينة السادات والعاشر من رمضان قائمة الوجهات الأكثر جدوى للمستثمر ذي الميزانية المتوسطة. الجمع بين العائد الإيجاري المقبول وارتفاع القيمة التدريجي يجعلها خياراً أكثر اتزاناً من الأسواق المرتفعة الثمن.",
        "content3": "الأهرام للتطوير العقاري تنظر إلى 2026 بثقة، وتواصل إطلاق مشاريعها في مدينة السادات بتصميمات تُلبي توقعات السوق وأسعار تحقق للمشتري قيمة حقيقية. إذا كانت 2026 عام قرارك الاستثماري، فنحن نرحب بمناقشة الخيارات معك.",
        "content4": "تُشير مؤشرات التمويل العقاري في مطلع 2026 إلى تحسن تدريجي في إمكانية الوصول للمنتجات التمويلية؛ إذ باتت بعض البنوك تعرض آجالاً أطول وهوامش أكثر تنافسية للمشترين ذوي الملاءة الائتمانية الجيدة. غير أن الفجوة بين دخل الفرد وأسعار الوحدات لا تزال تضيق بصورة بطيئة، مما يجعل خيارات التقسيط الطويل المقدمة من المطورين أداةً جوهرية لتيسير الدخول إلى الملكية بالنسبة لشريحة واسعة من المشترين.",
        "content5": "تستلزم إدارة المخاطر في سوق 2026 وعياً بجملة من العوامل: احتمالية تذبذب سعر الصرف التي تُعقّد تسعير مواد البناء، والتركز الجغرافي للطلب الذي لا يزال يصب في مناطق محدودة، وتباين مستوى التسليم بين المطورين. المستثمر الحصيف يُنوّع أفق توقعاته ويختار مطوراً برهن على قدرة تسليم فعلية لا وعوداً مجردة.",
        "content6": "ترصد الأهرام للتطوير العقاري مؤشرات السوق باستمرار لضبط توقيت إطلاق المشاريع وتسعير الوحدات بما يتوافق مع القدرة الشرائية الفعلية. نحن لا نطلق مشاريع في مناخ تقلبي دون تقييم متأن للجدوى، ونرفض المبالغة في تثمين الوحدات على حساب الإقبال الحقيقي. في 2026، يعني هذا أسعاراً مدروسة وجداول تقسيط مرنة تُبقي الباب مفتوحاً أمام المشتري الجاد."
      }
    },
    "pagination": {
      "label": "تصفح الصفحات",
      "prev": "الصفحة السابقة",
      "next": "الصفحة التالية",
      "info": "صفحة {{current}} من {{total}}"
    }
  },
  "sadatGuide": {
    "hero": {
      "eyebrow": "دليل المدينة",
      "title": "دليل مدينة السادات",
      "subtitle": "كل ما تحتاج معرفته عن مدينة السادات — الموقع، الخدمات، فرص الاستثمار"
    },
    "overview": {
      "eyebrow": "نبذة عن المدينة",
      "title": "نبذة عن مدينة السادات",
      "paragraph1": "مدينة السادات هي واحدة من أهم مدن الجيل الأول في مصر، تقع في محافظة المنوفية على بعد 90 كم شمال غرب القاهرة. تأسست عام 1978 وتشهد نمواً عمرانياً واستثمارياً متسارعاً خلال السنوات الأخيرة.",
      "paragraph2": "تتميز المدينة ببنية تحتية متطورة وشبكة طرق حديثة تربطها بالقاهرة والإسكندرية والدلتا. مع تزايد عدد السكان والمشاريع الجديدة، أصبحت مدينة السادات وجهة مثالية للسكن والاستثمار العقاري."
    },
    "stats": {
      "population": "نسمة (متوقع 2M بحلول 2030)",
      "distance": "كم من القاهرة",
      "compounds": "كمبوند مخطط",
      "growth": "نمو سنوي في الأسعار"
    },
    "whySadat": {
      "eyebrow": "لماذا السادات",
      "title": "لماذا مدينة السادات؟",
      "subtitle": "أسباب تجعل مدينة السادات الاختيار الأمثل للسكن والاستثمار",
      "reason1": {
        "title": "أسعار تنافسية",
        "description": "أسعار العقارات أقل بـ 75% مقارنة بالقاهرة الجديدة والتجمع الخامس"
      },
      "reason2": {
        "title": "موقع استراتيجي",
        "description": "90 كم من القاهرة و120 كم من الإسكندرية عبر طرق سريعة"
      },
      "reason3": {
        "title": "بنية تحتية حديثة",
        "description": "شوارع واسعة ومخططة وشبكة مرافق متطورة"
      },
      "reason4": {
        "title": "خدمات متكاملة",
        "description": "جامعات ومدارس ومستشفيات ومراكز تجارية وترفيهية"
      },
      "reason5": {
        "title": "فرص استثمارية",
        "description": "نمو سنوي 33% في أسعار العقارات مع +5 مليار جنيه استثمارات خاصة"
      },
      "reason6": {
        "title": "بيئة هادئة",
        "description": "مساحات خضراء واسعة وهدوء بعيداً عن ازدحام المدن الكبرى"
      }
    },
    "sections": {
      "eyebrow": "مميزات المدينة",
      "title": "ما تقدمه مدينة السادات",
      "infrastructure": {
        "title": "البنية التحتية والمواصلات",
        "content": "تتميز مدينة السادات بشبكة طرق حديثة تشمل طريق القاهرة-الإسكندرية الصحراوي وطريق مصر-إسكندرية الزراعي. كما ترتبط بخط سكة حديد يصلها بالقاهرة والصعيد. المدينة مقسمة إلى مناطق سكنية وصناعية وتجارية مخططة بعناية."
      },
      "education": {
        "title": "التعليم والجامعات",
        "content": "تضم المدينة عدة مؤسسات تعليمية متميزة منها جامعة مدينة السادات وجامعة الريادة ومعاهد عليا متعددة. بالإضافة إلى مدارس حكومية وخاصة ودولية تغطي جميع المراحل التعليمية."
      },
      "healthcare": {
        "title": "الرعاية الصحية",
        "content": "تتوفر في المدينة مستشفيات حكومية وخاصة ومراكز طبية متخصصة. من أبرزها مستشفى مدينة السادات العام ومستشفى جامعة السادات التعليمي، بالإضافة إلى عيادات ومراكز طبية خاصة."
      },
      "commercial": {
        "title": "التجارة والتسوق",
        "content": "تضم المدينة مراكز تجارية متعددة ومولات حديثة وأسواق تقليدية. تتوفر فيها جميع العلامات التجارية والمحلات والمطاعم التي تلبي احتياجات السكان اليومية."
      }
    },
    "allZones": {
      "eyebrow": "دليل المناطق",
      "title": "استكشف مناطقنا في مدينة السادات",
      "subtitle": "تعمل الأهرام للتطوير العقاري في مناطق متعددة بمدينة السادات — تصفح كل منطقة لاكتشاف المشاريع السكنية المتاحة",
      "goldenBadge": "المنطقة الذهبية"
    },
    "priceComparison": {
      "eyebrow": "مقارنة الأسعار",
      "title": "مقارنة الأسعار",
      "subtitle": "أسعار المتر المربع مقارنة بالمدن الأخرى",
      "cityHeader": "المدينة",
      "priceHeader": "متوسط سعر المتر",
      "sadatCity": "مدينة السادات",
      "sadatCityPrice": "~11,500 جنيه/م²",
      "october": "مدينة 6 أكتوبر",
      "octoberPrice": "~25,000 جنيه/م²",
      "newCairo": "القاهرة الجديدة",
      "newCairoPrice": "~45,000 جنيه/م²",
      "newCapital": "العاصمة الإدارية",
      "newCapitalPrice": "~35,000 جنيه/م²",
      "bestValue": "أفضل قيمة",
      "disclaimer": "* الأسعار تقريبية وقد تختلف حسب الموقع والمشروع. محدثة حتى مارس 2026."
    },
    "cta": {
      "eyebrow": "ابدأ رحلتك",
      "title": "ابدأ حياتك في مدينة السادات",
      "subtitle": "اكتشف مشاريعنا السكنية المتميزة في المنطقة الذهبية",
      "browseProjects": "تصفح المشاريع",
      "whatsapp": "تواصل عبر واتساب"
    },
    "faq": {
      "heading": "الأسئلة الشائعة",
      "eyebrow": "أسئلة شائعة",
      "q1": "ما هي أسعار الشقق في مدينة السادات؟",
      "a1": "تبدأ أسعار الشقق في مدينة السادات من حوالي 11,500 جنيه للمتر المربع، مما يجعلها من أقل الأسعار مقارنة بالقاهرة الجديدة و6 أكتوبر والعاصمة الإدارية الجديدة.",
      "q2": "ما هي مناطق مشاريع الأهرام في مدينة السادات؟",
      "a2": "تمتلك الأهرام للتطوير العقاري مشاريع في المنطقة 21 (المنطقة الذهبية)، الشريط المميز 7، حي الوطن 7، المنطقة 14، المنطقة 22، المنطقة 29، الروضة، والمنطقة 35.",
      "q3": "هل يوجد تقسيط بدون فوائد في مشاريع الأهرام؟",
      "a3": "نعم، توفر الأهرام للتطوير العقاري خطط تقسيط مرنة بدون فوائد تصل إلى 7 سنوات، مع مقدم يبدأ من 20% فقط من قيمة الوحدة.",
      "q4": "ما هو موقع مدينة السادات؟",
      "a4": "تقع مدينة السادات في محافظة المنوفية على بعد 90 كم شمال غرب القاهرة، وتتصل بسهولة بطريق القاهرة-الإسكندرية الصحراوي وطريق مصر-إسكندرية الزراعي.",
      "q5": "ما المدة الزمنية لتسليم الوحدات؟",
      "a5": "تتراوح مدة التسليم بين سنتين و3 سنوات حسب المشروع ومرحلة البناء. يمكنك متابعة تقدم البناء في صفحة تحديثات الإنشاء.",
      "q6": "كيف يمكن التواصل مع الأهرام للتطوير العقاري؟",
      "a6": "يمكنك التواصل معنا عبر الواتساب أو الاتصال المباشر أو من خلال نموذج التواصل في الموقع. فريقنا متاح طوال أيام الأسبوع من 9 صباحاً حتى 6 مساءً.",
      "q7": "ما مميزات السكن في مدينة السادات؟",
      "a7": "تتميز مدينة السادات بالهدوء والمساحات الخضراء الواسعة، والبنية التحتية الحديثة، وتوفر جامعات ومدارس ومستشفيات ومراكز تجارية، مع أسعار أقل بكثير مقارنة بالمدن الكبرى.",
      "q8": "هل مشاريع الأهرام مرخصة ومعتمدة رسمياً؟",
      "a8": "نعم، جميع مشاريع الأهرام للتطوير العقاري مرخصة ومعتمدة من الجهات الحكومية المختصة في مدينة السادات وتعمل بموجب تصاريح رسمية."
    }
  },
  "constructionUpdates": {
    "hero": {
      "eyebrow": "تقدم الأعمال",
      "title": "تحديثات البناء",
      "subtitle": "تابع آخر تطورات مشاريعنا ومراحل التنفيذ بشفافية كاملة"
    },
    "milestones": {
      "foundation": "الأساسات",
      "structure": "الهيكل",
      "finishing": "التشطيبات",
      "delivery": "التسليم"
    },
    "updates": {
      "update1": {
        "title": "بدء أعمال التشطيبات الداخلية — مشروع 865",
        "description": "تم الانتهاء من الهيكل الخرساني بالكامل وبدأت أعمال التشطيبات الداخلية والخارجية شاملة الدهانات والسيراميك والأعمال الكهربائية والصحية."
      },
      "update2": {
        "title": "استكمال الهيكل الخرساني — مشروع 868",
        "description": "تم الانتهاء من صب الهيكل الخرساني لجميع الأدوار والبدء في أعمال المباني والتقسيمات الداخلية."
      },
      "update3": {
        "title": "إتمام أعمال الهيكل — مشروع 865",
        "description": "اكتمال صب أسقف جميع الأدوار والبدء في أعمال المباني. التنفيذ يسير وفق الجدول الزمني المحدد."
      },
      "update4": {
        "title": "بدء أعمال الحفر والأساسات — مشروع 76",
        "description": "بدأت أعمال الحفر وتجهيز الأساسات لمشروع 76 في الموقع الجديد. من المتوقع الانتهاء من الأساسات خلال شهرين."
      },
      "update5": {
        "title": "صب الأساسات والقواعد — مشروع 868",
        "description": "تم الانتهاء من صب القواعد الخرسانية وميدة الربط، وجاري البدء في أعمال الهيكل الخرساني للدور الأرضي."
      }
    },
    "timeline": {
      "eyebrow": "الجدول الزمني",
      "title": "الجدول الزمني للبناء"
    },
    "cta": {
      "eyebrow": "زيارة الموقع",
      "title": "تابع مشاريعنا عن قرب",
      "subtitle": "تواصل معنا لزيارة الموقع والاطلاع على آخر التطورات شخصياً",
      "whatsapp": "تواصل عبر واتساب",
      "browseProjects": "تصفح المشاريع"
    }
  },
  "paymentPlans": {
    "hero": {
      "eyebrow": "خيارات مرنة",
      "title": "خطط السداد والتقسيط",
      "subtitle": "اختر خطة السداد المناسبة لميزانيتك واحصل على وحدتك السكنية بأسهل الطرق"
    },
    "comparison": {
      "eyebrow": "مقارنة الخطط",
      "title": "خطط السداد المتاحة",
      "subtitle": "نوفر خيارات متعددة تناسب جميع الميزانيات",
      "popular": "الأكثر طلباً",
      "inquire": "استفسر الآن"
    },
    "plans": {
      "cash": {
        "title": "الدفع الكاش",
        "description": "احصل على خصم مميز عند الدفع الفوري لقيمة الوحدة كاملة",
        "feature1": "خصم يصل إلى 10% من إجمالي السعر",
        "feature2": "استلام فوري عند توفر الوحدة",
        "feature3": "أولوية في اختيار الوحدات"
      },
      "installment": {
        "title": "تقسيط المطور",
        "description": "أقساط مريحة بدون فوائد مباشرة من شركة الأهرام للتطوير العقاري",
        "feature1": "مقدم يبدأ من 20% من قيمة الوحدة",
        "feature2": "تقسيط حتى 5 سنوات بدون فوائد",
        "feature3": "أقساط شهرية ثابتة ومريحة"
      },
      "bank": {
        "title": "التمويل العقاري",
        "description": "تمويل عقاري من البنوك الشريكة بفترات سداد طويلة",
        "feature1": "تمويل يصل إلى 80% من قيمة الوحدة",
        "feature2": "فترات سداد تصل إلى 20 سنة",
        "feature3": "أسعار فائدة تنافسية من البنوك الشريكة"
      }
    },
    "calculator": {
      "eyebrow": "حسّب ميزانيتك",
      "subtitle": "استخدم الحاسبة لمعرفة القسط الشهري المتوقع بناءً على السعر ومدة التقسيط"
    },
    "financing": {
      "eyebrow": "خيارات التمويل",
      "title": "خيارات التمويل",
      "subtitle": "نساعدك في اختيار أفضل طريقة لتمويل وحدتك السكنية",
      "developer": {
        "title": "تقسيط مباشر من المطور",
        "description": "نقدم خطط تقسيط مرنة مباشرة بدون الحاجة لإجراءات بنكية معقدة. استفد من التقسيط المريح مع الأهرام للتطوير العقاري.",
        "point1": "إجراءات سريعة وبسيطة بدون كفيل",
        "point2": "مرونة في جدول السداد حسب ظروفك",
        "point3": "لا رسوم خفية أو تكاليف إضافية"
      },
      "bank": {
        "title": "التمويل البنكي",
        "description": "بالتعاون مع البنوك الرائدة في مصر، نوفر لك خيارات تمويل عقاري بأسعار فائدة تنافسية وفترات سداد مرنة.",
        "point1": "شراكات مع أكبر البنوك المصرية",
        "point2": "مساعدة في تجهيز المستندات المطلوبة",
        "point3": "استشارة مجانية حول أفضل خيار تمويلي"
      }
    },
    "faq": {
      "eyebrow": "أسئلة شائعة",
      "title": "أسئلة شائعة حول السداد",
      "q1": "ما هو الحد الأدنى للمقدم؟",
      "a1": "يبدأ المقدم من 20% من إجمالي قيمة الوحدة في خطة تقسيط المطور. في حالة التمويل البنكي، يمكن أن يكون المقدم 20% فقط حسب البنك الممول.",
      "q2": "هل يمكن تغيير خطة السداد بعد التعاقد؟",
      "a2": "نعم، يمكنك التواصل مع فريق المبيعات لمناقشة تعديل خطة السداد حسب ظروفك المالية. نحرص على توفير أقصى مرونة لعملائنا.",
      "q3": "ما هي المستندات المطلوبة للتقسيط؟",
      "a3": "للتقسيط من المطور: صورة بطاقة الرقم القومي + إيصال مرافق. للتمويل البنكي: بطاقة رقم قومي + شهادة دخل + كشف حساب بنكي لآخر 6 أشهر.",
      "q4": "هل توجد غرامة للسداد المبكر؟",
      "a4": "لا توجد أي غرامات على السداد المبكر في خطة تقسيط المطور. بل نقدم خصماً إضافياً في حالة السداد المبكر للأقساط المتبقية."
    },
    "cta": {
      "eyebrow": "ابدأ الآن",
      "title": "ابدأ خطة السداد المناسبة لك",
      "subtitle": "تواصل مع مستشار المبيعات لمساعدتك في اختيار أفضل خطة سداد",
      "whatsapp": "تواصل عبر واتساب",
      "browseProjects": "تصفح المشاريع"
    }
  },
  "investors": {
    "hero": {
      "eyebrow": "الاستثمار العقاري",
      "title": "استثمر في عقارات مدينة السادات",
      "subtitle": "فرص استثمارية واعدة بعوائد مرتفعة في واحدة من أسرع المدن نمواً في مصر"
    },
    "stats": {
      "annualGrowth": "نمو سنوي في الأسعار",
      "rentalYield": "عائد إيجاري سنوي",
      "priceDifference": "أقل من القاهرة الجديدة",
      "privateInvestment": "جنيه استثمارات خاصة"
    },
    "whyInvest": {
      "eyebrow": "حجة الاستثمار",
      "title": "لماذا تستثمر في مدينة السادات؟",
      "subtitle": "مدينة السادات توفر مزيجاً فريداً من الأسعار التنافسية والعوائد المرتفعة والنمو المستمر"
    },
    "reasons": {
      "appreciation": {
        "title": "ارتفاع مستمر في القيمة",
        "description": "نمو سنوي 33% في أسعار العقارات مع توسع البنية التحتية والمشاريع الحكومية الجديدة"
      },
      "rentalIncome": {
        "title": "عائد إيجاري مرتفع",
        "description": "عوائد إيجارية تتراوح بين 15-20% سنوياً بفضل الطلب المتزايد من طلاب الجامعات والعاملين"
      },
      "infrastructure": {
        "title": "تطور البنية التحتية",
        "description": "مشاريع طرق ومرافق جديدة تزيد من قيمة العقارات وجاذبية المنطقة للسكن والاستثمار"
      },
      "security": {
        "title": "استثمار آمن",
        "description": "العقارات في مصر تحافظ على قيمتها وتتفوق على التضخم كملاذ آمن للأموال"
      },
      "location": {
        "title": "موقع استراتيجي",
        "description": "90 كم من القاهرة و120 كم من الإسكندرية مع ربط بالطرق السريعة والسكك الحديدية"
      },
      "flexiblePayment": {
        "title": "خطط سداد مرنة",
        "description": "تقسيط حتى 5 سنوات بدون فوائد من المطور مباشرة أو تمويل بنكي حتى 20 سنة"
      }
    },
    "marketData": {
      "eyebrow": "تحليل السوق",
      "title": "بيانات السوق",
      "subtitle": "أرقام حقيقية توضح تفوق مدينة السادات كوجهة استثمارية",
      "metricHeader": "المؤشر",
      "sadatHeader": "مدينة السادات",
      "avgHeader": "متوسط المدن الجديدة",
      "pricePerSqm": "سعر المتر المربع",
      "sadatPrice": "~11,500 جنيه",
      "avgPrice": "~35,000 جنيه",
      "annualAppreciation": "النمو السنوي",
      "sadatAppreciation": "33%",
      "avgAppreciation": "15-20%",
      "rentalYield": "العائد الإيجاري",
      "sadatYield": "15-20%",
      "avgYield": "8-12%",
      "roi": "عائد الاستثمار (5 سنوات)",
      "sadatRoi": "180-250%",
      "avgRoi": "80-120%",
      "disclaimer": "* الأرقام تقريبية مبنية على بيانات السوق حتى مارس 2026. الأداء السابق لا يضمن النتائج المستقبلية."
    },
    "packages": {
      "eyebrow": "خيارات الاستثمار",
      "title": "باقات الاستثمار",
      "subtitle": "اختر الباقة المناسبة لميزانيتك وأهدافك الاستثمارية",
      "recommended": "الأكثر طلباً",
      "starter": {
        "title": "باقة البداية",
        "description": "مثالية للمستثمر المبتدئ الباحث عن أول فرصة عقارية",
        "price": "من 700,000 جنيه",
        "feature1": "شقة 100 م² في مشروع 76",
        "feature2": "تقسيط حتى 5 سنوات",
        "feature3": "عائد إيجاري متوقع 15%"
      },
      "premium": {
        "title": "الباقة المميزة",
        "description": "الخيار الأمثل لعائد استثماري مرتفع في المنطقة الذهبية",
        "price": "من 1,050,000 جنيه",
        "feature1": "شقة 150 م² في مشروع 865",
        "feature2": "موقع متميز في المنطقة الذهبية",
        "feature3": "عائد إيجاري متوقع 18%"
      },
      "vip": {
        "title": "باقة VIP",
        "description": "للمستثمر الباحث عن أقصى عائد مع وحدات فاخرة",
        "price": "من 1,600,000 جنيه",
        "feature1": "بنتهاوس 220 م² في مشروع 868",
        "feature2": "تشطيبات سوبر لوكس",
        "feature3": "عائد إيجاري متوقع 20%"
      }
    },
    "cta": {
      "eyebrow": "ابدأ اليوم",
      "title": "ابدأ رحلتك الاستثمارية الآن",
      "subtitle": "تواصل مع مستشار الاستثمار لدينا للحصول على دراسة جدوى مجانية ومخصصة لأهدافك",
      "browseProjects": "تصفح المشاريع"
    }
  },
  "sadatMaps": {
    "hero": {
      "eyebrow": "خرائط المدينة",
      "title": "خارطة مدينة السادات",
      "subtitle": "دليل سريع لفهم أهم مناطق مدينة السادات وتوزيعها العقاري قبل اتخاذ قرار الشراء أو الاستثمار"
    },
    "overview": {
      "eyebrow": "عن هذا الدليل",
      "title": "المرجع السريع لمناطق مدينة السادات",
      "paragraph1": "هذه الصفحة تجمع كل مناطق السادات في مكان واحد مع رابط مباشر لتحميل خريطة كل منطقة.",
      "paragraph2": "استخدمها كمرجع جاهز للوصول إلى الخرائط حسب المنطقة والحي."
    },
    "zones": {
      "eyebrow": "دليل المناطق",
      "title": "المنطقة / الخريطة",
      "description": "اضغط على تحميل الخريطة لفتح ملف PDF الخاص بكل منطقة.",
      "table": {
        "zone": "المنطقة",
        "map": "الخريطة",
        "download": "تحميل الخريطة"
      }
    },
    "whyMap": {
      "eyebrow": "نصيحة مهمة",
      "title": "كيف تستخدم الخريطة قبل الحجز؟",
      "paragraph": "ابدأ بتحديد هدفك (سكن أو استثمار)، ثم قارن كل منطقة من حيث القرب من الخدمات والطرق الرئيسية وسرعة النمو. بعد ذلك انتقل لمقارنة المشاريع المتاحة داخل كل منطقة لاختيار الوحدة الأنسب."
    },
    "cta": {
      "eyebrow": "الخطوة القادمة",
      "title": "الخطوة التالية",
      "subtitle": "تصفح مشاريع الأهرام حسب المنطقة واطلب استشارة مجانية لاختيار أفضل موقع يناسب ميزانيتك.",
      "projects": "تصفح المشاريع حسب المنطقة",
      "guide": "العودة إلى دليل مدينة السادات",
      "browseProjects": "تصفح المشاريع",
      "whatsapp": "تواصل عبر واتساب"
    }
  },
  "seo": {
    "home": {
      "description": "الأهرام للتطوير العقاري — شقق ووحدات سكنية للبيع في المنطقة الذهبية بمدينة السادات. أسعار تنافسية وتقسيط مريح حتى 5 سنوات بدون فوائد.",
      "keywords": "شقق للبيع في مدينة السادات, الأهرام للتطوير العقاري, عقارات المنطقة الذهبية, وحدات سكنية المنطقة 21, شقق بالتقسيط مدينة السادات, أسعار شقق مدينة السادات, استثمار عقاري السادات, مدينة السادات المنوفية"
    },
    "about": {
      "title": "من نحن | الأهرام للتطوير العقاري",
      "description": "الأهرام للتطوير العقاري — شركة رائدة في بناء المجتمعات السكنية بمدينة السادات منذ سنوات. نقدم وحدات سكنية عالية الجودة بمواصفات متميزة وخدمات ما بعد البيع.",
      "keywords": "من نحن الأهرام, شركة الأهرام للتطوير العقاري, تاريخ شركة الأهرام, مشاريع الأهرام مدينة السادات, رؤية الأهرام العقارية, مطور عقاري مدينة السادات"
    },
    "contact": {
      "title": "تواصل معنا | الأهرام للتطوير العقاري",
      "description": "تواصل مع فريق مبيعات الأهرام للتطوير العقاري. اتصل على 01153516871 أو راسلنا عبر واتساب للاستفسار عن الوحدات المتاحة والأسعار.",
      "keywords": "تواصل مع الأهرام, هاتف الأهرام العقاري, واتساب الأهرام, عنوان مكتب الأهرام, اتصل بنا مدينة السادات, استفسار عقاري السادات"
    },
    "gallery": {
      "title": "معرض صور المشاريع | الأهرام للتطوير العقاري",
      "description": "شاهد أحدث صور مشاريع الأهرام العقارية في مدينة السادات — صور الشقق والتشطيبات ومراحل البناء في المنطقة 21 والمناطق المجاورة.",
      "keywords": "صور مشاريع الأهرام, معرض صور شقق مدينة السادات, تشطيبات شقق المنطقة 21, صور عقارات السادات, صور وحدات سكنية المنطقة الذهبية"
    },
    "privacy": {
      "title": "سياسة الخصوصية",
      "description": "سياسة الخصوصية لشركة الأهرام للتطوير العقاري — كيف نجمع ونستخدم ونحمي بياناتك الشخصية",
      "keywords": "سياسة الخصوصية, الأهرام, حماية البيانات, خصوصية"
    },
    "projects": {
      "title": "مشاريعنا العقارية | الأهرام للتطوير العقاري",
      "description": "تصفح مشاريع الأهرام للتطوير العقاري في مدينة السادات — وحدات سكنية في المنطقة 21، 22، 29، حي الروضة، المنطقة 35. أسعار مناسبة وتقسيط ميسر.",
      "keywords": "مشاريع الأهرام العقارية, وحدات سكنية المنطقة 21, شقق المنطقة 22 السادات, مشاريع حي الروضة, عقارات المنطقة 29, شقق للبيع المنطقة 35, مجمعات سكنية مدينة السادات"
    },
    "blog": {
      "title": "مدونة العقارات | الأهرام للتطوير العقاري",
      "description": "أحدث مقالات سوق العقارات المصري — نصائح شراء شقق بالتقسيط، أفضل مناطق الاستثمار في مدينة السادات، وأخبار مشاريع الأهرام.",
      "keywords": "مدونة عقارية, سوق العقارات مصر 2025, نصائح شراء شقق, استثمار عقاري مدينة السادات, أخبار الأهرام العقاري, شراء شقة بالتقسيط مصر"
    },
    "paymentPlans": {
      "title": "خطط التقسيط والسداد | الأهرام للتطوير العقاري",
      "description": "خطط تقسيط مرنة لشقق الأهرام في مدينة السادات — مقدم يبدأ من 10% وأقساط شهرية ميسرة حتى 5 سنوات بدون فوائد. احسب قسطك الآن.",
      "keywords": "تقسيط شقق مدينة السادات, خطط سداد الأهرام, شقق بمقدم 10%, أقساط بدون فوائد السادات, تمويل عقاري مدينة السادات, حاسبة التقسيط العقاري"
    },
    "constructionUpdates": {
      "title": "تحديثات البناء | مشاريع الأهرام للتطوير العقاري",
      "description": "تابع مراحل تنفيذ مشاريع الأهرام العقارية في مدينة السادات — تحديثات شهرية بالصور والفيديو لمشاريع المنطقة 21، 22، 29 وحي الروضة.",
      "keywords": "تحديثات بناء الأهرام, مراحل تنفيذ المشاريع, إنجاز مشروع المنطقة 21, صور البناء مدينة السادات, تقدم الأعمال مشاريع السادات, تحديثات مشروع حي الروضة, وحدات قيد البناء السادات, مشاريع جاهزة للتسليم مدينة السادات"
    },
    "sadatGuide": {
      "title": "دليل مدينة السادات الشامل | الأهرام للتطوير العقاري",
      "description": "دليلك الشامل عن مدينة السادات — الموقع والمسافة من القاهرة، الخدمات والمرافق، أفضل المناطق السكنية، وأسعار العقارات 2026.",
      "keywords": "دليل مدينة السادات, مسافة القاهرة مدينة السادات, خدمات مدينة السادات, مناطق السكن في السادات, أسعار عقارات السادات 2026, المنطقة الذهبية السادات, الحياة في مدينة السادات, مميزات السكن في مدينة السادات, مدينة السادات المنوفية"
    },
    "sadatMaps": {
      "title": "خارطة مدينة السادات",
      "description": "تحميل خرائط PDF لمناطق مدينة السادات: المنطقة الـ 21، 22، 24، 25، 26، 27، 28، 29، 31، 32، 33، 34، 35، 36، الحي المتميز، حي الروضة، حي الريحان، حي الزيتون، حي الفردوس، حي النخيل. دليلك الكامل للاختيار السكني والاستثماري.",
      "keywords": "خريطة مدينة السادات, خريطة المنطقة الـ 21, خريطة المنطقة الـ 22, خريطة المنطقة الـ 29, خرائط مناطق السادات PDF, خريطة الحي المتميز, تحميل خريطة السادات, مناطق مدينة السادات, خريطة المنطقة الـ 35, خريطة حي الروضة"
    },
    "investors": {
      "title": "فرص الاستثمار العقاري | الأهرام للتطوير العقاري",
      "description": "استثمر في مدينة السادات مع الأهرام — عائد استثماري حتى 33% سنوياً، أسعار تنافسية، ومشاريع في المناطق الأكثر طلباً. ابدأ استثمارك اليوم.",
      "keywords": "استثمار عقاري مدينة السادات, عائد 33% سنوي, أفضل استثمار عقاري مصر 2025, شراء عقار بالتقسيط للاستثمار, المنطقة الذهبية للاستثمار, عقارات مدينة السادات للبيع"
    }
  },
  "newsletter": {
    "title": "النشرة البريدية",
    "description": "اشترك ليصلك أحدث العروض وآخر أخبار مشاريعنا",
    "placeholder": "بريدك الإلكتروني",
    "subscribe": "اشتراك",
    "success": "شكراً لاشتراكك! سنرسل لك أحدث الأخبار والعروض.",
    "error": "حدث خطأ. حاول مرة أخرى."
  },
  "errors": {
    "unexpected": "حدث خطأ غير متوقع",
    "noConnection": "لا يمكن الاتصال بالخادم",
    "badRequest": "طلب غير صالح",
    "forbidden": "غير مصرح لك بالوصول",
    "notFound": "المورد غير موجود",
    "serverError": "خطأ في الخادم الداخلي"
  },
  "calculator": {
    "sectionTitle": "حاسبة الأقساط",
    "title": "احسب القسط الشهري",
    "price": "سعر الوحدة (جنيه)",
    "downPayment": "المقدم",
    "term": "مدة التقسيط",
    "years": "سنة",
    "interestRate": "نسبة الفائدة",
    "monthlyPayment": "القسط الشهري",
    "downPaymentAmount": "مبلغ المقدم",
    "loanAmount": "مبلغ التمويل",
    "totalAmount": "إجمالي المبلغ",
    "totalInterest": "إجمالي الفائدة",
    "disclaimer": "* هذه الأرقام تقريبية لأغراض إرشادية فقط. تواصل معنا للحصول على عرض سعر دقيق."
  },
  "privacy": {
    "hero": {
      "eyebrow": "قانوني",
      "title": "سياسة الخصوصية",
      "lastUpdated": "آخر تحديث: يناير 2025"
    },
    "introduction": {
      "title": "مقدمة",
      "content": "تلتزم شركة الأهرام للتطوير والاستثمار العقاري بحماية خصوصية زوار موقعنا الإلكتروني وعملائنا. توضح هذه السياسة كيفية جمع واستخدام وحماية المعلومات الشخصية التي تقدمها لنا عبر موقعنا الإلكتروني أو من خلال التواصل المباشر معنا."
    },
    "collection": {
      "title": "المعلومات التي نجمعها",
      "content": "نجمع المعلومات التي تقدمها طوعياً عند استخدام نموذج التواصل على موقعنا، وتشمل: الاسم الكامل، رقم الهاتف، والرسالة. لا نجمع أي معلومات حساسة مثل بيانات الدفع أو الرقم القومي عبر الموقع الإلكتروني."
    },
    "usage": {
      "title": "كيف نستخدم معلوماتك",
      "content": "نستخدم المعلومات التي نجمعها للأغراض التالية: الرد على استفساراتك حول مشاريعنا السكنية، التواصل معك بخصوص العروض والمشاريع الجديدة، تحسين خدماتنا وتجربة المستخدم على موقعنا، والامتثال للمتطلبات القانونية والتنظيمية."
    },
    "security": {
      "title": "أمان البيانات",
      "content": "نتخذ إجراءات أمنية مناسبة لحماية معلوماتك الشخصية من الوصول غير المصرح به أو التعديل أو الإفصاح أو الإتلاف. ومع ذلك، لا يمكن ضمان أمان نقل البيانات عبر الإنترنت بنسبة 100%، ونحن نبذل قصارى جهدنا لحماية بياناتك."
    },
    "cookies": {
      "title": "ملفات تعريف الارتباط",
      "content": "قد يستخدم موقعنا ملفات تعريف الارتباط (الكوكيز) لتحسين تجربة التصفح وتذكر تفضيلاتك مثل اللغة والمظهر. يمكنك التحكم في إعدادات ملفات تعريف الارتباط من خلال متصفحك."
    },
    "rights": {
      "title": "حقوقك",
      "content": "لديك الحق في الوصول إلى معلوماتك الشخصية التي نحتفظ بها، وطلب تصحيحها أو حذفها. يمكنك أيضاً الاعتراض على معالجة بياناتك أو طلب تقييدها. لممارسة أي من هذه الحقوق، يرجى التواصل معنا عبر معلومات الاتصال أدناه."
    },
    "contact": {
      "title": "تواصل معنا",
      "content": "إذا كانت لديك أي أسئلة أو استفسارات حول سياسة الخصوصية هذه أو ممارسات حماية البيانات لدينا، يرجى التواصل معنا:",
      "emailLabel": "البريد الإلكتروني: ",
      "phoneLabel": "الهاتف: "
    }
  },
  "units": {
    "eyebrow": "تصفح الوحدات المتاحة",
    "title": "استكشف وحداتنا السكنية",
    "subtitle": "قارني بين المساحات والأسعار في كل مشاريعنا، واختاري الوحدة الأنسب لاحتياجك",
    "noResults": "لا توجد وحدات مطابقة لبحثك، جربي توسيع نطاق الفلترة",
    "filters": {
      "maxPrice": "أقصى سعر",
      "rooms": "عدد الغرف",
      "any": "الكل"
    },
    "card": {
      "sqm": "م²",
      "rooms": "غرف",
      "floor": "دور"
    },
    "status": {
      "available": "متاحة",
      "reserved": "محجوزة",
      "sold": "مباعة"
    },
    "seo": {
      "title": "الوحدات السكنية المتاحة",
      "description": "تصفحي وحداتنا السكنية المتاحة في مدينة السادات مع تفاصيل المساحة والسعر وعدد الغرف لكل وحدة",
      "keywords": "وحدات سكنية مدينة السادات, شقق للبيع, أسعار الوحدات"
    }
  },
  "chat": {
    "title": "مساعد الأهرام الذكي",
    "open": "افتحي المساعد الذكي",
    "close": "قفلي المحادثة",
    "greeting": "أهلاً! أنا مساعد الأهرام الذكي 🏛️ اسأليني عن المشاريع، المساحات، الأسعار، أو نظام التقسيط.",
    "placeholder": "اكتبي سؤالك هنا...",
    "send": "إرسال",
    "typing": "بيكتب...",
    "error": "معلش، حصلت مشكلة في الاتصال. جربي تاني كمان شوية."
  }
}
AHRAM_EOF_24
echo "  wrote: src/assets/i18n/ar.json"

mkdir -p "src/assets/i18n"
cat > "src/assets/i18n/en.json" << 'AHRAM_EOF_25'
{
  "app": {
    "name": "Al-Ahram Developments",
    "description": "A leading real estate development company in Egypt",
    "tagline": "Building the Future with Trusted Hands"
  },
  "header": {
    "home": "Home",
    "about": "About Us",
    "projects": "Our Projects",
    "contact": "Contact Us",
    "gallery": "Gallery",
    "tagline": "Building the Future with Trusted Hands",
    "toggleTheme": "Toggle theme",
    "toggleLanguage": "عربي — Switch language to Arabic",
    "login": "Login",
    "blog": "Blog",
    "paymentPlans": "Payment Plans",
    "constructionUpdates": "Construction Updates",
    "sadatGuide": "Sadat City Guide",
    "sadatMaps": "Sadat City Maps",
    "investors": "Investors",
    "units": "Units"
  },
  "nav": {
    "menu": "Menu",
    "close": "Close menu"
  },
  "footer": {
    "rights": "All rights reserved.",
    "privacy": "Privacy Policy",
    "terms": "Terms & Conditions",
    "contact": "Contact Us",
    "company": "About Company",
    "companyDescription": "Al-Ahram Developments — a leading real estate company in Sadat City, committed to delivering premium residential projects with the highest quality standards.",
    "quickLinks": "Quick Links",
    "resources": "Resources",
    "contactInfo": "Contact Info",
    "address": "Sadat City, Monufia, Egypt",
    "phone": "01031198677",
    "whatsapp": "WhatsApp",
    "email": "info@alahram-developments.com",
    "designedWith": "Designed with trust & excellence"
  },
  "whatsapp": {
    "tooltip": "Chat with us on WhatsApp",
    "prefilledMessage": "Hello, I would like to inquire about your real estate projects."
  },
  "call": {
    "tooltip": "Call us now"
  },
  "facebook": {
    "tooltip": "Follow us on Facebook"
  },
  "notFound": {
    "title": "Page Not Found",
    "description": "Sorry, the page you are looking for does not exist or has been moved.",
    "backHome": "Back to Home"
  },
  "common": {
    "loading": "Loading...",
    "error": "An error occurred",
    "retry": "Retry",
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit",
    "search": "Search",
    "filter": "Filter",
    "noResults": "No results found",
    "confirm": "Confirm",
    "back": "Back",
    "next": "Next",
    "previous": "Previous",
    "submit": "Submit",
    "close": "Close",
    "yes": "Yes",
    "no": "No"
  },
  "validation": {
    "required": "This field is required",
    "email": "Invalid email address",
    "minLength": "Must be at least {{min}} characters",
    "maxLength": "Must not exceed {{max}} characters",
    "phone": "Invalid phone number",
    "mismatch": "Values do not match"
  },
  "home": {
    "hero": {
      "eyebrow": "Premium real estate development in Sadat City",
      "title": "Al-Ahram for Development & Real Estate Investment",
      "subtitle": "Building your future with trusted hands in the heart of Sadat City",
      "browseProjects": "Browse Projects",
      "contactUs": "Contact Us",
      "imageAlt": "Al-Ahram Developments real estate projects in Sadat City"
    },
    "trustBar": {
      "eyebrow": "Al-Ahram by the numbers",
      "projects": "Outstanding Projects",
      "units": "Residential Units",
      "years": "Years of Experience"
    },
    "brandStory": {
      "eyebrow": "Our Story",
      "title": "We Build More Than Just Homes",
      "paragraph1": "Al-Ahram for Development & Real Estate Investment was founded with one purpose: to give every Egyptian family a quality home at a fair price. We develop residential projects in the Golden Zone of Sadat City — one of Egypt's most promising growth corridors.",
      "paragraph2": "We believe every family deserves a home that offers genuine safety and comfort. That is why we hold ourselves to the highest finishing standards and the strictest transparency in every transaction.",
      "cta": "Learn more about us",
      "imageAlt": "Al-Ahram real estate development project in Sadat City",
      "logoAlt": "Al-Ahram Developments logo",
      "highlights": {
        "founded": {
          "value": "2019",
          "label": "Founded"
        },
        "city": {
          "value": "Sadat City",
          "label": "Our City"
        },
        "mission": {
          "value": "20+",
          "label": "Projects Delivered"
        }
      }
    },
    "zones": {
      "eyebrow": "Choose Your Neighbourhood",
      "title": "Explore Sadat City Zones",
      "subtitle": "Al-Ahram has projects across Sadat City's most desirable zones — find the neighbourhood that fits your life",
      "viewAll": "View All Projects",
      "cardCta": "Browse Projects"
    },
    "mosaic": {
      "eyebrow": "From Our Portfolio",
      "title": "Projects That Speak for Themselves",
      "subtitle": "Real photography from Al-Ahram developments across Sadat City",
      "viewAll": "Browse All Projects",
      "project29": "Project 29",
      "project137": "Project 137",
      "project255": "Project 255",
      "project336": "Project 336",
      "project348": "Project 348",
      "project584": "Project 584",
      "project629": "Project 629"
    },
    "lifestyle": {
      "eyebrow": "A Complete Life",
      "title": "Everything You Need, Nearby",
      "subtitle": "Sadat City gives your family a fully-integrated living environment — schools, parks, services, and security",
      "schools": {
        "title": "Schools & Institutes",
        "description": "Diverse educational institutions within easy reach of our projects"
      },
      "parks": {
        "title": "Parks & Green Spaces",
        "description": "Open green areas for relaxation and family recreation"
      },
      "transit": {
        "title": "Easy Transport",
        "description": "Direct access to major roads and surrounding areas"
      },
      "security": {
        "title": "Safety & Security",
        "description": "A secure residential zone with round-the-clock security services"
      },
      "retail": {
        "title": "Shopping & Services",
        "description": "Commercial centres and daily service shops at your doorstep"
      }
    },
    "projects": {
      "title": "Our Featured Projects",
      "subtitle": "Discover our latest residential projects in the best locations in Sadat City",
      "viewDetails": "View Details",
      "project865": {
        "name": "Project 865",
        "description": "A premium residential project in the Golden Zone of Sadat City",
        "location": "Golden Zone, Sadat City",
        "status": "Under Construction"
      },
      "project868": {
        "name": "Project 868",
        "description": "Luxury residential units with modern designs and high-quality finishes",
        "location": "Golden Zone, Sadat City",
        "status": "Under Construction"
      },
      "project76": {
        "name": "Project 76",
        "description": "A complete residential project with various sizes to suit all needs",
        "location": "Sadat City",
        "status": "Available for Booking"
      }
    },
    "whyUs": {
      "eyebrow": "Our competitive edge",
      "title": "Why Al-Ahram?",
      "subtitle": "Outstanding projects - highest quality standards - full transparency - fair pricing",
      "trust": {
        "title": "Trust & Security",
        "description": "A proven track record of successful projects and years of customer trust"
      },
      "transparency": {
        "title": "Full Transparency",
        "description": "Clear dealings and documented contracts that guarantee your rights"
      },
      "pricing": {
        "title": "Fair Pricing",
        "description": "Maximum real estate value at the best prices in the market"
      },
      "safety": {
        "title": "Safe Investment",
        "description": "Strategic locations in Sadat City ensuring high investment returns"
      }
    },
    "gallery": {
      "eyebrow": "Our Projects in Images",
      "title": "Photo Gallery",
      "subtitle": "View the latest photos of our projects and construction progress",
      "viewMore": "View More"
    },
    "testimonials": {
      "title": "Client Testimonials",
      "subtitle": "Real experiences from clients who trusted us",
      "verifiedCustomer": "Verified Customer"
    },
    "cta": {
      "eyebrow": "Start Your Journey",
      "title": "Book Your Unit Now",
      "subtitle": "Contact us today and get the best offers and payment plans",
      "whatsapp": "Chat on WhatsApp",
      "call": "Call Us"
    },
    "location": {
      "eyebrow": "Find Us",
      "title": "Our Location",
      "subtitle": "Located in the heart of Sadat City ",
      "address": "Dar Mesr Mall, Sadat City, Monufia, Egypt",
      "addressLabel": "Address",
      "phoneLabel": "Phone",
      "directions": "Get Directions",
      "mapTitle": "Al-Ahram Developments Location",
      "mapLoading": "Loading map..."
    }
  },
  "zones": {
    "eyebrow": "Browse by Location",
    "hero": {
      "eyebrow": "Explore Projects"
    },
    "projects": {
      "eyebrow": "Available Listings",
      "title": "Projects in This Zone"
    },
    "title": "Project Zones",
    "subtitle": "Explore our residential projects across different zones in Sadat City",
    "projectsCount": "{{count}} projects",
    "projectCount_one": "1 project",
    "projectCount_other": "{{count}} projects",
    "browseZone": "Browse Projects",
    "backToZones": "Back to Zones",
    "zoneProjects": "{{zone}} Projects",
    "zone7Strip": {
      "name": "Zone 7 (Premium Strip)",
      "description": "Upscale residential projects in the Premium Strip of Zone 7"
    },
    "zone7Homeland": {
      "name": "Zone 7 (Beit El-Watan)",
      "description": "Beit El-Watan residential projects in Zone 7, Sadat City"
    },
    "zone14": {
      "name": "Zone 14",
      "description": "Diverse residential projects in Zone 14, Sadat City"
    },
    "zone21": {
      "name": "Zone 21 (The Golden Zone)",
      "description": "Our largest zone — 10 projects in the heart of the Golden Zone, Sadat City"
    },
    "zone22": {
      "name": "Zone 22",
      "description": "Premium residential projects in Zone 22, Sadat City"
    },
    "zone29": {
      "name": "Zone 29",
      "description": "Residential projects in Zone 29, Sadat City"
    },
    "alRawda": {
      "name": "Al-Rawda District",
      "description": "Residential projects in the distinguished Al-Rawda District, Sadat City"
    },
    "zone35": {
      "name": "Zone 35",
      "description": "New residential projects in Zone 35, Sadat City"
    }
  },
  "projects": {
    "overview": {
      "eyebrow": "Project Details",
      "title": "Overview"
    },
    "phasesEyebrow": "Progress Tracking",
    "galleryEyebrow": "Visual Tour",
    "masterPlanEyebrow": "Project Design",
    "masterPlanTitle": "Master Plan",
    "locationEyebrow": "Find Us",
    "title": "Our Projects",
    "subtitle": "Explore all our premium residential projects in the best locations in Sadat City",
    "viewDetails": "View Details",
    "backToProjects": "Back to Projects",
    "backToZone": "Back to Zone Projects",
    "progress": "Completion",
    "lastUpdated": "Last Updated",
    "unitTypesTitle": "Available Units",
    "sqm": "m²",
    "amenitiesTitle": "Amenities & Services",
    "galleryTitle": "Photo Gallery",
    "phasesTitle": "Construction Progress",
    "phasesSubtitle": "Follow the project completion percentage and construction phases step by step",
    "locationTitle": "Location on Map",
    "cta": {
      "eyebrow": "Reserve Your Unit",
      "title": "Book Your Unit Now",
      "subtitle": "Contact us today and get the best prices and flexible payment plans",
      "whatsapp": "Chat on WhatsApp",
      "call": "Call Us"
    },
    "unitTypes": {
      "apartment": "Apartment",
      "duplex": "Duplex",
      "penthouse": "Penthouse"
    },
    "amenities": {
      "parking": "Car Parking",
      "garden": "Gardens & Green Spaces",
      "security": "24/7 Security",
      "elevator": "Elevators",
      "playground": "Children's Playground",
      "mosque": "Mosque",
      "commercialArea": "Commercial Area",
      "wideStreets": "Wide Streets"
    },
    "project865": {
      "name": "Project 865",
      "description": "A premium residential project in the Golden Zone of Sadat City",
      "statusDescription": "Project 865 is a premium residential project located in the heart of the Golden Zone in Sadat City. The project features modern architectural designs and high-quality finishes, with various sizes to suit all needs. It provides a complete residential environment with all facilities and services that ensure a comfortable and safe life for you and your family.",
      "location": "Golden Zone, Sadat City",
      "status": "Under Construction",
      "price120": "Starting from 850,000 EGP",
      "price150": "Starting from 1,050,000 EGP",
      "price200": "Starting from 1,400,000 EGP"
    },
    "project868": {
      "name": "Project 868",
      "description": "Luxury residential units with modern designs and high-quality finishes",
      "statusDescription": "Project 868 offers luxury residential units with modern designs in the Golden Zone of Sadat City. The project features super deluxe finishes and spacious areas with distinctive views. It includes a complete commercial area and various service facilities to meet all your daily needs.",
      "location": "Golden Zone, Sadat City",
      "status": "Under Construction",
      "price130": "Starting from 920,000 EGP",
      "price160": "Starting from 1,150,000 EGP",
      "price220": "Starting from 1,600,000 EGP"
    },
    "project76": {
      "name": "Project 76",
      "description": "A complete residential project with various sizes to suit all needs",
      "statusDescription": "Project 76 is a complete residential project located in a strategic location in Sadat City. The project offers various sizes starting from 100 square meters with smart designs that make the most of every meter. It features wide streets, green spaces, and all essential services that make it the ideal choice for families.",
      "location": "Al-Rawda District, Sadat City",
      "status": "Under Construction",
      "price100": "Starting from 700,000 EGP",
      "price140": "Starting from 980,000 EGP",
      "price180": "Starting from 1,250,000 EGP"
    },
    "project255": {
      "name": "Project 255",
      "description": "An upscale residential project in the Premium Strip of Zone 7",
      "location": "Zone 7, Premium Strip",
      "status": "Under Construction"
    },
    "project29": {
      "name": "Project 29",
      "description": "A residential project in Beit El-Watan, Zone 7",
      "location": "Zone 7, Beit El-Watan",
      "status": "Under Construction"
    },
    "project336": {
      "name": "Project 336",
      "description": "A fully delivered residential project in Zone 14",
      "location": "Zone 14, Sadat City",
      "status": "Delivered"
    },
    "project331": {
      "name": "Project 331",
      "description": "A fully delivered residential project in Zone 14",
      "location": "Zone 14, Sadat City",
      "status": "Delivered"
    },
    "project348": {
      "name": "Project 348",
      "description": "A residential project under construction in Zone 14",
      "location": "Zone 14, Sadat City",
      "status": "Under Construction"
    },
    "miniCompound": {
      "name": "Al-Ahram Mini Compound (593, 594, 595)",
      "description": "A fully-serviced mini compound in the Golden Zone, Sadat City",
      "location": "Zone 21, Sadat City",
      "status": "Near Delivery"
    },
    "project629": {
      "name": "Project 629",
      "description": "A premium residential project near delivery in the Golden Zone",
      "location": "Zone 21, Sadat City",
      "status": "Near Delivery"
    },
    "project584": {
      "name": "Project 584",
      "description": "A premium residential project in the Golden Zone, Sadat City",
      "location": "Zone 21, Sadat City",
      "status": "Under Construction"
    },
    "project947": {
      "name": "Project 947",
      "description": "A residential project in the Golden Zone, Sadat City",
      "location": "Zone 21, Sadat City",
      "status": "Under Construction"
    },
    "project791": {
      "name": "Project 791",
      "description": "A residential project under construction in the Golden Zone",
      "location": "Zone 21, Sadat City",
      "status": "Under Construction"
    },
    "project794": {
      "name": "Project 794",
      "description": "A new residential project in the Golden Zone, Sadat City",
      "location": "Zone 21, Sadat City",
      "status": "Under Construction"
    },
    "project799": {
      "name": "Project 799",
      "description": "A new residential project in the Golden Zone, Sadat City",
      "location": "Zone 21, Sadat City",
      "status": "Under Construction"
    },
    "project870": {
      "name": "Project 870",
      "description": "A residential project pending construction permit",
      "location": "Zone 21, Sadat City",
      "status": "Pending Construction Permit"
    },
    "project1102": {
      "name": "Project 1102",
      "description": "A premium residential project in Zone 22, Sadat City",
      "location": "Zone 22, Sadat City",
      "status": "Under Construction"
    },
    "project1290": {
      "name": "Project 1290",
      "description": "A fully delivered residential project in Zone 29",
      "location": "Zone 29, Sadat City",
      "status": "Delivered"
    },
    "project94": {
      "name": "Project 94",
      "description": "A residential project under construction in Al-Rawda District",
      "location": "Al-Rawda District, Sadat City",
      "status": "Under Construction"
    },
    "project137": {
      "name": "Project 137",
      "description": "A premium residential project in Zone 35, Sadat City",
      "location": "Zone 35, Sadat City",
      "status": "Under Construction"
    },
    "relatedTitle": "More Projects in This Zone"
  },
  "about": {
    "hero": {
      "eyebrow": "Our Company",
      "title": "About Us — Al-Ahram Developments",
      "subtitle": "Building premium residential communities in the heart of Sadat City for over 5 years"
    },
    "story": {
      "eyebrow": "Our Journey",
      "title": "Our Story",
      "paragraph1": "Al-Ahram for Development & Real Estate Investment was founded with the goal of delivering premium residential projects that combine high quality with affordable prices. Since our launch, we have been developing residential projects in the Golden Zone of Sadat City, one of the most promising areas in Egypt.",
      "paragraph2": "We believe every family deserves a home that provides comfort and security. That's why we are committed to offering residential units with modern designs and high-quality finishes, along with all the facilities and services that ensure a comfortable and stable life."
    },
    "mission": {
      "eyebrow": "Values & Purpose",
      "sectionTitle": "Mission & Vision",
      "title": "Our Mission",
      "description": "To deliver high-quality residential projects at competitive prices, with a commitment to the highest standards of transparency and integrity in dealing with our clients, making us the first choice for families seeking their dream home in Sadat City."
    },
    "vision": {
      "title": "Our Vision",
      "description": "To be the leading real estate developer in Sadat City, by building integrated residential communities that combine modern design with sustainability, contributing to improving the quality of life for the city's residents."
    },
    "stats": {
      "projects": "Outstanding Projects",
      "units": "Residential Units",
      "years": "Years of Experience",
      "clients": "Happy Clients"
    },
    "values": {
      "eyebrow": "Guiding Principles",
      "title": "Our Values",
      "subtitle": "The principles that guide our work in every project",
      "quality": {
        "title": "Quality",
        "description": "We adhere to the highest construction and finishing standards in all our projects to ensure customer satisfaction"
      },
      "integrity": {
        "title": "Integrity",
        "description": "We deal with complete transparency with our clients through clear contracts and fair pricing"
      },
      "innovation": {
        "title": "Innovation",
        "description": "We employ the latest architectural designs and technologies to deliver modern and comfortable residential units"
      },
      "customer": {
        "title": "Customer Focus",
        "description": "We put customer satisfaction at the top of our priorities and provide continuous support before and after the sale"
      }
    },
    "cta": {
      "eyebrow": "Get Started",
      "title": "Start Your Journey With Us",
      "subtitle": "Contact us today and discover our premium residential projects in Sadat City",
      "whatsapp": "Chat on WhatsApp",
      "call": "Call Us"
    }
  },
  "contact": {
    "hero": {
      "eyebrow": "Get in Touch",
      "title": "Contact Us",
      "subtitle": "We're here to help — reach out to us in any way that suits you"
    },
    "info": {
      "phone": {
        "label": "Call Us"
      },
      "whatsapp": {
        "label": "WhatsApp"
      },
      "email": {
        "label": "Email"
      }
    },
    "form": {
      "eyebrow": "Write to Us",
      "title": "Send Us a Message",
      "subtitle": "Fill out the form and we'll get back to you as soon as possible",
      "name": "Full Name",
      "namePlaceholder": "Enter your full name",
      "phone": "Phone Number",
      "phonePlaceholder": "01xxxxxxxxx",
      "message": "Message",
      "messagePlaceholder": "Write your message here...",
      "submit": "Send Message",
      "successTitle": "Message Sent Successfully!",
      "successMessage": "Thank you for reaching out. We'll get back to you as soon as possible.",
      "sendAnother": "Send Another Message",
      "error": "Something went wrong. Please try again."
    },
    "map": {
      "title": "Al-Ahram Developments Location",
      "loading": "Loading map...",
      "address": "Dar Mesr Mall, Sadat City, Monufia, Egypt"
    },
    "cta": {
      "title": "We'd Love to Hear From You",
      "subtitle": "Our team is ready to answer all your questions about our residential projects",
      "whatsapp": "Chat on WhatsApp",
      "call": "Call Us"
    }
  },
  "gallery": {
    "hero": {
      "eyebrow": "Our Portfolio",
      "title": "Photo Gallery",
      "subtitle": "View the latest photos of our projects and construction progress in Sadat City"
    },
    "filters": {
      "all": "All",
      "renders": "Project Renders",
      "selectProject": "Filter by project...",
      "project865": "Project 865",
      "project868": "Project 868",
      "project76": "Project 76"
    },
    "alt": {
      "project865": "Photo from Project 865",
      "project868": "Photo from Project 868",
      "project76": "Photo from Project 76"
    }
  },
  "blog": {
    "hero": {
      "eyebrow": "Latest Articles",
      "title": "Blog",
      "subtitle": "Latest articles and news about the real estate market and our projects"
    },
    "filters": {
      "all": "All",
      "companyNews": "Company News",
      "marketInsights": "Market Insights",
      "investmentTips": "Investment Tips"
    },
    "readMore": "Read More",
    "backToBlog": "Back to Blog",
    "share": "Share Article",
    "recentPosts": "Recent Posts",
    "readingTime": "{{ minutes }} min read",
    "posts": {
      "post1": {
        "title": "Sadat City 2026: A Complete Overview of Egypt's Rising Urban Hub",
        "excerpt": "Discover Sadat City — its zones, infrastructure, services, and why it has become a leading investment destination in Egypt",
        "content1": "Sadat City is a planned urban center located in Monufia Governorate, approximately 90 kilometers northwest of Cairo, connected to the capital by the Cairo-Alexandria Desert Road. Founded in the 1970s to relieve pressure on Cairo, it has grown into one of Egypt's most dynamic and fastest-growing new cities.",
        "content2": "The city encompasses diverse residential districts spanning numbered zones from Zone 1 through Zone 21, alongside large industrial areas housing hundreds of factories and companies. This balance between residential, industrial, and service sectors gives the city an economic stability that underpins its real estate value.",
        "content3": "In 2026, Sadat City is experiencing a notable construction boom as residential projects expand and road and utility networks are upgraded. Al-Ahram Developments identified this growth early and established its projects in the city's prime locations, offering clients a sound investment in the city's future.",
        "content4": "Sadat City's infrastructure has matured significantly over the past decade. The city now features a full grid of sealed internal roads, a reliable electricity network servicing industrial and residential areas alike, and extensive natural-gas coverage. Ongoing investments in water treatment and fiber-optic connectivity further signal the city's transition from a second-tier settlement to a fully self-sufficient urban hub.",
        "content5": "The service offering within Sadat City is broad and continues to expand. Residents have access to several private hospitals and specialist clinics, national and international retail chains, schools spanning all educational levels, and a growing number of private universities. This density of services dramatically reduces daily dependence on Cairo and underpins the strong rental demand from student and professional populations.",
        "content6": "For investors, Sadat City offers one of the most compelling risk-reward profiles in the Egyptian real estate market today. Land values and unit prices remain significantly below equivalent assets in Cairo or Alexandria, while rental yields are rising on the back of increasing demand from university students, factory workers, and young professionals. Al-Ahram Developments continues to acquire strategic plots in the city's highest-demand zones, passing this competitive advantage directly to buyers who choose to invest now."
      },
      "post3": {
        "title": "The Golden Zone in Sadat City: Your Complete Guide",
        "excerpt": "Everything you need to know about the Golden Zone — its location, services, and why it tops the list of Sadat City's best investment areas",
        "content1": "Zone 21 in Sadat City is popularly known as the 'Golden Zone' due to its prime central location and proximity to universities, hospitals, and commercial centers. Its streets are wide and well-planned, with an abundance of green spaces that raise the quality of life for residents.",
        "content2": "The Golden Zone hosts some of Sadat City's most prominent integrated housing projects and attracts a wide range of middle-class families and investors seeking solid rental yields. Demand for residential units remains consistently high, driven by the zone's proximity to higher education institutions and the technology district.",
        "content3": "Al-Ahram Developments has a strong presence in the Golden Zone with multiple projects serving different client segments. Whether you are looking to invest or to live in the heart of Sadat City, the Golden Zone is the right starting point.",
        "content4": "When selecting a unit in the Golden Zone for investment purposes, the most important criteria are floor level, proximity to university campuses, and access to main roads. Ground-floor commercial units near the universities consistently generate the highest rental returns, while upper-floor apartments with good natural light attract families relocating from Cairo or Alexandria. Studio and one-bedroom units sized between 60 and 80 square metres achieve the fastest occupancy, making them the preferred choice for yield-focused investors.",
        "content5": "The tenant profile in the Golden Zone is notably diverse. University students from Monufia, Giza, and Fayoum governorates form the dominant rental segment, occupying smaller units on academic-year contracts. Mid-level professionals employed in the technology zone and nearby industrial areas prefer larger two-bedroom apartments on longer leases. A smaller but growing segment of permanent residents — families who moved from Greater Cairo seeking lower costs and a quieter environment — seek units close to the zone's hospitals and international schools.",
        "content6": "Al-Ahram Developments applies deliberate site selection criteria within the Golden Zone, prioritising plots within walking distance of at least one university, one medical facility, and a primary service street. This positioning serves both resident convenience and investor returns simultaneously, since well-located units command higher rents and hold resale value more reliably than comparable units on peripheral streets. Buyers who choose Al-Ahram projects in this zone benefit from site-selection work that would otherwise require significant independent research."
      },
      "post4": {
        "title": "How to Choose the Right Real Estate Developer: 7 Non-Negotiable Criteria",
        "excerpt": "A practical guide to evaluating real estate developers before you buy and protecting your rights as a buyer in Egypt's market",
        "content1": "Choosing the right developer is as important as choosing the unit itself. The first criteria to verify: the developer's track record of delivering previous projects on time, the build quality of completed projects, and whether contracts are clear and free of ambiguous clauses.",
        "content2": "Also verify that the developer is licensed by official authorities such as the Ministry of Housing and the New Urban Communities Authority, and that land ownership is backed by a notarized title. Request to review building permits and land contracts before signing — never rely on verbal promises alone.",
        "content3": "Al-Ahram Developments has operated in Sadat City for years with a clear track record in delivery and quality. All our projects are licensed and registered with the relevant authorities, and our contracts are fully transparent to protect buyers. Ask, verify, then decide.",
        "content4": "Beyond licences and track record, scrutinise the developer's financial structure. A well-capitalised developer self-funds the early construction phases from equity before drawing on buyer instalments — this signals operational discipline and protects buyers from projects stalling due to cash-flow problems. Ask whether the developer has external financing arrangements and confirm that buyer payments are ring-fenced in a designated project account as required by regulations.",
        "content5": "Pay equal attention to the payment plan structure. A plan spread over three to seven years is generally sustainable; plans stretching to ten or fifteen years with extremely low instalments may indicate high land-acquisition debt rather than a genuine buyer benefit. Read every clause carefully, particularly those governing late-delivery penalties, contract termination rights, and unit modification procedures.",
        "content6": "Finally, visit completed projects before signing anything. Walk through existing buildings, speak to current residents, and assess real construction quality — finish levels, common-area maintenance, and build tolerances tell a far more honest story than any brochure. Al-Ahram Developments actively welcomes such visits to any of its completed communities in Sadat City, confident that the on-the-ground experience will speak for itself."
      },
      "post5": {
        "title": "Zone 14 in Sadat City: A Maturing Investment Opportunity",
        "excerpt": "Discover Zone 14's characteristics and why investors are eyeing it as a promising location with competitive pricing",
        "content1": "Zone 14 sits in the western part of Sadat City and has been seeing notable urban expansion in recent years. Its prices remain competitive relative to the Golden Zone, making it an attractive entry point for investors targeting above-average returns over the medium term.",
        "content2": "Zone 14 has solid basic services including government and private schools, health centers, and retail outlets. With ongoing infrastructure projects in the area, real estate experts anticipate meaningful price appreciation over the next three years as development accelerates.",
        "content3": "For the investor seeking a well-priced entry before prices rise, Zone 14 represents a genuine opportunity. Al-Ahram Developments closely monitors developments across all Sadat City zones and provides clients with investment guidance based on real market data.",
        "content4": "An emerging zone becomes a sound investment entry point when it already has essential services in place but has not yet reached the price levels of mature zones. Zone 14 meets this condition: government schools, clinics, and retail outlets are operational, yet prices remain roughly 20 to 30 percent below the Golden Zone average. The risk in emerging zones is that projected infrastructure may be delayed. The mitigating factor in Zone 14 is that road widening and utilities upgrades are already under active construction, reducing speculative risk considerably.",
        "content5": "Evaluating Zone 14 specifically requires examining road access from both the western ring road and the internal Sadat City arterial network. The zone currently has two functional access routes, with a third corridor under development expected to reduce commute times to the city centre by roughly 15 minutes upon completion. Service gaps still being filled include the absence of a private hospital within the zone and a limited retail offering compared to Zone 21. Both gaps are being addressed by private investors, and their resolution will be the primary catalyst for the anticipated price acceleration.",
        "content6": "Investment timing is perhaps the most consequential decision in an emerging zone. Buying before infrastructure completes captures the full appreciation, but requires patience — rental yields during the development phase tend to be modest. The optimal approach for Zone 14 today is to purchase a unit, secure it on a medium-term lease to a professional or family tenant, and hold through the infrastructure completion window, estimated at 24 to 36 months. Al-Ahram Developments tracks Zone 14 progress closely and can provide current data on which service gaps are closest to resolution, helping clients time their entry with greater precision."
      },
      "post6": {
        "title": "Off-Plan vs Ready Property in Sadat City: How to Choose",
        "excerpt": "A practical comparison of the advantages and risks of buying off-plan versus a move-in-ready unit in Sadat City",
        "content1": "An off-plan unit lets you enter at a lower price with extended payment plans — the ideal choice if you have time before you need to move in, or if your goal is capital appreciation. The trade-off is exposure to delivery delays or specification changes.",
        "content2": "A ready unit offers immediate occupancy and lets you verify construction quality and finishes directly before payment. It typically commands a higher price but eliminates delay risk. It is the better option if you need housing now or want to start earning rental income from day one.",
        "content3": "Al-Ahram Developments offers both options in Sadat City: under-construction projects with competitive prices and flexible payment plans, and move-in-ready units available immediately. Your decision depends on your financial position and goals — we are here to help you choose correctly.",
        "content4": "Risk tolerance is another dimension worth examining. Off-plan buyers assume construction risk — the possibility of delays, specification changes, or in rare cases, developer insolvency. Mitigating this risk requires thorough due diligence: verify the developer's track record, check that land is registered and permits are in order, and review the contract's delay penalty clauses. A developer with a history of on-time delivery in the same city is a materially different proposition from one entering a new market.",
        "content5": "Ready properties carry a different risk profile. What you see is largely what you get, but hidden maintenance issues — aging infrastructure, poor waterproofing, or substandard finishes under fresh paint — can surface after purchase. A professional inspection by a licensed engineer before signing is money well spent. Ask the developer for the original material specifications and compare them against what was delivered.",
        "content6": "Ultimately, neither option is universally superior. Off-plan suits buyers with a longer horizon, a tighter initial budget, and confidence in the developer's execution. Ready units suit buyers who need immediacy — whether to occupy or to generate rental income quickly. Al-Ahram Developments encourages every buyer to write down their specific timeline and cash-flow requirements before visiting any showroom, so that the decision is driven by their own situation rather than external pressure."
      },
      "post8": {
        "title": "Zone 21 in Sadat City: Your Living and Investment Guide",
        "excerpt": "An in-depth look at Zone 21 — its services, projects, and what sets it apart from other zones in Sadat City",
        "content1": "Zone 21, the Golden Zone, is the most mature residential core of Sadat City. It benefits from a complete road network and a dense service provision including government and private hospitals, international schools, universities, and multi-purpose commercial centers.",
        "content2": "Rental demand in Zone 21 is sustained by its proximity to private universities that attract students from Monufia, Giza, and Alexandria. This makes investing in the zone rewarding for those seeking steady rental income alongside long-term capital appreciation.",
        "content3": "Al-Ahram Developments owns leading projects within Zone 21 that meet the highest expectations. Whether you are looking to live or invest, we have the right solution in the Golden Zone's best locations.",
        "content4": "For permanent residents, Zone 21 offers a quality of daily life that is difficult to replicate elsewhere in Sadat City. Grocery chains, pharmacies, medical clinics, and specialty food outlets are within short driving or walking distance of most residential clusters. The presence of sports clubs, cafes, and cultural centres gives the zone a genuine community feel rather than the transient character common to student-dominated areas. Families report that safe streets, accessible schooling, and nearby healthcare collectively make Zone 21 their preferred long-term home, not merely a temporary residence.",
        "content5": "Within Zone 21 itself, the sub-areas closest to the private universities and the main commercial spine offer the highest rental yields but also the highest purchase prices. Buyers seeking better value should look at the northern residential clusters of the zone, where prices are 10 to 15 percent lower than on the central streets while still benefiting from the same service infrastructure. These peripheral sub-areas suit families who prioritise a quieter environment and investors who prefer lower entry costs and are willing to accept slightly longer tenant-search timelines.",
        "content6": "Al-Ahram Developments' competitive advantage in Zone 21 stems from long-standing site relationships and deep familiarity with the zone's micro-market dynamics. The company has observed which streets achieve the strongest resale velocity, which building orientations maximise natural light in the Egyptian climate, and which unit configurations attract the most reliable tenants. This accumulated knowledge shapes every project decision — from land acquisition to floor plan design — in ways that are difficult for newer entrants to replicate quickly. Buyers in Al-Ahram projects benefit from that institutional knowledge directly."
      },
      "post9": {
        "title": "Egypt Real Estate Mortgage Guide: How to Get the Best Terms",
        "excerpt": "Practical steps for securing the right property financing in Egypt, including bank requirements and the Social Housing Fund",
        "content1": "A mortgage lets you own your unit through monthly installments rather than a single lump sum. In Egypt, you can approach commercial banks or the Social Housing and Mortgage Finance Fund depending on your income level and the type of unit you are targeting.",
        "content2": "To improve your approval odds: ensure your documented monthly income is sufficient to cover the installment (typically no more than 40% of net income), confirm the unit is officially registered or registrable, and have your down payment ready — usually between 10% and 20% of the purchase price.",
        "content3": "Al-Ahram Developments works with a number of banks to streamline the financing process for our clients. We can help you estimate your purchasing power and guide you to the most suitable financing options available for our Sadat City projects.",
        "content4": "Beyond the headline interest rate, buyers should pay close attention to the total cost of borrowing over the loan's full term. A slightly higher rate over a shorter tenure often costs less in total interest than a lower rate stretched over twenty years. Use an amortisation schedule to model multiple scenarios before committing. Many buyers fixate on the monthly instalment figure and underestimate how much of early payments go toward interest rather than principal reduction.",
        "content5": "Documentation requirements vary between lenders but typically include proof of income for the last three to six months, a national ID, a utility bill confirming residence, and a copy of the purchase contract or reservation agreement. Self-employed buyers generally need audited financial statements or tax returns for the past two years. Organising this documentation before identifying a specific unit can meaningfully accelerate the approval timeline.",
        "content6": "One consideration that is frequently overlooked is the interaction between a bank mortgage and a developer payment plan. Some developers allow buyers to convert a developer-financed plan to a bank mortgage at a later stage — effectively letting buyers benefit from developer pricing while eventually accessing a lower long-term rate. Al-Ahram Developments can advise on whether this transition is available for specific units in our portfolio, and our sales team maintains updated relationships with lending partners to ensure buyers receive current, accurate information."
      },
      "post10": {
        "title": "Sadat City Technology Zone: The New Driver of Economic Growth",
        "excerpt": "How Sadat City's technology zone is boosting residential property demand and energizing the local economy",
        "content1": "Sadat City's technology zone was established to accommodate medium and high-tech industrial and technical companies, and is currently attracting major investment from electronics manufacturers, light industries, and logistics service providers. This industrial expansion is creating thousands of jobs for residents of the city and surrounding governorates.",
        "content2": "The direct impact on the residential real estate market is clear: rising demand for units from incoming workers, increasing population density that calls for more services and retail, and an integrated economic cycle that pushes up the value of surrounding residential properties.",
        "content3": "The smart investor tracks the relationship between industrial growth and residential demand. Al-Ahram Developments' projects are positioned to benefit directly from this growth, ensuring strong returns for you — whether from capital appreciation or rental yield.",
        "content4": "The technology zone currently hosts active operations across three main industry clusters: consumer electronics assembly and components manufacturing, light engineering and precision machinery, and third-party logistics and warehousing serving the Greater Cairo market. Several multinational-affiliated suppliers have established facilities here alongside domestic companies, creating a mixed employment base that draws skilled technicians and mid-level managers as well as general production workers. This diversity of employers stabilises local residential demand against volatility in any single sector.",
        "content5": "Wage levels in the technology zone vary by role but average meaningfully above the general industrial minimum. Skilled technicians and section supervisors typically earn between three and six thousand Egyptian pounds per month above baseline wages, providing genuine purchasing power in the local rental market. This employment quality sets a realistic ceiling for monthly rents in nearby residential areas — making one- and two-bedroom apartments the most competitive product — and confirms that demand is backed by actual income rather than speculative occupancy.",
        "content6": "Proximity to the technology zone is a positive rental driver, but the relationship between distance and residential desirability is not linear. Properties immediately adjacent to active industrial sites can face noise, heavy vehicle traffic, and air-quality concerns that reduce residential appeal. The optimal investment position is within a 10 to 15-minute commute of the zone — close enough for workers to value the convenience, far enough to avoid industrial externalities. Al-Ahram Developments applies this buffer principle when selecting land, ensuring buyers benefit from the zone's economic pull without absorbing its environmental costs."
      },
      "post11": {
        "title": "Sadat City Payment Plans Guide: How to Choose the Right One",
        "excerpt": "A comparison of available payment structures in Sadat City and tips for selecting the plan that fits your income",
        "content1": "Payment plans in Sadat City projects vary from an upfront payment with monthly installments, to semi-annual schedules, to zero-interest plans stretching up to 10 years. The right choice depends on your monthly cash flow and the stability of your income.",
        "content2": "A useful rule: keep the monthly installment at or below 30% of your net income to avoid unnecessary financial pressure. If your income is variable, semi-annual installments or graduated plans that increase over time may suit you better than a fixed monthly payment.",
        "content3": "Al-Ahram Developments offers flexible payment plans tailored to different financial situations. Our advisors are available to help you analyze your options and select a payment structure that gets you to your goal without straining your budget.",
        "content4": "One area buyers frequently underestimate is the impact of down-payment size on their long-term financial position. A larger down payment reduces monthly instalments and total interest if financing is involved, but it also locks up liquidity that could be deployed elsewhere. Striking the right balance requires understanding your full asset picture, not just your ability to meet the initial payment. A financial adviser can help stress-test your position against scenarios such as a job change or unexpected expense during the payment period.",
        "content5": "Contract language around delivery and handover deserves equal attention to the payment schedule itself. Verify that the contract specifies a hard delivery date — not just an expected date — and that financial consequences for developer delay are clearly defined. Equally, understand the consequences of your own payment default: grace periods, penalty rates, and the conditions under which the developer may cancel the contract and what refund you would receive.",
        "content6": "Comparing payment plans across developers in Sadat City should be done on a total-cost basis rather than by monthly instalment alone. A plan with a lower monthly figure but a higher total price due to extended interest loading may cost significantly more over time. Al-Ahram Developments provides buyers with a full payment schedule at the time of reservation — including the total contract value, all instalments, and any administrative fees — so that comparisons can be made on a like-for-like basis before any commitment is signed."
      },
      "post12": {
        "title": "The Distinguished District of Sadat City: Premium Quiet Living",
        "excerpt": "What sets the Distinguished District apart and why discerning buyers seeking an upscale residential environment choose it",
        "content1": "The Distinguished District in Sadat City is known for its relative tranquility, abundant green spaces, and lower population density compared to other neighborhoods. It houses residential clusters of villas and townhouses with high-quality architectural designs, making it the preferred choice for families seeking privacy and space.",
        "content2": "Although slightly removed from the city center, the district sits close to main roads and educational and healthcare services. Property prices here are relatively higher than the city average, but demand remains steady from upper-income buyers who prioritize lifestyle quality over proximity to commercial activity.",
        "content3": "If your priorities are quiet, privacy, and space over proximity to the commercial core, the Distinguished District is worth serious consideration. Contact Al-Ahram Developments to learn about projects in and around this sought-after neighborhood.",
        "content4": "From a pure investment perspective, the Distinguished District offers a different proposition than the Golden Zone. Per-square-metre values are higher, reflecting the larger plot sizes, lower density, and higher construction specifications typical of villas and townhouses. However, liquidity is slower: the buyer pool for high-value single-family units is narrower, and rental demand is shallower. Investors entering the Distinguished District should plan for a longer hold period and prioritise capital appreciation over short-term rental yield — a strategy that has historically delivered sound returns for patient investors in this and comparable segments.",
        "content5": "The typical buyer in the Distinguished District is a senior professional or business owner, often with an existing primary residence in Cairo, seeking a secondary or retirement home with space and privacy. Renters are relatively few but tend to be high-quality: executives on corporate relocation packages, senior engineers assigned to the technology or industrial zones, and occasionally foreign-affiliated technical staff. Lease terms for villa-style units tend to be longer and rental amounts higher, so the landlord's management burden per unit is lower than in the apartment market — an underappreciated operational advantage.",
        "content6": "Al-Ahram Developments has observed strong client interest in properties at the edges of the Distinguished District, where lower prices capture some of the neighbourhood's premium character without the full cost of villa ownership. The company continuously evaluates land opportunities in and around this district and advises prospective buyers accordingly. Clients interested in this segment are encouraged to consult our team early, as plots meeting the combined criteria of location, service access, and planning compliance are limited and tend to move quickly when they reach the market."
      },
      "post13": {
        "title": "Al-Ahram's Delivery Commitment: Numbers and Facts",
        "excerpt": "A look at Al-Ahram Developments' track record of delivering projects on time and the systems that make it possible",
        "content1": "On-time delivery is one of the most critical criteria for evaluating a real estate developer and ranks among the top concerns of buyers. Al-Ahram Developments treats this as a core priority and follows a disciplined methodology that includes detailed timeline planning and contingency reserves.",
        "content2": "The company relies on experienced contractors and reliable material suppliers to avoid supply-chain delays. Regular construction-progress reviews and periodic client updates build genuine trust and allow buyers to plan their move-in well in advance.",
        "content3": "If you are considering signing with a developer in Sadat City, ask for their completed project list and delivery record. Al-Ahram is proud of its record and welcomes any verification from clients before they commit to a purchase.",
        "content4": "Al-Ahram's delivery system begins long before the first brick is laid. Each project starts with a detailed construction schedule broken into quarterly milestones covering structural work, MEP installations, finishes, and landscaping. Progress against these milestones is tracked by the technical team on a biweekly basis — delays are caught early and resolved before they can compound.",
        "content5": "Client communication is a formal part of the delivery process, not an afterthought. Buyers receive regular construction updates with photographs and completion percentages for each phase of their unit. As the handover date approaches, clients are invited to a pre-delivery walkthrough to raise any punch-list items, which are fully addressed before the final handover certificate is issued.",
        "content6": "Timely delivery is not just a promise — it has a direct impact on property value. Units delivered on schedule in well-maintained communities consistently command higher resale prices and rental premiums than those in projects with prolonged delays. By investing in delivery discipline, Al-Ahram Developments protects the long-term value of every unit it sells and honours the trust its clients have placed in the company."
      },
      "post14": {
        "title": "Sadat City's Central Corridor: Its Impact on Surrounding Property Values",
        "excerpt": "How the new central road corridor is reshaping Sadat City's property map and elevating values in adjacent areas",
        "content1": "Sadat City's central road corridor is a major infrastructure project aimed at improving internal traffic flow and connecting residential and industrial zones more efficiently. From the moment its first phases were completed, measurable demand increases were observed for properties along its route.",
        "content2": "Historically, every major infrastructure project in Sadat City has raised property values in surrounding areas by between 15% and 35% within two to three years of opening. The central corridor is expected to produce a similar or greater effect given how many residential zones it passes through.",
        "content3": "Real estate appraisal experts consistently advise that investing in areas adjacent to large projects before completion yields the highest returns. Al-Ahram Developments holds units in zones that will benefit directly from this corridor — contact us to learn more.",
        "content4": "The central axis passes through or directly connects several of Sadat City's most strategically important districts. Its primary route links the main residential zones in the north and east — including Zone 21 and Zone 14 — with the industrial and technology districts in the south, while a secondary branch extends toward the city's commercial centre. The result is a road hierarchy that converts previously indirect cross-city journeys into direct timed routes, reducing internal commute durations that previously averaged 25 to 40 minutes to under 15 minutes on completed segments.",
        "content5": "The remaining phases of the central axis are progressing in stages, with engineering works currently active on the southern extension connecting the technology zone to the residential core. Completion of this final section is anticipated within 18 to 24 months based on current construction pace. For investors, this timeline has direct implications: properties along the southern extension route are today priced before full connectivity is reflected in valuations. Once the final section opens, the catch-up appreciation documented at 15 to 35 percent on completed segments is likely to be replicated in these currently underpriced areas.",
        "content6": "Evaluating any road-adjacent property requires balancing connectivity benefits against potential noise and traffic exposure. As a general principle, units set back at least 50 metres from the axis carriageway, separated by a service road or green buffer, capture most of the accessibility premium while experiencing materially less noise than frontage units. Al-Ahram Developments applies this setback standard consistently, selecting sites close enough to the axis for residents to benefit from reduced commute times, without placing residential buildings directly on the road edge where traffic noise diminishes living quality."
      },
      "post15": {
        "title": "Apartment or Villa in Sadat City? A Decision Guide",
        "excerpt": "An in-depth comparison of apartments and villas in Sadat City to help you choose based on your lifestyle and financial goals",
        "content1": "An apartment is a practical choice for small to medium families and for investors seeking higher liquidity and easier management. Maintenance costs are lower, renting is faster, and reselling is simpler. Prices in Sadat City range from 700,000 EGP to 2.5 million EGP depending on location and size.",
        "content2": "A villa provides more space, greater privacy, and a social prestige that apartments cannot match. It is the ideal choice for large families or those wanting a private outdoor area. Construction and maintenance costs are higher, but long-term capital appreciation on villas typically outperforms apartments.",
        "content3": "Al-Ahram Developments offers premium residential apartments and townhouse units in Sadat City. Your decision should stem from your family size, lifestyle, and investment goals. We are here to guide you to the best fit.",
        "content4": "Maintenance costs represent a recurring expense that is easy to overlook during the excitement of a purchase decision. Villas typically carry higher annual maintenance costs due to larger built-up areas, private gardens, and independent utility connections. Apartments in a managed compound benefit from shared maintenance costs spread across all unit owners, which makes ongoing expenses more predictable and, in most cases, lower on a per-square-metre basis. Factor these recurring costs into your total cost of ownership calculation.",
        "content5": "Resale liquidity is another differentiator. Apartments in established Sadat City zones generally sell faster than villas because the buyer pool is larger and price points are more accessible to a wider range of purchasers. Villas attract a narrower segment, which can mean longer time-to-sale in a soft market. If capital access on short notice is a concern for your investment strategy, this liquidity difference is worth weighing carefully.",
        "content6": "For buyers who are undecided, a duplex or townhouse configuration can offer a practical middle ground — more space and a degree of vertical separation similar to a villa, but within a managed compound setting that reduces individual maintenance burden. Al-Ahram Developments includes such hybrid typologies in select projects, and our team can walk you through the specific trade-offs for each configuration available in our zones, ensuring your decision is grounded in real numbers rather than general impressions."
      },
      "post16": {
        "title": "Sadat City's Industrial Zones: The Engine Behind Real Estate Growth",
        "excerpt": "A comprehensive look at Sadat City's industrial zones and their direct impact on the surrounding housing and services markets",
        "content1": "Sadat City is home to one of the largest industrial zones in Egypt, with over 1,500 industrial facilities across textiles, food processing, metals, plastics, and chemicals. This industrial diversity provides a solid economic base that shields the city from broader economic fluctuations.",
        "content2": "The link between industrial zones and residential real estate is direct: industrial workers need housing near their workplaces, which drives demand for small to medium units and keeps rental yields consistently high. This stable demand from this segment reduces vacancy risk for your investment.",
        "content3": "When selecting a unit for rental investment in Sadat City, consider its proximity to major industrial zones. Al-Ahram Developments offers projects in locations that benefit from this sustained demand, ensuring consistent returns for you.",
        "content4": "Beyond housing, the industrial zone also shapes the commercial fabric of surrounding neighbourhoods. Shops, repair workshops, logistics services, and food outlets that serve the working population cluster naturally near factory gates and worker accommodation areas. This organic commercial activity raises footfall and supports the viability of ground-floor retail units in nearby residential compounds.",
        "content5": "Sadat City's industrial base has also attracted a growing class of mid-level professionals — engineers, supervisors, and technicians — whose income profile supports demand for mid-range and upper-mid-range apartments rather than basic workers' accommodation. This segment is particularly attractive to investors because it commands higher rents with lower turnover than entry-level units.",
        "content6": "Al-Ahram Developments factors industrial proximity and worker demographics into its site selection analysis for every new project. Understanding who will rent a unit before committing to it is the foundation of a sound investment decision, and our team can walk you through the demand profile specific to each available project."
      },
      "post17": {
        "title": "The Textile Complex: Its Role in Shaping Sadat City's Real Estate Identity",
        "excerpt": "How the spinning and weaving complex built the local economy of Sadat City and its lasting impact on residential demand",
        "content1": "Sadat City's spinning and weaving complex is one of the largest textile industrial complexes in the Middle East and Africa, employing tens of thousands of workers and staff. This massive facility has formed a core part of the city's economic identity since its founding.",
        "content2": "The permanent presence of a large workforce tied to this complex has created stable residential demand in surrounding neighborhoods. Rental prices in these areas show relative resilience even during periods of general market slowdown, given the ongoing housing needs of the workforce.",
        "content3": "Planned expansions to the textile complex between 2026 and 2028 will increase capacity and attract additional workers, translating into greater housing demand. Al-Ahram Developments monitors these dynamics and positions its projects in the areas most likely to benefit.",
        "content4": "The commercial ecosystem that has grown around the textile complex is substantial and self-reinforcing. Within a two-kilometre radius of the main gates, there are concentrated clusters of canteens and food stalls serving shift workers, spare parts and maintenance supply businesses supporting the plant's operational needs, and a retail strip providing clothing, household goods, and banking services. This ecosystem itself generates additional employment and residential demand, creating layers of economic activity that extend well beyond the factory floor and sustain the surrounding residential market year-round.",
        "content5": "The workforce demographics of the textile complex are more varied than the sector's image might suggest. While production workers form the largest single group, the complex also employs mid-level professionals including production supervisors, quality control engineers, supply chain coordinators, and administrative staff. This professional tier earns salaries sufficient to afford decent two-bedroom apartments and has consistent expectations about housing quality — seeking proximity to the complex but also clean buildings with reliable utilities, characteristics that align closely with what established developers like Al-Ahram provide.",
        "content6": "Al-Ahram Developments incorporates textile complex proximity and workforce demographics as explicit factors when evaluating project locations. Industrial proximity is treated neither as a pure positive nor a pure negative, but as a variable managed through careful site selection. Projects are located close enough to benefit from worker housing demand while sitting beyond the immediate perimeter where noise and heavy vehicle traffic are concentrated. The result is a residential offering that attracts the professional and mid-management tier of the complex's workforce — tenants who pay reliably and maintain properties well, reducing operational friction for investors."
      },
      "post18": {
        "title": "Our Clients Speak: Real Experiences with Al-Ahram Developments",
        "excerpt": "Real success stories from Al-Ahram Developments clients in Sadat City — journeys from dream to key handover",
        "content1": "Behind every unit Al-Ahram Developments delivers is the story of a family that found its home or an investor who achieved a goal. Here we share examples of our clients' experiences that reflect our core values of transparency, quality, and commitment.",
        "content2": "One client describes how they visited the project site before signing and were impressed by the sales team's candor in providing accurate delivery timeline and specification information. Another tells of the rental return they achieved from their Golden Zone unit from the very first month after handover.",
        "content3": "At Al-Ahram Developments, we believe the best endorsement of our work is client satisfaction and word-of-mouth referrals to family and friends. More than 60% of our sales come through direct referrals — and that is the highest recognition we could ask for.",
        "content4": "One family relocating from Cairo shared that what surprised them most was not the quality of construction alone, but the genuine warmth of the neighbors they found. They described a community that welcomed them from the first week — neighbors who knocked on the door to introduce themselves, building management that responded promptly, and a sense of belonging they had not expected to find so quickly.",
        "content5": "For investors, the story is equally encouraging. Several unit owners in our Golden Zone projects report consistent rental occupancy from the first month after handover, with tenants who renew their contracts year after year. One investor in a two-bedroom unit has seen her rent increase by over 30% across three renewal cycles while the unit has never sat vacant for more than two weeks between tenants.",
        "content6": "We share these stories not to substitute for your own due diligence, but to illustrate the pattern that emerges when a developer keeps its commitments. When the handover matches the contract, when the quality matches the brochure, and when the after-sale team picks up the phone — trust is built one unit at a time. That is the experience Al-Ahram Developments strives to deliver to every client."
      },
      "post19": {
        "title": "Sadat City's Urban Master Plan: Design Vision and Development Future",
        "excerpt": "An overview of Sadat City's comprehensive master plan and how it governs the distribution of districts, services, and investments",
        "content1": "Sadat City was designed according to a comprehensive master plan that divides the city into clear functional zones: residential areas, industrial zones, a central commercial district, and service zones. This deliberate planning minimizes land-use conflicts and raises quality of life for residents.",
        "content2": "The master plan incorporates primary corridors connecting different districts and a hierarchical road network that moves from wide main streets down to internal secondary roads. It also designates locations for schools, hospitals, and parks to ensure equitable distribution of amenities.",
        "content3": "Understanding the master plan helps investors select the best zones based on surrounding services and future land use. Al-Ahram Developments positions its projects in areas that align with the optimal urban plan to protect long-term value.",
        "content4": "Reading the master plan as an investor requires focusing on three specific checks before committing to a purchase. First, confirm the zoning classification of the land: residential zones carry different value trajectories than commercial or mixed-use designations. Second, identify the proximity of the plot to designated green spaces, since planned green areas add a measurable and durable premium to adjacent properties. Third, review the road plan: proximity to a planned primary road adds value, while being directly within a future road corridor could create compulsory purchase risk. All three checks can be verified through Sadat City authority records.",
        "content5": "The master plan has undergone several amendments since the city's founding, the most significant of which expanded the technology zone eastward in 2019 and designated additional residential land in the northern districts to accommodate population growth. More recent discussions involve the planned addition of a secondary commercial centre in the western zones to serve residents who currently travel to the main commercial spine for basic services. Investors should review the current approved plan — not earlier versions — to ensure their analysis reflects actual approved land use rather than superseded designations.",
        "content6": "Al-Ahram Developments' site selection process explicitly cross-references the approved master plan at every stage of land evaluation. The company avoids sites that are misclassified, adjacently zoned for conflicting uses, or located in planning corridors where future rights-of-way could affect the development. Buyers who purchase units in Al-Ahram projects benefit from this due diligence indirectly, knowing the site has been verified against current master plan designations and carries no unresolved zoning conflicts — a material risk that self-directed investors frequently overlook."
      },
      "post20": {
        "title": "Sadat City's Green Belt: How It Elevates Quality of Life and Property Values",
        "excerpt": "The role of green spaces and public parks in increasing residential appeal and raising prices of adjacent properties",
        "content1": "Sadat City's green belt stretches across extensive land separating industrial and residential zones, providing a vital green lung for the city's residents. These spaces are not a luxury — they are a health and environmental necessity that improves air quality and reduces summer temperatures.",
        "content2": "Real estate market research consistently shows that properties overlooking or adjacent to green spaces command a price premium of 10% to 20% over comparable properties in areas without greenery. This premium grows as environmental awareness among buyers increases.",
        "content3": "Al-Ahram Developments' projects in Sadat City place particular emphasis on internal green spaces, dedicating a portion of each project to gardens and landscaped areas. We believe a green environment is not a design detail but a genuine quality-of-life foundation.",
        "content4": "For residents today, the most accessible green spaces include the central public park near Zone 21's main commercial spine, the landscaped boulevard running along the primary north-south road, and several neighbourhood-level planted areas distributed across the residential zones. A formal trail network is still developing, but existing green corridors are regularly used for morning and evening walks, family outings, and informal sport. This accessibility meaningfully differentiates Sadat City's residential environment from older, unplanned urban areas in the Delta and Greater Cairo.",
        "content5": "Maintenance responsibility for the green belt and public parks falls primarily to Sadat City's urban management authority, which oversees irrigation, replanting, and general upkeep. In practice, the condition of individual green spaces varies by zone, with areas in the more established residential districts receiving more consistent care. Al-Ahram Developments complements public green maintenance by professionally managing the internal landscaping of its own projects, ensuring residents experience green quality at both the project and neighbourhood levels rather than relying solely on public provision.",
        "content6": "Al-Ahram Developments communicates green space benefits to buyers through transparent project documentation rather than aspirational imagery alone. Site plans show the precise allocation of green area within each project, landscape specifications detail the species and coverage planned, and project walkthrough sessions allow buyers to see the scale of internal gardens before committing. For investors who understand that green-adjacent properties command a durable rental premium, these specifics matter: a documented 15 percent of total project land allocated to greenery is a verifiable asset, not a marketing claim."
      },
      "post21": {
        "title": "Sadat City vs New Administrative Capital: Where Should You Invest?",
        "excerpt": "An objective comparison between Sadat City and Egypt's New Administrative Capital on price, yield, location, and services",
        "content1": "The New Administrative Capital and Sadat City are both planned urban centers targeting real estate investors, yet they differ fundamentally in price levels and buyer profiles. The New Capital commands significantly higher prices, meaning a higher entry barrier and sometimes slower liquidity.",
        "content2": "Sadat City offers more competitive pricing and genuine rental demand backed by industrial and educational activity. The New Capital, by contrast, is an ambitious national project targeting higher-income segments and may require a longer investment horizon to realize projected returns.",
        "content3": "The choice depends on available capital and your investment time frame. For mid-budget investors seeking faster returns, Sadat City remains the more practical choice. Al-Ahram Developments delivers the best value for money in Sadat City.",
        "content4": "Liquidity — meaning how quickly you can find a buyer when you decide to exit — differs markedly between the two cities. Sadat City's stock of completed, occupied units means a realistic buyer pool exists today: workers, students, and families already living in the city generate genuine transaction volume. The New Administrative Capital's liquidity remains constrained by a thinner, wealthier buyer pool and the reality that many units are still off-plan or recently delivered into a market still forming its rental and resale patterns. For investors with a five-to-seven-year horizon this may be acceptable; for those needing flexibility within three years, it is a real constraint to price in.",
        "content5": "The risk profiles differ in structure, not just in magnitude. The New Capital's appeal depends heavily on the continued pace of government institution relocation and the sustained delivery of announced infrastructure — both of which remain outside the investor's control. Sadat City's investment case, by contrast, rests on an industrial base and university footprint that are already operational and have been generating housing demand for decades. That does not make Sadat City risk-free, but its economic anchors are functioning assets rather than planned commitments.",
        "content6": "The ideal buyer profile for each city reflects these differences clearly. The New Capital suits a high-capital, patient investor comfortable with concentration risk on a government mega-project and willing to wait for price discovery as the city matures. Sadat City suits the mid-budget investor or owner-occupier who wants predictable rental income, an established service environment, and the ability to exit within a reasonable time frame. Both cities have merit — the question is which profile matches your capital position and your expectations."
      },
      "post22": {
        "title": "Sustainable Building Practices at Al-Ahram Developments",
        "excerpt": "How Al-Ahram Developments integrates sustainability principles into its projects to deliver more efficient and healthier homes",
        "content1": "Al-Ahram Developments has adopted a range of sustainable building practices in its recent projects aimed at reducing energy consumption and improving resident health. These include orienting buildings to maximize natural ventilation and using advanced thermal insulation in roofs and exterior walls.",
        "content2": "On the materials side, the company uses trusted, low-emission construction materials and double-glazed windows to reduce the load on air conditioning systems. These choices deliver savings of 15% to 25% on monthly electricity bills for residents.",
        "content3": "Sustainability in construction is not only environmental responsibility — it is genuine added value for the buyer. Al-Ahram Developments believes this and reflects it in every design and construction decision, because your home should be comfortable and affordable to run day to day.",
        "content4": "Water conservation is another dimension of sustainability the company incorporates through low-flow fixtures in bathrooms and kitchens and drought-tolerant landscaping in shared gardens. These measures reduce building water consumption meaningfully while maintaining the quality of life residents expect from a premium development.",
        "content5": "Indoor air quality — often overlooked in the Egyptian market — is addressed through careful material selection and cross-ventilation design. Units that breathe well and stay cooler naturally require less mechanical cooling, which has a direct positive impact on monthly electricity costs and on the long-term health of residents.",
        "content6": "Al-Ahram Developments intends to formalize its sustainability commitments through green building certification in upcoming projects. This will provide clients with independent third-party verification that their unit meets internationally recognized environmental standards — adding both credibility and long-term resale value to their investment."
      },
      "post23": {
        "title": "Sadat City vs 6th of October City: Where Should You Invest?",
        "excerpt": "A comprehensive comparison between two leading cities in Greater Cairo's western corridor on prices, services, and returns",
        "content1": "6th of October City and Sadat City both lie west of Cairo, but they carry a meaningful price gap. October is geographically closer to Cairo with a heavier service footprint, which is reflected in prices that average 40% to 60% higher.",
        "content2": "Sadat City compensates for its relative distance with more competitive property prices and rental yields that are higher relative to purchase price. A developer seeking the highest return on capital will find Sadat City a substantially better environment than October for the same budget.",
        "content3": "For a resident seeking to reduce living costs while maintaining an acceptable quality of life, Sadat City strikes this balance distinctly well. Al-Ahram Developments offers projects in Sadat City designed precisely to meet that expectation.",
        "content4": "For Cairo commuters, the distance reality is worth examining honestly. 6th of October City sits roughly 30 to 40 kilometers from central Cairo and can be reached in 40 to 60 minutes under normal traffic. Sadat City is approximately 90 kilometers from Cairo and realistically requires 90 minutes to two hours depending on departure time. This means a resident working daily in Cairo would face a materially longer and more costly commute from Sadat City. However, most Sadat City residents work locally — in the industrial zones, universities, or the city's growing service sector — which renders the Cairo distance largely irrelevant to their daily life.",
        "content5": "At the street level, 6th of October City has a denser and more mature service ecosystem. Large-format retail, established hospital chains, private schools with international curricula, and a wider restaurant and entertainment offering are more readily available than in Sadat City. Sadat City covers daily essentials well — groceries, pharmacies, clinics, schools, and basic retail — but residents seeking specialty services or entertainment regularly travel to October or Cairo. This gap is narrowing as Sadat City's population and commercial base grow, but it is an honest consideration for families accustomed to a high service density.",
        "content6": "Investor profiles that benefit from each city differ accordingly. October suits the investor with higher available capital who targets a tenant pool of Cairo professionals, corporate families, or high-income Egyptian or expatriate renters. The yields are lower relative to purchase price but the tenant quality and unit demand is generally stable and well-established. Sadat City suits the yield-focused investor who allocates a smaller capital base and targets workers, students, and middle-income families as tenants — achieving a higher percentage return on invested capital even if the absolute rent figure is lower."
      },
      "post24": {
        "title": "How to Choose the Perfect Apartment Size for Your Family: A Practical Guide",
        "excerpt": "Practical criteria for selecting the right apartment size based on your family's composition and lifestyle in Sadat City",
        "content1": "The right apartment size is not the largest possible — it is the size that covers your actual needs without wasting money on space you do not use. For a family of three, a 100–120 sqm apartment provides two comfortable bedrooms, a living area, and a dining space.",
        "content2": "For a family of four to five, target 140–160 sqm to accommodate three bedrooms, a living room, a dining area, and a proper kitchen. If you have school-age children who need separate study spaces, add at least 20 sqm to your target.",
        "content3": "Al-Ahram Developments offers a range of unit sizes in its Sadat City projects starting from 110 sqm up to 190 sqm. Visit our site or contact our advisors to explore the options available within your budget.",
        "content4": "Future-proofing your size decision matters as much as present needs. A couple planning to start a family in the next two to three years should build that extra bedroom into their selection now rather than face a move later. Similarly, families anticipating an elderly parent joining the household benefit from an additional room that serves as a guest room until it is needed full-time.",
        "content5": "Do not underestimate storage and circulation space when comparing units. Two apartments can have identical stated areas yet feel very different in practice if one allocates 15 sqm to hallways and storage while the other converts that space into usable rooms. Always walk through the actual layout — not just the total area number — before making your decision.",
        "content6": "Financing considerations also affect the practical size you can purchase comfortably. A larger unit with a stretched monthly installment that strains your budget is worse than a right-sized unit with manageable payments. Al-Ahram Developments advisors can help you model different size and payment scenarios so you choose a unit you can comfortably live in and pay for."
      },
      "post25": {
        "title": "The Cairo–Alexandria Desert Road Advantage: Why Location Changes Everything",
        "excerpt": "How the Cairo–Alexandria Desert Road gives Sadat City a unique competitive advantage on Egypt's real estate map",
        "content1": "The Cairo–Alexandria Desert Road is the main artery connecting Egypt's two largest cities, and Sadat City sits directly on this road. This location grants the city exceptional accessibility: 90 minutes from central Cairo and 60 minutes from Alexandria under normal traffic conditions.",
        "content2": "This geographic centrality has attracted major factories and logistics warehouses that prefer a presence on this vital corridor, reinforcing the city's employment base and boosting housing demand. It also allows Sadat City residents to move comfortably between Cairo and Alexandria in a way that inland cities simply cannot match.",
        "content3": "When evaluating any real estate investment, always ask: what is the accessibility? Sadat City answers that question with confidence. Al-Ahram Developments believes location is an irreplaceable foundation — which is why it chose Sadat City as the home for its projects.",
        "content4": "The industrial corridor along the Cairo–Alexandria Desert Road near Sadat City is one of the most significant in Egypt's manufacturing geography. Food and beverage production, textile manufacturing, pharmaceuticals, chemicals, and building materials are all represented among the factories operating on or near this corridor. Several of these facilities employ thousands of workers, many of whom rent or purchase housing in Sadat City's residential zones. This direct link between factory employment and residential demand is a fundamental and durable driver that does not depend on sentiment or speculation.",
        "content5": "Road quality and traffic management on the Cairo–Alexandria Desert Road have improved meaningfully over the past five years. Lane additions, improved lighting, and roadside emergency services on key segments have reduced travel times and improved safety. Separately, internal road development within Sadat City itself — including the widening of the main commercial and residential arteries — has made in-city mobility considerably more comfortable than it was five years ago. These improvements compound: better internal roads increase the value of previously peripheral plots, and a better inter-city road increases the effective catchment area from which employers and residents can draw.",
        "content6": "The logistics and industrial expansion along this corridor is not standing still. Announced and ongoing projects include new industrial zones on land adjacent to or near the existing Sadat City industrial area, expanded cold-storage and distribution facilities serving Alexandria's port trade, and private warehousing parks targeting e-commerce operators. Each of these additions brings more employment and more housing demand. Investors who understand this pipeline recognize that Sadat City's residential market is not simply riding population growth — it is being pulled forward by an expanding employment base with a track record that spans four decades."
      },
      "post26": {
        "title": "Residential Compounds in Sadat City: Your Complete Guide",
        "excerpt": "A comprehensive look at the gated compound model in Sadat City and its advantages compared to open residential communities",
        "content1": "A gated residential compound is characterized by full security and shared amenities such as gardens, swimming pools, and sports clubs, and provides residents with a socially cohesive community. This model is seeing increasing demand in Sadat City, particularly among young families.",
        "content2": "Compound costs are higher than standard communities due to monthly service fees covering security, cleaning, and facilities maintenance. However, rental demand is also higher, which compensates for the price differential through premium rental yields.",
        "content3": "Al-Ahram Developments offers compound projects in Sadat City that combine security, integrated amenities, and competitive pricing. If the compound lifestyle fits your living preferences or investment strategy, we have what meets your expectations.",
        "content4": "Before signing a compound contract, three areas warrant specific verification beyond the unit itself. First, obtain the service fee schedule in writing and understand exactly what it covers — security, cleaning, landscaping, pool maintenance, and management fees should be itemized separately so you understand what you are committing to monthly before occupancy. Second, research the management company's track record: a compound managed by an experienced operator with references from other projects is a fundamentally different investment to one where post-delivery management has not been contractually committed. Third, verify which promised amenities are already built and operational versus those planned for a later phase — facilities that are not yet built carry delivery risk.",
        "content5": "The tenant demographic that actively seeks compound living in Sadat City is relatively well-defined. Corporate employees and senior managers assigned to the industrial zone who prefer to keep their families in a secure, serviced environment represent a significant portion. University faculty and senior medical staff at local hospitals are another consistent segment. Young dual-income couples who prioritize security and shared amenities over unit size round out the demand picture. This tenant profile is typically more stable, longer-term, and financially reliable than the general rental population, which has a direct positive effect on the landlord's cash flow experience.",
        "content6": "Compound properties in Sadat City consistently demonstrate stronger resale liquidity than equivalent units in open residential buildings. The structured management, maintained common areas, and security record create an objective quality signal that speeds up buyer decision-making in a resale transaction. That said, compound liquidity still depends on the development's reputation: a compound with well-maintained facilities and no service fee disputes is considerably easier to sell than one with an unhappy residents' association and deteriorating common areas. The condition of the compound at the time of resale matters as much as its original specifications."
      },
      "post27": {
        "title": "How to Calculate Return on Investment for Sadat City Properties",
        "excerpt": "A step-by-step guide to calculating rental yield and capital return for your property in Sadat City",
        "content1": "Real estate ROI is measured by two key metrics: annual rental yield (net annual rent ÷ purchase price × 100) and capital return (the percentage appreciation in property value over the holding period). In Sadat City, net rental yield averages between 6% and 9% annually.",
        "content2": "To calculate rental yield accurately, subtract from the annual rent: annual maintenance fees, property taxes, and management costs if applicable. The result is your net rental income. Divide that by the purchase price to get your net yield percentage.",
        "content3": "In Sadat City, the combination of relatively high rental yield and long-term capital appreciation makes it an attractive market for investors. Al-Ahram Developments provides you with a detailed expected-return analysis for any unit you are considering purchasing.",
        "content4": "Capital appreciation in Sadat City has historically averaged 15% to 25% annually over the past three years, driven by rising construction costs and sustained demand from families relocating from Cairo. To calculate your total return over a five-year hold, combine the cumulative rental yield with the projected price appreciation — together they form your full investment picture.",
        "content5": "Do not overlook taxes and holding costs when building your ROI model. Egypt levies an annual real estate tax based on rental value, and professional property management — if you are not managing the unit yourself — typically costs 8% to 10% of collected rent. Factor both into your net yield calculation to avoid an overly optimistic projection.",
        "content6": "Al-Ahram Developments provides prospective buyers with a standardized return analysis sheet that models net rental yield, projected capital appreciation, and total five-year return for any available unit. Request it from our advisors as part of your decision-making process — informed investors make better investments and become long-term partners."
      },
      "post28": {
        "title": "Al-Ahram Developments: Ten Years of Building in Sadat City",
        "excerpt": "The journey of Al-Ahram Developments in Sadat City over ten years of projects, deliveries, and sustained growth",
        "content1": "Since its first projects in Sadat City, Al-Ahram Developments has maintained a trajectory of continuous growth built on the foundations of trust, quality, and commitment. Over the past decade, the company has delivered hundreds of residential units to families who found their dreams and investments realized.",
        "content2": "Over those years, the company refined its planning and execution methodology and broadened its partnerships with contractors and suppliers that guarantee the highest quality standards. It also expanded its portfolio to include projects in Sadat City's best zones to meet growing demand.",
        "content3": "Ten years of experience in Sadat City's market have given Al-Ahram Developments a deep understanding of residents' and investors' needs. That understanding is reflected in every new project we launch, each one better than its predecessor.",
        "content4": "Those ten years have produced concrete milestones that mark the company's growth: the first completed building in the Golden Zone, the first project with a dedicated residents' service app, and the first compound development to include a fully equipped sports area. Each milestone reflected not just ambition but a response to what clients told us they needed.",
        "content5": "Behind the numbers is a community impact that the company measures with pride. Hundreds of families in Sadat City now call an Al-Ahram Developments unit their home. Children grew up in these buildings. Young couples started families. Retirees found the quiet, clean environment they had long sought. That human dimension is what makes the decade's work meaningful.",
        "content6": "Looking to the next decade, Al-Ahram Developments is committed to expanding its footprint in Sadat City with projects that integrate smarter design, greener materials, and broader amenity packages. The company's pipeline includes projects in emerging zones that will benefit from infrastructure investments currently under construction — ensuring clients who invest today are positioned for the appreciation that follows."
      },
      "post29": {
        "title": "Shopping Centers and Commercial Areas in Sadat City: A Complete Guide",
        "excerpt": "An overview of Sadat City's main shopping centers and commercial districts and their impact on adjacent property appeal",
        "content1": "Sadat City hosts a range of shopping centers and commercial markets distributed across its various zones, providing residents with daily needs from groceries and clothing to electronics and restaurants. This commercial infrastructure has significantly increased the city's appeal for permanent residence.",
        "content2": "The presence of well-developed commercial centers near residential areas measurably raises the value of surrounding properties. Today's buyer no longer accepts living far from commercial services, so projects near active commercial areas command higher demand and better prices.",
        "content3": "Al-Ahram Developments' projects in Sadat City are positioned to ensure adequate proximity to commercial centers and daily services. We believe resident comfort starts with nearby services, and we reflect that conviction in every project site selection decision.",
        "content4": "Sadat City's commercial landscape is organized around several distinct centers. The main commercial axis in the Golden Zone hosts multi-level shopping facilities with hypermarket anchors, clothing chains, electronics retailers, and food courts. Separate commercial districts in the industrial zone service zones host wholesale and trade-oriented retail suited to the large worker and factory population. Each residential zone also has its own neighborhood-level markets covering daily groceries, bakeries, butchers, and basic personal services. This layered commercial geography means residents rarely need to travel more than ten minutes for everyday needs, while larger shopping trips draw them to the central commercial clusters.",
        "content5": "Commercial density has a measurable and zone-specific effect on rental demand within Sadat City. Units within walking distance of an active commercial street command rental premiums of 10% to 15% over comparable units in quieter areas, and they tend to see shorter vacancy periods between tenants. In zones where commercial infrastructure is still developing, rental yields may be higher as a percentage — reflecting lower purchase prices — but vacancy risk is also higher because the service environment that anchors resident demand is still forming. Investors should assess not just today's commercial density but the trajectory: a zone with planned commercial expansion is often the better buy, provided the planned development is underway rather than merely announced.",
        "content6": "The commercial development pipeline in Sadat City is active and visible. Retail strips anchoring new residential clusters are under construction in the expanding eastern and northern zones, and several mixed-use projects combining ground-floor retail with upper-floor residential are advancing. New food and beverage operators, medical centers, and educational services are following residential growth into these newer zones, creating a replicating pattern: housing draws services, which draws more residents, which creates more demand for services and housing alike. For the property investor, tracking where this cycle is just beginning — rather than where it has already completed — is where the highest forward returns typically exist."
      },
      "post30": {
        "title": "Investing in Commercial Units in Sadat City: The Investor's Guide",
        "excerpt": "Why commercial units in Sadat City are a standout investment opportunity and what to consider before buying",
        "content1": "Commercial units typically generate significantly higher rental returns than residential units and benefit from longer lease terms and better financial standing among commercial tenants. In Sadat City, commercial unit rental yields range between 8% and 14% annually.",
        "content2": "The decisive criteria for a successful commercial unit: location (pedestrian and vehicle traffic), size and frontage, and the nature of surrounding activity. A unit on an active commercial street within a dense residential neighborhood far outperforms a larger unit in a less dynamic location.",
        "content3": "Al-Ahram Developments incorporates commercial units in select Sadat City projects designed for maximum operational potential. Contact us to learn about available options and to analyze expected returns from commercial investment in the Golden Zone.",
        "content4": "The tenant mix in Sadat City's commercial corridors has diversified considerably in recent years. Pharmacies, private medical clinics, tutoring centers, food and beverage outlets, and professional services offices now occupy units that previously hosted only traditional retail. This diversification means more potential tenant types for your unit and lower risk of prolonged vacancy when one sector softens.",
        "content5": "When negotiating commercial leases, understand that longer lease terms with annual escalation clauses protect both parties. A three-year lease with a 15% annual rent escalation provides tenant stability while ensuring your income keeps pace with inflation. Al-Ahram Developments can connect commercial unit buyers with experienced property managers who negotiate these agreements on a daily basis.",
        "content6": "Due diligence before buying a commercial unit goes beyond checking the lease yield. Verify the unit's permitted uses under local zoning, confirm that electricity capacity (in amperes) supports the intended business type, and review what other tenants are already in the building. A well-chosen commercial unit in a mixed-use development is among the highest-yielding real estate assets available to Egyptian investors today."
      },
      "post31": {
        "title": "Sports Clubs and Leisure in Sadat City: A Guide to Active Living",
        "excerpt": "An overview of the top sports clubs and leisure facilities in Sadat City and how they elevate quality of life for residents",
        "content1": "Quality of life in any city is incomplete without an integrated recreational and sports infrastructure, and Sadat City understands this well. The city hosts several sports clubs offering football pitches, tennis courts, swimming pools, and fitness centers, along with jogging and walking tracks in its upscale neighborhoods.",
        "content2": "The importance of these facilities goes beyond physical health — they extend to building social cohesion among residents and providing children with a safe environment to grow. A family that has a sports club nearby reduces commute time and increases quality time with their children.",
        "content3": "When choosing your unit in Sadat City, check the project's proximity to sports clubs and leisure facilities. Al-Ahram Developments' Golden Zone projects are close to the city's most prominent amenities, giving residents an active, well-rounded lifestyle.",
        "content4": "Sports clubs in Sadat City operate under different access models depending on their ownership and management. Some are developer-managed facilities integrated within residential compounds, available exclusively to compound residents as part of their service fee package. Others operate as independent membership-based clubs open to residents across the city on annual or monthly subscription terms, with fees that vary by age category and membership type. A smaller number of public or semi-public facilities with subsidized access also exist, typically operated by local government or union bodies. Understanding which model applies to a given club — and what the realistic annual cost is for your household — is important information before selecting a residential project based partly on sports facility proximity.",
        "content5": "The presence of a sports club within or directly adjacent to a residential project has a measurable positive effect on rental pricing in Sadat City. Units that can legitimately market the club as an included or immediately accessible amenity typically achieve rental premiums of 8% to 12% over comparable units in projects without this feature. This premium reflects real tenant preference: families with children, health-conscious professionals, and retirees in particular view sports and recreation access as a quality-of-life criterion that directly influences their willingness to pay and their tenure length. A longer average tenancy is itself financially valuable to the landlord, as it reduces turnover costs and vacancy risk.",
        "content6": "Beyond the formal sports club model, Sadat City offers outdoor leisure options that have improved alongside the city's residential development. Dedicated jogging and walking tracks are present in the Golden Zone and several upscale neighborhoods. Landscaped promenades and open green corridors — planned in Sadat City's master plan from its early design — provide spaces for casual outdoor activity. Children's play areas and small neighborhood parks are distributed through residential zones with varying quality. For families and buyers evaluating lifestyle, the combination of formal sports facilities and accessible outdoor space is a genuine differentiator that distinguishes the Golden Zone and similar upscale areas from more basic residential districts within the city."
      },
      "post32": {
        "title": "Universities in Sadat City: An Educational Ecosystem That Supports Real Estate Investment",
        "excerpt": "How Sadat City's public and private universities drive rental demand and reinforce property value in surrounding areas",
        "content1": "Sadat City hosts a number of public and private universities that attract thousands of students from various governorates annually. This consistent student population creates stable, self-renewing demand for small to medium residential units in surrounding neighborhoods.",
        "content2": "Investing in apartments near Sadat City's universities delivers relatively high rental yields and low vacancy rates, as incoming students renew demand at the start of every academic year. This investment type suits the investor seeking regular rental income with minimal vacancy risk.",
        "content3": "Al-Ahram Developments holds projects in areas that benefit from proximity to this educational corridor. If consistent rental income is your primary goal, Sadat City's university belt is the answer.",
        "content4": "The universities concentrated in Sadat City are particularly strong in applied and technical fields. Engineering faculties — covering civil, mechanical, electrical, and computer engineering — draw large enrollment numbers. Veterinary medicine and agricultural sciences are also prominent, reflecting the city's proximity to the Delta agricultural heartland. Scientific and natural science programs round out the academic offering. This applied-field concentration means graduates tend to find employment directly in the region's industrial base, creating a pathway from student renter to employed resident that supports sustained housing demand beyond the purely academic cycle.",
        "content5": "The academic calendar creates a predictable seasonal rental pattern that investors should understand and plan for. Demand for units near universities peaks sharply in September and October as the academic year opens, and again in February for universities with a second-semester intake. Vacancy risk is highest in July and August when many students return to their home governorates for the summer. Investors who offer furnished units with short-term summer rental options or who target academic-year contracts rather than calendar-year leases can manage this seasonality effectively. Some landlords near the university belt report near-zero vacancy by managing the calendar of lease renewals proactively rather than reactively.",
        "content6": "Student tenants have specific unit requirements that differentiate what rents well near universities from what does not. Proximity to campus — ideally within walking distance or a short minibus ride — is the primary selection criterion for most students. Fast and reliable internet is now effectively a non-negotiable: inadequate connectivity disqualifies a unit for most student tenants regardless of other qualities. Security matters significantly, particularly for families placing daughters in student housing. Units with secure building access, good lighting in common areas, and a responsive building management presence are consistently preferred. Furnishing level also matters: basic, durable furniture provided by the landlord is often preferred over an unfurnished unit by students who arrive with minimal possessions."
      },
      "post33": {
        "title": "Construction Phases in Egyptian Residential Projects: From Groundbreaking to Handover",
        "excerpt": "A step-by-step guide explaining the construction stages of a residential building in Egypt to help buyers track their project's progress",
        "content1": "A residential building passes through six main phases from start to handover: excavation and foundation works, the reinforced concrete structure, brick and block walls, mechanical and electrical rough-in (electricity, plumbing, HVAC), interior finishes, and finally external and common area works.",
        "content2": "Each phase has a typical duration depending on the building's size and number of floors. The concrete structure of a six-story building typically takes 4–6 months, while finishing works take 3–5 months. Total duration from excavation to handover usually ranges from 18 to 30 months.",
        "content3": "Understanding these phases lets you track your project's progress with awareness and verify that development is on schedule. Al-Ahram Developments keeps clients informed with periodic construction-phase updates, and any buyer may visit the site for an on-ground check.",
        "content4": "During site visits, know what to look for at each stage. In the structural phase, look for uniform concrete column sizes and properly spaced reinforcement bars — inconsistencies here are expensive to fix later. During the finishing phase, check door and window alignment, tile grout consistency, and the quality of electrical outlet installation. Asking specific technical questions signals to the developer that you are an informed buyer.",
        "content5": "Red flags that should prompt a direct conversation with the developer include: construction that pauses for more than three weeks without explanation, changes to listed specifications without written amendment to the contract, and reluctance to grant buyer site visits. None of these automatically signal fraud, but each warrants a clear written response from the developer before you allow the project to continue without documented answers.",
        "content6": "Al-Ahram Developments applies a multi-stage quality control protocol at each construction phase: independent engineer sign-off at foundation completion, a concrete mix testing requirement at structural stage, and a client-accompanied pre-handover inspection at finishing completion. This layered oversight ensures that what is handed over matches what was contracted — and gives buyers confidence rooted in process, not just trust."
      },
      "post34": {
        "title": "After-Sale Service at Al-Ahram Developments: Because Our Relationship Doesn't End at Handover",
        "excerpt": "An overview of the after-sale service system Al-Ahram Developments provides to clients after they receive their units",
        "content1": "Handing over the key to a unit is not the end of the relationship between developer and client — it is the start of a new phase. Al-Ahram Developments recognizes this and provides an after-sale service system that includes a one-year structural warranty, shared facilities maintenance, and a support team to follow up on any observations.",
        "content2": "The company maintains a direct post-handover communication channel with clients to monitor unit conditions and resolve any issues that arise during the initial operating period. Transparency in handling feedback and speed of response are the two pillars of this service.",
        "content3": "At Al-Ahram Developments, we believe a satisfied buyer is our best ambassador. That is why we invest in after-sale service quality with the same seriousness we apply to construction quality — both reflect our genuine commitment to our clients.",
        "content4": "The warranty process is simple and documented. When a client identifies a concern after handover, they submit it through a dedicated channel and receive an acknowledgment within 48 hours. A technical representative visits within one week to assess, and repair work is scheduled and completed within the warranty window. Every case is logged, tracked, and closed with client sign-off — nothing falls through the cracks.",
        "content5": "The most common post-handover concerns in Egyptian residential buildings relate to plumbing, paint, and finishing details — all of which are covered under our structural and finishing warranty. We handle these proactively rather than reactively. Clients often tell us that their experience of the resolution process builds more trust than the original purchase, because it is when a developer truly shows what they are made of.",
        "content6": "For long-term maintenance planning, Al-Ahram Developments provides new owners with a building maintenance calendar that outlines recommended service intervals for water heaters, electrical panels, plumbing fixtures, and shared area equipment. This proactive guidance reduces unexpected repair costs and helps owners preserve the condition and value of their units over the years."
      },
      "post35": {
        "title": "Private Universities in Sadat City: A Guide for Parents and Investors",
        "excerpt": "A look at Sadat City's prominent private universities and how they are a decisive factor in housing and investment decisions",
        "content1": "Sadat City is home to a number of private universities with growing academic reputations in engineering, business, veterinary medicine, and the sciences. These universities attract thousands of students annually from Monufia, Giza, Alexandria, and Cairo.",
        "content2": "For a family with children approaching university age, living in Sadat City is a smart decision that eliminates rental and daily commute costs. For the investor, proximity to private universities means sustainable rental demand that renews at the start of every academic year.",
        "content3": "Al-Ahram Developments understands this equation and offers units in areas close to this university belt. Contact us to find out which projects are nearest to the private universities in the Golden Zone.",
        "content4": "Private university tuition in Sadat City ranges considerably by institution and faculty, but the general range for Egyptian students runs from approximately 35,000 to 120,000 Egyptian pounds annually depending on the specialization and the university's positioning. This tuition level implies that private university students in Sadat City typically come from middle to upper-middle income families — not wealthy enough to place their children in Cairo's most premium institutions, but with enough income to afford private education outside the capital. For the property investor, this means the tenant pool near private universities has a meaningful ability to pay reasonable rents consistently, which reduces the practical default and vacancy risk relative to student populations in more economically mixed areas.",
        "content5": "Enrollment at Sadat City's private universities has been growing and that trend is expected to continue. Egypt's young population and the broadening social acceptance of private higher education as an alternative to crowded public universities both support sustained enrollment growth. This is relevant to property investors because rental demand near these universities is a derived demand: it grows with enrollment, and enrollment has a demographic foundation that is structurally favorable for the next decade. An investor entering this market now is buying into a rental demand trend with meaningful forward momentum, not a market already at its peak.",
        "content6": "The unit types most in demand near Sadat City's private universities follow a clear pattern. Single-bedroom and studio units of 55 to 75 square meters suit individual students or student pairs and represent the deepest pool of rental demand in terms of transaction volume. Two-bedroom units of 80 to 100 square meters serve small student groups or students sharing to reduce costs, and also appeal to junior faculty and university support staff. Furnished units consistently outperform unfurnished ones in this submarket — the turnover associated with annual tenant cycles makes maintained furnishing a strong differentiator. Proximity to the university within five minutes by foot or ten minutes by local transport is the primary location criterion that overrides almost all other unit characteristics."
      },
      "post36": {
        "title": "Real Estate Contract Due Diligence in Egypt: Your Rights and Responsibilities",
        "excerpt": "A simplified legal guide to understanding property purchase contracts in Egypt and the key clauses that must be verified before signing",
        "content1": "A property purchase contract is the legal document that protects your rights as a buyer. Before signing, confirm these essential clauses are present: an accurate unit description with area, location, and floor; the total sale price and detailed payment schedule; the delivery date with a delay penalty clause; and finish specifications.",
        "content2": "Also verify: the developer's credentials and license, that the land is officially registered and free of disputes or mortgages, and that the building is properly permitted by the relevant authority. Any ambiguity on these points must be clarified before signing — never treat it as a minor detail.",
        "content3": "Al-Ahram Developments provides clear, detailed contracts that fully protect buyer rights. We recommend every client engage a lawyer to review any contract before signing — the time invested in review prevents many problems down the line.",
        "content4": "Pay particular attention to the payment schedule and what happens if you miss an installment. Reputable contracts include a defined cure period — typically 30 to 60 days — before any penalty or cancellation clause is triggered. Contracts that allow the developer to cancel and retain all payments without notice after a single missed payment are a serious red flag that warrants negotiation or withdrawal.",
        "content5": "Penalty and force majeure clauses deserve equal scrutiny. A delay penalty clause that caps compensation at a negligible daily amount effectively provides no real protection for the buyer. Equally, a force majeure clause with an unlimited scope can excuse a developer from almost any delivery failure. Seek clauses that are specific, time-bounded, and balanced — a good contract protects both parties, not just one.",
        "content6": "Once signed, prioritize registering the contract and ultimately the title deed through the official Real Estate Publicity Authority. Digital registration systems have improved considerably in Egypt and the process, while bureaucratic, is achievable. A registered title deed is your most powerful legal protection as a buyer — it establishes ownership in a way that no private contract alone can replicate."
      },
      "post37": {
        "title": "Schools and Education in Sadat City: A Guide for Relocating Families",
        "excerpt": "An overview of Sadat City's education system — public, private, and international schools — to help families make the relocation decision",
        "content1": "Sadat City has a comprehensive education system that includes public schools in every neighborhood, private schools with varying academic levels, and a number of private schools following advanced national curricula. The choice among them depends on budget and desired academic orientation.",
        "content2": "For families seeking international education, there are schools following British or American curricula in the city's upscale neighborhoods. Their fees are comparatively higher but they provide a competitive educational environment and prepare students for higher education in Egypt or abroad.",
        "content3": "Diverse educational options are a primary factor that attracts families to permanent residence in Sadat City. Al-Ahram Developments factors this into project site selection to ensure adequate proximity to the city's most prominent educational institutions.",
        "content4": "The fee structure across school tiers in Sadat City carries direct implications for the income profile of resident families. Government schools are nominally free with minor administrative fees, serving the broadest income range and typically drawing from working-class to lower-middle-income families. Private national schools — following Egypt's national curriculum with enhanced facilities and lower class sizes — charge annual fees ranging from approximately 8,000 to 25,000 Egyptian pounds per child, attracting middle-income households. Private international schools following British or American curricula operate in the higher ranges of 50,000 to 180,000 pounds annually, signaling a family with considerably higher income and a strong preference for internationally portable qualifications. For the investor, the local density of each school tier is a reliable proxy for the income profile of the surrounding residential community.",
        "content5": "School proximity is one of the most consistent drivers of apartment selection for families relocating to Sadat City. Families with school-age children typically define a maximum acceptable commute to school before they begin property searching — commonly fifteen to twenty minutes — and then filter all available options within that radius. This behavioral pattern means that units within the school catchment zone of a well-regarded private school command a measurable premium both in purchase price and rental demand. It also means that new school openings or the upgrade of an existing school to a higher curriculum standard can measurably shift demand patterns in surrounding streets within one to two academic years.",
        "content6": "The school supply in Sadat City is expected to expand with the city's population. Several private school operators are evaluating Sadat City for new campus openings, attracted by the city's growing middle-income population and the relatively affordable land costs compared to Greater Cairo. New campuses following the national advanced curriculum and, in some cases, international certifications will broaden the available choices for families and reduce the current premium commanded by the existing private schools. For investors, a new school opening near an existing residential project is typically a demand-positive event that raises the project's appeal to family tenants and buyers — another reason to track the education supply pipeline as part of ongoing market monitoring."
      },
      "post38": {
        "title": "Healthcare Facilities in Sadat City: A Complete Guide to Hospitals and Clinics",
        "excerpt": "An overview of Sadat City's healthcare system and how it strengthens the city's appeal for permanent residence",
        "content1": "Sadat City hosts a number of public and private hospitals distributed across its main zones, offering comprehensive medical services from emergency and inpatient care and surgical procedures to specialist clinics. This healthcare infrastructure is a core component of the city's appeal to families.",
        "content2": "At the primary care level, clinics, health centers, and pharmacies are found throughout most neighborhoods, making it easy to access basic medical care without traveling to Cairo except in specialized cases.",
        "content3": "Proximity to quality healthcare is an important consideration for families choosing where to live, especially those with young children or elderly members. Al-Ahram Developments incorporates this factor into its site selection criteria.",
        "content4": "Sadat City residents can access a meaningful range of specialist medical services without traveling to Cairo. Cardiology clinics with diagnostic capabilities including echocardiography and stress testing operate in the city's larger private hospitals. Orthopedic services covering both acute trauma and elective joint procedures are available. Maternity services, including obstetrics, gynecology, and neonatal care, are provided at several facilities, reflecting the city's young demographic profile. Pediatric services with both outpatient clinics and in-patient capability are present. While complex oncology and advanced neurosurgery cases still typically require transfer to specialized Cairo facilities, the range of routine and moderately complex specialist care available locally has expanded substantially and covers the needs of most residents in their day-to-day health management.",
        "content5": "Healthcare quality in Sadat City has improved visibly over the past five years, driven primarily by private sector investment rather than public expansion. New private medical centers and clinics have opened in the Golden Zone and adjacent areas, staffed by physicians who rotate from Cairo or who have chosen permanent residence in Sadat City. Diagnostic technology — CT scanning, ultrasound, digital radiology, and laboratory services — has kept pace with private sector entry, reducing the need to travel for investigative procedures. The most significant improvement has been in the breadth of primary and secondary care; residents who would previously have made routine trips to Cairo for specialist consultations increasingly find adequate or equivalent care available locally.",
        "content6": "The healthcare development pipeline in Sadat City is active. Several planned private hospital and medical center projects have been announced or are in early construction stages, targeting the city's growing middle-income population. New pharmacy chains, dental centers, physiotherapy clinics, and optical services are following residential growth into the newer zones. Longer-term, plans for expanded public hospital capacity to serve the city's growing population are part of the infrastructure commitments from the relevant government authorities. Investors and family buyers should view this trajectory as a progressive strengthening of a key quality-of-life foundation — one that has already improved considerably and has continued investment behind it."
      },
      "post39": {
        "title": "Family Mindset vs Investor Mindset in Property Buying: Which One Are You?",
        "excerpt": "An important distinction between buying property as a home and buying it as an investment, and how this distinction shapes your decision",
        "content1": "The family buyer evaluates a unit against daily living criteria: proximity to schools, hospitals, and markets; room size and layout; floor and view. Their priority is their family's quality of life, not maximum financial return.",
        "content2": "The investor evaluates by different criteria: expected rental yield, projected capital appreciation, and ease of resale and liquidity in the future. They may choose a smaller or lower-floor unit because its lower cost raises the return on capital.",
        "content3": "Some buyers combine both objectives — buying a home today while keeping future resale profit in mind. This approach requires a careful balance. Al-Ahram Developments can help you make the most appropriate decision based on your primary goal.",
        "content4": "The dual-purpose strategy works best when location and unit type are selected to satisfy both criteria simultaneously. A three-bedroom unit in a well-maintained building near a university or hospital serves as a comfortable family home while also commanding strong rental demand if you ever relocate. Targeting units with this dual appeal requires upfront analysis but pays off in long-term flexibility.",
        "content5": "Market timing considerations differ for each mindset. The family buyer is less affected by market cycles because they plan to hold the unit long-term — the right time to buy is when they are ready and the unit suits their life. The investor, however, benefits from entering during softer market conditions or pre-launch phases when prices are more negotiable and the appreciation runway is longer. Both timing logics are valid but require different decision processes.",
        "content6": "Al-Ahram Developments advisors are trained to start the conversation by understanding your primary goal before presenting any unit. If you are a family buyer, they focus on layout, floor, view, and proximity to services. If you are an investor, the conversation begins with yield projections and exit timing. And if you are both, they help you find the unit where both sets of criteria converge — which is a smaller list, but a highly rewarding one."
      },
      "post40": {
        "title": "Transportation Links in Sadat City: Connections That Make Life Easier",
        "excerpt": "A complete guide to transport options in Sadat City — getting around internally and reaching Cairo, Alexandria, and other governorates",
        "content1": "Sadat City is easily accessible via the Cairo–Alexandria Desert Road from Cairo and via the Alexandria Desert Road from Alexandria. Shared taxis and minibuses also connect the city from Shibin El Kom, the capital of Monufia, and from several neighboring governorates.",
        "content2": "Within the city, small transport vehicles including minibuses and tuk-tuks connect different neighborhoods. Main streets are wide and accommodate good traffic flow, and private car parking is available and inexpensive compared to major cities.",
        "content3": "With continuous improvements to the road network and newly announced link projects, accessibility to Sadat City is gradually improving. This improvement positively reflects on property prices and makes investing here an increasingly sound decision.",
        "content4": "Specific transportation improvements in recent years have tangibly strengthened connectivity. Road maintenance and resurfacing on key sections of the Cairo–Alexandria Desert Road has reduced travel disruption. Within Sadat City, street lighting improvements on main roads and the addition of designated loading and unloading zones in commercial districts have made daily movement more orderly. Informal transport options — primarily the shared taxi and microbus networks — have also densified as the city's population has grown, reducing waiting times on main routes compared to five years ago. While no major mass transit link such as a railway or dedicated bus rapid transit line has been completed, the practical experience of daily mobility within and to the city has improved measurably.",
        "content5": "For a resident employed in Cairo who commutes from Sadat City, the realistic cost calculation matters. A shared taxi or microbus to Shebin El Kom followed by a connection to Cairo is the most common public option, totaling roughly 50 to 80 Egyptian pounds each way depending on route and class — a significant daily cost at current inflation levels that makes private car ownership attractive for regular commuters. Private car costs — fuel, tolls, and vehicle wear — are proportionally lower per trip for those who already own a vehicle. This cost reality reinforces that Sadat City works best economically for residents whose employment is local, and that the Cairo commute, while physically possible, is an ongoing financial and time commitment that affects quality of life.",
        "content6": "Transportation infrastructure quality has a measurable zone-specific effect within Sadat City. Zones directly adjacent to the Cairo–Alexandria Desert Road or to the main internal arterial roads — particularly the Golden Zone and the central axis — benefit from superior connectivity and shorter internal travel times, which commands a tangible premium in both purchase prices and rental rates compared to zones on the city's periphery where road quality and transport frequency drop off. For investors evaluating multiple projects, a zone's position relative to Sadat City's principal road network is a durable location quality signal that is unlikely to erode and that tends to compound in value as surrounding infrastructure develops."
      },
      "post41": {
        "title": "Sadat City Property Market 2025–2026: Trends and Numbers",
        "excerpt": "An objective analysis of Sadat City's real estate market trends during 2025–2026 and the key indicators that matter to investors",
        "content1": "Sadat City's property market recorded notable price growth during 2025, averaging 18%–25% year-on-year, driven by rising construction material costs and growing demand from buyers seeking to leave Greater Cairo.",
        "content2": "The 2026 outlook remains positive with continued infrastructure projects and industrial expansion. Analysts forecast additional price growth of 15%–20%, with rising rental demand particularly in areas near universities and industrial zones.",
        "content3": "The investment opportunity in Sadat City remains ripe for those entering the market now, before the pace of appreciation accelerates. Al-Ahram Developments provides a detailed market analysis to any client interested in investing in the city.",
        "content4": "The supply pipeline entering Sadat City's market in 2026 is meaningful but not overwhelming relative to underlying demand. Several residential projects that broke ground in 2023 and 2024 are expected to deliver units in 2026, adding new supply to a market that has seen limited deliveries in prior years. This new supply will apply some price moderation pressure in certain segments and zones, particularly for mid-size units in areas already well-served by existing stock. However, the pipeline is not large enough to reverse the fundamental supply-demand imbalance that has driven price growth — rather, it is likely to slow price acceleration rather than reverse it, which from an investor's perspective means the appreciation runway remains but the urgency of entry timing has increased.",
        "content5": "Within Sadat City's overall market, not all segments are growing at the same pace. Small units — one-bedroom and two-bedroom apartments of 65 to 110 square meters — are the fastest-moving segment driven by student demand, single professionals, and young couples. Mid-size family units of 130 to 160 square meters represent the deepest pool of owner-occupier demand and are seeing steady price growth without the volatility of the smaller unit segment. Commercial units in well-located ground floors of new residential projects are attracting increasing investor attention as retail and service demand builds with the residential population. The slowest segment currently is larger units above 180 square meters, where demand is thinner and the pool of qualifying buyers smaller.",
        "content6": "Several leading indicators are worth monitoring to assess whether Sadat City's market continues its appreciation trajectory or approaches a plateau. Construction cost trends are the most immediate: if steel and cement prices stabilize or decline, downward pressure on developer pricing intentions follows. Rental vacancy rates across the university and industrial zones are a real-time demand signal — rising vacancy is typically the earliest warning sign before price growth slows. New project launch volumes from developers active in the city provide a supply-side read: a surge in concurrent launches indicates developer confidence but also increased future supply. Finally, the pace of institutional and factory expansion along the industrial corridor is the most durable demand anchor to track, as it directly drives employment and thus housing demand."
      },
      "post42": {
        "title": "Utilities and Services Checklist for Sadat City Properties",
        "excerpt": "The essential services you must verify are in place before purchasing any residential unit in Sadat City",
        "content1": "Before completing any property transaction in Sadat City, verify connections to essential utilities: electricity (connected to the national grid, not a standalone generator), drinking water (public network or a local desalination plant), and sewage (central network, not a cesspit).",
        "content2": "Also verify whether centralized natural gas is available if the building claims it, rather than relying solely on gas cylinders. Internet service and mobile network coverage have become necessities rather than luxuries — ask which providers serve the area.",
        "content3": "Al-Ahram Developments provides full utility connections in all its projects — electricity, water, sewage, and natural gas networks. We believe these basic services are not optional extras but a non-negotiable baseline.",
        "content4": "Solar readiness is an emerging infrastructure consideration that forward-looking buyers should ask about. Buildings with roof access, structural capacity for panel installation, and electrical systems designed to accommodate net metering will be significantly more valuable as Egypt's solar adoption accelerates. Ask whether the building permits and roof-use rights allow for future solar installation — a small question today that matters greatly in five years.",
        "content5": "Fiber optic internet and mobile network quality have become functional requirements for remote workers and families with school-age children. Before committing to a unit, test signal strength on multiple carriers during a site visit and ask the developer which fiber providers have infrastructure in the building or the surrounding street. A unit with poor connectivity is increasingly difficult to rent or resell to a younger demographic.",
        "content6": "Finally, clarify the building management structure. Who collects maintenance fees? Who handles emergency repairs? Is there a residents' association or does the developer manage the property post-handover? Buildings with professional management companies and active residents' associations maintain their condition — and their value — far better than those with no organized oversight. Al-Ahram Developments provides this clarity upfront for every project."
      },
      "post43": {
        "title": "How Infrastructure Projects Drive Property Values in Sadat City",
        "excerpt": "How new road and utility projects have translated into real price increases across Sadat City's various zones",
        "content1": "Real estate history consistently shows that every major infrastructure project redraws the property value map of surrounding areas. Sadat City is a clear example: road widening in the Golden Zone during 2022–2023 resulted in units on those streets appreciating by more than 30% within two years.",
        "content2": "Currently active projects — including the central corridor and the sewage network upgrade in the eastern zones — present an opportunity to invest before their impact is priced in. The smart investor buys before a project completes and sells or rents after it opens.",
        "content3": "Al-Ahram Developments tracks Sadat City's infrastructure project map and positions its investments in areas that will benefit from the next wave of development. This strategic positioning translates into real value for our clients.",
        "content4": "Infrastructure investments that affect property values extend well beyond roads and paving. Electricity grid upgrades — including the addition of transformer capacity to support higher density residential development — enable larger buildings and eliminate the generator dependency that reduces buyer confidence in some areas. Water and sewage network expansions into previously underserved zones make those areas viable for permanent residential development for the first time, often triggering the first wave of formal developer entry. Fiber optic internet rollout, while less physically visible than road projects, has an increasingly measurable effect on desirability, particularly for younger buyers and tenants who work remotely or have high digital connectivity requirements.",
        "content5": "The value appreciation that follows an infrastructure project does not typically materialize immediately on completion. The pattern observed in Sadat City and comparable cities is that the most significant appreciation occurs in two windows: a speculative window before the project completes — when informed investors buy in anticipation — and a fundamental window 12 to 24 months after completion, when the operational reality of the improvement attracts a broader pool of buyers and tenants who respond to lived experience rather than plans. The middle period — the actual construction phase — is often characterized by price softness near the construction zone due to disruption, dust, and noise, which creates a buying opportunity for those willing to tolerate temporary inconvenience.",
        "content6": "Identifying upcoming infrastructure projects before they become widely known requires deliberate research rather than passive observation. The most reliable sources are official urban development authority announcements and the detailed budgets published in governorate-level development plans, both of which are public documents but require active monitoring. Local contractors and construction material suppliers active in the market often have practical knowledge of upcoming projects before formal announcements are made. Developer site selection decisions — particularly when established developers acquire land in an area that seemed unremarkable — are often a leading signal that a zone is about to benefit from infrastructure investment. Al-Ahram Developments tracks this pipeline continuously and positions its projects accordingly."
      },
      "post44": {
        "title": "Why Al-Ahram Developments Chose Sadat City: A Strategic Vision",
        "excerpt": "The strategic reasons behind Al-Ahram Developments' focus on Sadat City and its decision to build its real estate portfolio there",
        "content1": "When Al-Ahram Developments decided to focus on Sadat City, it was a deliberate, data-driven decision. The city's central geographic position between Cairo and Alexandria, its established industrial base, and its accelerating university expansion were all indicators of sustainable residential growth.",
        "content2": "Over the years, this vision has proved correct as demand grew, prices rose, and increasing numbers of families relocated to the city. Al-Ahram expanded its portfolio in Sadat City because it sees the city's success story as one that has not yet reached its peak.",
        "content3": "Our decision to choose Sadat City is not only a commercial one — it is a commitment to a growing residential community whose ambitions we share. Al-Ahram Developments will continue building in Sadat City and will launch new projects that cement its presence in the city's best locations.",
        "content4": "Before committing to Sadat City, Al-Ahram Developments conducted a rigorous comparative analysis of seven Egyptian second-tier cities. The analysis evaluated each city on industrial anchoring, educational infrastructure, road accessibility, land price trajectory, and supply-demand balance. Sadat City ranked highest on four of the five dimensions — the outlier being raw land price, which was higher than some more remote alternatives but justified by superior accessibility and fundamentals.",
        "content5": "The Golden Zone selection within Sadat City was similarly deliberate. The company mapped service density, proximity to the industrial zone and universities, road quality, and zoning classifications before selecting development sites. The Golden Zone scored highest on all dimensions — explaining why Al-Ahram's projects there have delivered the strongest appreciation and the most consistent rental demand in the portfolio.",
        "content6": "That analytical discipline is not a one-time exercise. Al-Ahram Developments continues to monitor Sadat City's infrastructure pipeline, population trends, and rental market data on a quarterly basis. This ongoing research feeds directly into decisions about upcoming project locations, unit mix, and pricing — ensuring that each new launch is as well-positioned as possible for the clients who trust the company with their savings and their futures."
      },
      "post45": {
        "title": "The Advantages of Egypt's New Cities: Why More Families Are Moving Outside Cairo",
        "excerpt": "An overview of the reasons driving more Egyptian families to choose new cities as their permanent home",
        "content1": "Egypt's new cities are attracting increasing demand for objective reasons: rising overcrowding in Greater Cairo, property prices there that are out of reach for middle-income families, and deteriorating air quality, road conditions, and infrastructure services in many neighborhoods.",
        "content2": "New cities offer a balanced alternative: more competitive prices, wider and better-organized streets, more green space, and modern infrastructure that matches or exceeds what is available in the capital. Sadat City in particular combines these advantages with a solid industrial and educational economic base.",
        "content3": "The move toward new cities is not a passing trend but a genuine demographic shift supported by state policies to develop infrastructure and broaden economic opportunities outside Cairo. Al-Ahram Developments is among the investors who recognized this shift early.",
        "content4": "The demographic profile of who is actually relocating to Egyptian new cities today is more diverse than commonly assumed. Young families with children under ten represent the largest group — drawn by the combination of lower housing costs, better air quality, and quieter streets for raising children. A secondary and growing group consists of middle-aged professionals who have purchased investment units in new cities and now choose to move there as they approach retirement age and seek a calmer environment. Remote workers — whose numbers expanded significantly after 2020 — represent a third segment for whom physical proximity to Cairo has become less important, making Sadat City's distance from the capital a manageable rather than disqualifying factor. Each of these groups brings sustained, multi-year demand rather than short-term or speculative activity.",
        "content5": "Government policy has been a consistent accelerant of the demographic shift toward new cities, and the support mechanisms are multiple. Infrastructure investment in roads, electricity, water, and sewage directly lowers the quality-of-life deficit that historically made new cities less attractive than Cairo neighborhoods with equivalent price points. Employment creation through industrial zone development and the relocation of government functions generates local economic activity that sustains resident populations independently of Cairo. Subsidized mortgage programs from government banks and the Social Housing Fund have made unit acquisition more accessible to the middle-income families who are the primary driver of new city population growth. Taken together, these policy levers are not likely to reverse — which gives the demographic shift a structural rather than cyclical character.",
        "content6": "Sadat City's specific advantages over the average Egyptian new city include factors that address the most common complaints about new city living. The industrial zone provides local employment that is absent in purely residential new cities, reducing resident dependence on Cairo commutes. The university cluster ensures a service ecosystem — cafes, restaurants, tutoring centers, bookshops — that purely residential or administrative new cities often lack. The Cairo–Alexandria Desert Road location means residents feel connected to two major cities rather than isolated from both. The remaining challenges are real: the city's nightlife and entertainment offerings remain limited compared to Cairo or 6th of October, and some peripheral zones still have service gaps. But these are gaps that narrow with population growth, and Sadat City's economic foundation gives it a more credible trajectory toward closing them than new cities that depend entirely on residential settlement for their vitality."
      },
      "post46": {
        "title": "Sadat City's Quiet Environment: Away from the Noise of Major Cities",
        "excerpt": "How Sadat City offers a quieter, healthier living environment far from the noise pollution and congestion of Greater Cairo",
        "content1": "Noise pollution is one of the most significant problems in Egypt's major cities and has a direct impact on residents' mental and physical health. Sadat City offers a much quieter living environment thanks to lower traffic density and its residential neighborhoods' distance from large industrial facilities.",
        "content2": "The clear separation between industrial and residential zones in Sadat City's master plan ensures that residential neighborhoods are not affected by factory noise or odors. This deliberate planning makes daily life in residential districts resemble suburban tranquility while keeping services close.",
        "content3": "For those seeking a quiet environment to raise children, work from home, and enjoy comfortable daily living, Sadat City is a serious option. Al-Ahram Developments selects project sites in the quieter residential neighborhoods to ensure the highest quality of life for residents.",
        "content4": "Urban noise studies consistently show that dense Cairo neighborhoods sustain ambient sound levels researchers classify as chronically disruptive to concentration and conversation. Sadat City's residential districts sit in a different category entirely. Lower traffic volumes on internal roads, fewer honking incidents, and the absence of commercial congestion create an acoustic environment closer to a mid-sized suburb than a developing Egyptian city. The difference is perceptible within minutes of arrival and measurable across both daytime activity hours and the critical late-night window.",
        "content5": "Sleep quality is one of the most undervalued factors in residential real estate decisions. Persistent nighttime noise raises cortisol levels, fragments sleep cycles, and has documented links to cardiovascular strain over time. Families relocating from Cairo consistently report that the first measurable change they notice in Sadat City is how differently their children sleep. Adults working demanding schedules describe a recovery quality they had attributed to other lifestyle factors until the comparison became obvious. For households prioritizing health and sustained cognitive performance, the acoustic environment of a residence is not a secondary consideration — it is foundational.",
        "content6": "The quietness of Sadat City's residential zones is not accidental — it is the product of deliberate master planning. Industrial zones are placed with substantial buffer land separating them from housing clusters. Arterial roads serving freight and industrial traffic are routed away from residential corridors, not through them. Internal street design in residential areas favors lower-speed, lower-volume circulation patterns. These are structural, planning-level decisions that cannot be undone by future density increases, which gives investors and owner-occupiers lasting confidence that the acoustic character of the area is not temporary."
      },
      "post47": {
        "title": "Sadat City's Urban Expansion Plans to 2030: What Investors Need to Know",
        "excerpt": "A forward-looking view of Sadat City's planned urban development projects and the expected impact on property prices",
        "content1": "Sadat City's urban development plans to 2030 include planned expansions in several new residential zones, development of the technology district to accommodate more advanced industries, and upgrading of the main road corridors that will connect the city to neighboring new housing projects.",
        "content2": "Announced infrastructure projects include expanding the water treatment plant to accommodate expected population growth, upgrading the internal road network, and adding new service facilities in growing zones. All of these projects strengthen the city's investment appeal.",
        "content3": "An investor who enters Sadat City's market now establishes a position before these expansions are reflected in market prices. Al-Ahram Developments welcomes a discussion of today's investment opportunities in light of the future development roadmap.",
        "content4": "Not all planned expansion zones carry equal probability of early delivery. The most reliable signal of near-term development is the presence of already-functioning adjacent infrastructure. Zones that border established residential clusters, connect to existing main roads, and sit within reach of current utility networks tend to be activated ahead of zones that require greenfield infrastructure build-out from scratch. Monitoring private developer activity is equally informative — when multiple developers begin acquiring land in a specific zone, it signals market-level confidence that planning approvals are credible, not speculative.",
        "content5": "Investing ahead of a planned expansion carries real risk that should be assessed honestly. Timelines on government development programs in Egypt are subject to revision. A zone designated for 2027 activation may deliver in 2025 or extend to 2030 depending on budget cycles, contractor capacity, and policy shifts. Investors who enter too early in zones entirely dependent on future infrastructure may face extended holding periods with limited liquidity and no rental income. The prudent approach is to distinguish between zones where development is already visible and accelerating versus zones where value is contingent solely on future government action.",
        "content6": "Al-Ahram's project pipeline is deliberately calibrated against the 2030 expansion map rather than positioned speculatively ahead of it. The company focuses on zones where infrastructure is active or near-complete, where utility connections are established, and where the surrounding development context already supports liveability. This means buyers are not funding speculative bets on government timelines — they are acquiring in areas where the investment case is grounded in present conditions while still capturing the upside of continued city expansion."
      },
      "post48": {
        "title": "Investment Incentives in Sadat City: What Official Authorities Offer Investors",
        "excerpt": "An overview of the incentives and facilities that government bodies and GAFI provide to investors in Sadat City",
        "content1": "Sadat City is classified among the zones where the General Authority for Investment and Free Zones (GAFI) offers incentives to attract industrial and commercial investment. These incentives include facilitated access to industrial land and streamlined licensing procedures within a one-stop investment window.",
        "content2": "On the residential side, buyers benefit from government housing support programs including the Social Housing Fund and subsidized mortgage finance initiatives that offer reduced interest rates for limited and middle-income earners.",
        "content3": "Understanding available incentives is an essential part of making the right investment decision. Al-Ahram Developments keeps clients fully informed about support programs available for our units in Sadat City to ensure the best possible deal.",
        "content4": "GAFI's classification of Sadat City within its incentive framework has direct practical implications for industrial and commercial investors. Land allocation is accessible through simplified procedures, custom duties on imported production equipment are reduced, and permit processing is accelerated compared to standard Cairo-based industrial licensing. For a manufacturing or logistics operation, reduced customs exposure and faster permits can materially affect project feasibility calculations.",
        "content5": "The Social Housing and Mortgage Finance Fund supports Egyptian nationals meeting defined income and asset criteria for residential purchases. Qualifying units are subject to size limits — typically up to 90 square meters for certain program tiers — and benefit from interest rate support mechanisms that reduce the effective mortgage rate below open-market levels. Income eligibility thresholds target low-to-middle income households, and applications run through registered mortgage banks.",
        "content6": "Navigating government incentive programs requires accurate and up-to-date knowledge of eligibility criteria, application windows, and documentation requirements — details that shift as programs are updated or expanded. Al-Ahram maintains working relationships with mortgage finance institutions and is familiar with the current state of applicable incentive programs. The company's advisory team helps clients assess which programs they qualify for and how to sequence the transaction to remain within program requirements."
      },
      "post49": {
        "title": "Mosques, Religious Life, and Community in Sadat City",
        "excerpt": "How mosques and religious facilities shape the community identity of Sadat City and strengthen social cohesion among residents",
        "content1": "Mosques are well distributed throughout Sadat City's neighborhoods, serving as spiritual and social centers that bring residents together for daily prayers and religious occasions. Proximity to a mosque is a top priority for many Egyptian families when choosing where to live.",
        "content2": "Sadat City's mosques host a variety of community activities including Quran memorization circles, awareness programs, and youth activities. This community role strengthens bonds among residents and builds a cohesive community with a firmly grounded identity.",
        "content3": "Al-Ahram Developments considers proximity to mosques and religious facilities alongside other services when selecting project sites, because we understand that an ideal home is only complete when surrounded by a social and spiritual environment that meets the family's full range of needs.",
        "content4": "Beyond daily prayers, Sadat City's mosques serve as anchors for a broad range of community programs: Ramadan iftars that bring neighbors together, charity and zakat distribution channels during Eid seasons, and regular awareness sessions on social, health, and educational topics. This social infrastructure is rarely visible in property listings but profoundly shapes the quality of life for residents who use it.",
        "content5": "The presence of well-maintained mosques near a residential project correlates with stronger community cohesion and greater neighborhood stability — outcomes that have measurable real estate implications. Buildings surrounded by active community institutions tend to hold their value better during market slowdowns because the surrounding social fabric reduces turnover and encourages long-term residency. For investors, community stability translates directly into lower vacancy risk and more reliable rental income.",
        "content6": "Al-Ahram Developments treats proximity to mosques, community centers, and social institutions as a genuine site selection criterion rather than an afterthought. Our project locations in the Golden Zone place residents within walking distance of the neighborhood mosque, fulfilling a practical need while contributing to the sense of belonging that differentiates a home from merely a unit. A family that feels embedded in a living community is one that stays — and that is the outcome every Al-Ahram project is designed to produce."
      },
      "post50": {
        "title": "Egypt Real Estate Market Outlook 2026: A Complete View for Investors",
        "excerpt": "An in-depth analysis of Egypt's real estate market indicators in 2026 and the key opportunities and challenges every investor should know",
        "content1": "Egypt's real estate market enters 2026 from a position of relative strength, supported by gradually declining inflation and relative stability in construction material prices compared to the 2023–2024 peak. Domestic demand remains strong, driven by demographic growth and a rising young population seeking residential independence.",
        "content2": "On the investment geography front, mid-sized new cities like Sadat City and 10th of Ramadan lead the list of most viable destinations for mid-budget investors. The combination of acceptable rental yield and gradual capital appreciation makes them a more balanced choice than high-priced markets.",
        "content3": "Al-Ahram Developments enters 2026 with confidence and continues launching projects in Sadat City with designs that meet market expectations and prices that deliver genuine value to buyers. If 2026 is the year of your investment decision, we welcome the conversation.",
        "content4": "For investors specifically evaluating new city opportunities in 2026, the supply-demand dynamics in Sadat City remain favorable. New unit deliveries are entering a market where population growth and migration from Cairo continue to outpace supply, particularly in the affordable-to-mid-range segment. This supply gap supports rental yields and limits the price correction risk that oversupplied markets face. The investor who enters a market with genuine demand fundamentals rather than speculative momentum is on structurally stronger ground.",
        "content5": "The macroeconomic environment in Egypt in 2026 — characterized by gradually moderating inflation and a relatively stable exchange rate compared to the volatility of 2022-2023 — creates a more predictable planning environment for real estate investments. While currency and inflation risks remain present in any emerging market context, the trajectory has improved, and institutional confidence in Egyptian real estate as a store of value remains robust among both domestic and diaspora investors.",
        "content6": "Al-Ahram Developments' positioning in Sadat City means that clients are not simply betting on the national market — they are investing in a specific city with specific fundamentals: an established industrial base, growing university enrollment, improving infrastructure, and a developer with a verifiable track record. These specifics matter when broader markets move sideways. The investors who weather macro uncertainty best are those who chose locations and partners based on local fundamentals rather than general sentiment — and Sadat City with Al-Ahram offers precisely that grounding."
      }
    },
    "pagination": {
      "label": "Pagination",
      "prev": "Previous page",
      "next": "Next page",
      "info": "Page {{current}} of {{total}}"
    }
  },
  "sadatGuide": {
    "hero": {
      "eyebrow": "City Guide",
      "title": "Sadat City Guide",
      "subtitle": "Everything you need to know about Sadat City — location, services, and investment opportunities"
    },
    "overview": {
      "eyebrow": "City Overview",
      "title": "About Sadat City",
      "paragraph1": "Sadat City is one of Egypt's most important first-generation cities, located in Monufia Governorate, 90 km northwest of Cairo. Founded in 1978, it has been experiencing rapid urban and investment growth in recent years.",
      "paragraph2": "The city features modern infrastructure and a road network connecting it to Cairo, Alexandria, and the Delta. With a growing population and new projects, Sadat City has become an ideal destination for living and real estate investment."
    },
    "stats": {
      "population": "residents (projected 2M by 2030)",
      "distance": "km from Cairo",
      "compounds": "planned compounds",
      "growth": "annual price growth"
    },
    "whySadat": {
      "eyebrow": "Why Choose Sadat",
      "title": "Why Sadat City?",
      "subtitle": "Reasons that make Sadat City the ideal choice for living and investment",
      "reason1": {
        "title": "Competitive Prices",
        "description": "Property prices 75% lower compared to New Cairo and Fifth Settlement"
      },
      "reason2": {
        "title": "Strategic Location",
        "description": "90 km from Cairo and 120 km from Alexandria via highways"
      },
      "reason3": {
        "title": "Modern Infrastructure",
        "description": "Wide, planned streets and an advanced utilities network"
      },
      "reason4": {
        "title": "Complete Services",
        "description": "Universities, schools, hospitals, commercial and entertainment centers"
      },
      "reason5": {
        "title": "Investment Opportunities",
        "description": "33% annual property price growth with EGP 5+ billion in private investment"
      },
      "reason6": {
        "title": "Quiet Environment",
        "description": "Vast green spaces and tranquility away from big city congestion"
      }
    },
    "sections": {
      "eyebrow": "City Highlights",
      "title": "What Sadat City Offers",
      "infrastructure": {
        "title": "Infrastructure & Transportation",
        "content": "Sadat City features a modern road network including the Cairo-Alexandria Desert Road and the Cairo-Alexandria Agricultural Road. It is also connected by a railway line to Cairo and Upper Egypt. The city is divided into carefully planned residential, industrial, and commercial zones."
      },
      "education": {
        "title": "Education & Universities",
        "content": "The city hosts several distinguished educational institutions including Sadat City University, Al-Reyada University, and multiple higher institutes. In addition to public, private, and international schools covering all educational levels."
      },
      "healthcare": {
        "title": "Healthcare",
        "content": "The city offers public and private hospitals and specialized medical centers. Notable facilities include Sadat City General Hospital and Sadat University Teaching Hospital, along with private clinics and medical centers."
      },
      "commercial": {
        "title": "Shopping & Commerce",
        "content": "The city features multiple commercial centers, modern malls, and traditional markets. All major brands, shops, and restaurants are available to meet residents' daily needs."
      }
    },
    "allZones": {
      "eyebrow": "Zone Directory",
      "title": "Explore Our Zones in Sadat City",
      "subtitle": "Al-Ahram Developments operates across 8 zones — browse each zone to discover available residential projects",
      "goldenBadge": "Golden Zone"
    },
    "priceComparison": {
      "eyebrow": "Price Benchmarks",
      "title": "Price Comparison",
      "subtitle": "Price per square meter compared to other cities",
      "cityHeader": "City",
      "priceHeader": "Average Price/m²",
      "sadatCity": "Sadat City",
      "sadatCityPrice": "~EGP 11,500/m²",
      "october": "6th of October City",
      "octoberPrice": "~EGP 25,000/m²",
      "newCairo": "New Cairo",
      "newCairoPrice": "~EGP 45,000/m²",
      "newCapital": "New Administrative Capital",
      "newCapitalPrice": "~EGP 35,000/m²",
      "bestValue": "Best Value",
      "disclaimer": "* Prices are approximate and may vary by location and project. Updated as of March 2026."
    },
    "cta": {
      "eyebrow": "Start Your Journey",
      "title": "Start Your Life in Sadat City",
      "subtitle": "Discover our premium residential projects in the Golden Zone",
      "browseProjects": "Browse Projects",
      "whatsapp": "Chat on WhatsApp"
    },
    "faq": {
      "heading": "Frequently Asked Questions",
      "eyebrow": "FAQ",
      "q1": "What are apartment prices in Sadat City?",
      "a1": "Apartment prices in Sadat City start at approximately EGP 11,500 per square meter, making it one of the most affordable options compared to New Cairo, 6th of October City, and the New Administrative Capital.",
      "q2": "Which zones does Al-Ahram Developments operate in Sadat City?",
      "a2": "Al-Ahram Developments has projects in Zone 21 (The Golden Zone), Strip 7, Homeland 7, Zone 14, Zone 22, Zone 29, Al-Rawda, and Zone 35.",
      "q3": "Does Al-Ahram offer interest-free installment plans?",
      "a3": "Yes, Al-Ahram Developments offers flexible interest-free installment plans of up to 7 years, with a down payment starting from only 20% of the unit value.",
      "q4": "Where is Sadat City located?",
      "a4": "Sadat City is located in Monufia Governorate, 90 km northwest of Cairo. It is easily accessible via the Cairo-Alexandria Desert Road and the Agricultural Road.",
      "q5": "How long does unit delivery take?",
      "a5": "Delivery timelines range from 2 to 3 years depending on the project and construction phase. You can track progress on our Construction Updates page.",
      "q6": "How can I contact Al-Ahram Developments?",
      "a6": "You can reach us via WhatsApp, phone call, or through the contact form on our website. Our team is available seven days a week from 9 AM to 6 PM.",
      "q7": "What are the advantages of living in Sadat City?",
      "a7": "Sadat City offers a peaceful environment with wide green spaces, modern infrastructure, universities, schools, hospitals, and commercial centers — all at prices significantly lower than major urban cities.",
      "q8": "Are Al-Ahram projects officially licensed and approved?",
      "a8": "Yes, all Al-Ahram Developments projects are officially licensed and approved by the relevant government authorities in Sadat City, operating under valid official permits."
    }
  },
  "constructionUpdates": {
    "hero": {
      "eyebrow": "Site Progress",
      "title": "Construction Updates",
      "subtitle": "Follow the latest developments and construction progress of our projects with full transparency"
    },
    "milestones": {
      "foundation": "Foundation",
      "structure": "Structure",
      "finishing": "Finishing",
      "delivery": "Delivery"
    },
    "updates": {
      "update1": {
        "title": "Interior Finishing Works Begin — Project 865",
        "description": "The concrete structure has been fully completed and interior and exterior finishing works have begun, including painting, ceramics, electrical, and plumbing works."
      },
      "update2": {
        "title": "Concrete Structure Completed — Project 868",
        "description": "The concrete structure casting for all floors has been completed and interior partition and masonry works have begun."
      },
      "update3": {
        "title": "Structure Works Completed — Project 865",
        "description": "All floor slab casting has been completed and masonry works have begun. Execution is proceeding according to the established timeline."
      },
      "update4": {
        "title": "Excavation and Foundation Works Begin — Project 76",
        "description": "Excavation and foundation preparation works for Project 76 have begun at the new site. Foundations are expected to be completed within two months."
      },
      "update5": {
        "title": "Foundation and Footings Poured — Project 868",
        "description": "Concrete footings and tie beams have been poured, and ground floor structure works are now beginning."
      }
    },
    "timeline": {
      "eyebrow": "Project Timeline",
      "title": "Construction Timeline"
    },
    "cta": {
      "eyebrow": "Visit the Site",
      "title": "Follow Our Projects Up Close",
      "subtitle": "Contact us to visit the site and see the latest developments in person",
      "whatsapp": "Chat on WhatsApp",
      "browseProjects": "Browse Projects"
    }
  },
  "paymentPlans": {
    "hero": {
      "eyebrow": "Flexible Options",
      "title": "Payment & Installment Plans",
      "subtitle": "Choose the payment plan that suits your budget and get your residential unit the easiest way"
    },
    "comparison": {
      "eyebrow": "Compare Plans",
      "title": "Available Payment Plans",
      "subtitle": "We offer multiple options to suit all budgets",
      "popular": "Most Popular",
      "inquire": "Inquire Now"
    },
    "plans": {
      "cash": {
        "title": "Cash Payment",
        "description": "Get an exclusive discount when paying the full unit value upfront",
        "feature1": "Up to 10% discount on total price",
        "feature2": "Immediate handover when unit is available",
        "feature3": "Priority in unit selection"
      },
      "installment": {
        "title": "Developer Installment",
        "description": "Comfortable installments with zero interest directly from Al-Ahram Developments",
        "feature1": "Down payment starting from 20% of unit value",
        "feature2": "Up to 5 years installment with zero interest",
        "feature3": "Fixed and comfortable monthly installments"
      },
      "bank": {
        "title": "Bank Mortgage",
        "description": "Real estate financing from partner banks with long repayment periods",
        "feature1": "Financing up to 80% of unit value",
        "feature2": "Repayment periods up to 20 years",
        "feature3": "Competitive interest rates from partner banks"
      }
    },
    "calculator": {
      "eyebrow": "Plan Your Budget",
      "subtitle": "Use the calculator to estimate your expected monthly installment based on price and term"
    },
    "financing": {
      "eyebrow": "Financing Options",
      "title": "Financing Options",
      "subtitle": "We help you choose the best way to finance your residential unit",
      "developer": {
        "title": "Direct Developer Installment",
        "description": "We offer flexible installment plans directly without the need for complex banking procedures. Benefit from comfortable installments with Al-Ahram Developments.",
        "point1": "Quick and simple procedures without a guarantor",
        "point2": "Flexibility in payment schedule according to your circumstances",
        "point3": "No hidden fees or additional costs"
      },
      "bank": {
        "title": "Bank Financing",
        "description": "In cooperation with leading banks in Egypt, we provide real estate financing options with competitive interest rates and flexible repayment periods.",
        "point1": "Partnerships with major Egyptian banks",
        "point2": "Assistance in preparing required documents",
        "point3": "Free consultation on the best financing option"
      }
    },
    "faq": {
      "eyebrow": "Common Questions",
      "title": "Payment FAQ",
      "q1": "What is the minimum down payment?",
      "a1": "The down payment starts from 20% of the total unit value in the developer installment plan. For bank financing, the down payment can be as low as 20% depending on the financing bank.",
      "q2": "Can I change the payment plan after signing?",
      "a2": "Yes, you can contact our sales team to discuss adjusting your payment plan according to your financial circumstances. We strive to provide maximum flexibility for our clients.",
      "q3": "What documents are required for installment?",
      "a3": "For developer installment: copy of national ID + utility receipt. For bank financing: national ID + income certificate + bank statement for the last 6 months.",
      "q4": "Is there a penalty for early repayment?",
      "a4": "There are no penalties for early repayment in the developer installment plan. In fact, we offer an additional discount for early repayment of remaining installments."
    },
    "cta": {
      "eyebrow": "Ready to Begin",
      "title": "Start the Right Payment Plan for You",
      "subtitle": "Contact our sales consultant to help you choose the best payment plan",
      "whatsapp": "Chat on WhatsApp",
      "browseProjects": "Browse Projects"
    }
  },
  "investors": {
    "hero": {
      "eyebrow": "Real Estate Investment",
      "title": "Invest in Sadat City Real Estate",
      "subtitle": "Promising investment opportunities with high returns in one of Egypt's fastest-growing cities"
    },
    "stats": {
      "annualGrowth": "Annual Price Growth",
      "rentalYield": "Annual Rental Yield",
      "priceDifference": "Less than New Cairo",
      "privateInvestment": "EGP in Private Investment"
    },
    "whyInvest": {
      "eyebrow": "Investment Case",
      "title": "Why Invest in Sadat City?",
      "subtitle": "Sadat City offers a unique blend of competitive prices, high returns, and continuous growth"
    },
    "reasons": {
      "appreciation": {
        "title": "Continuous Value Appreciation",
        "description": "33% annual property price growth driven by infrastructure expansion and new government projects"
      },
      "rentalIncome": {
        "title": "High Rental Income",
        "description": "Rental yields of 15-20% annually thanks to growing demand from university students and workers"
      },
      "infrastructure": {
        "title": "Infrastructure Development",
        "description": "New roads and facilities projects increasing property values and area attractiveness for living and investment"
      },
      "security": {
        "title": "Safe Investment",
        "description": "Real estate in Egypt maintains its value and outperforms inflation as a safe haven for capital"
      },
      "location": {
        "title": "Strategic Location",
        "description": "90 km from Cairo and 120 km from Alexandria with highway and railway connections"
      },
      "flexiblePayment": {
        "title": "Flexible Payment Plans",
        "description": "Up to 5 years installment with zero interest from the developer or bank financing up to 20 years"
      }
    },
    "marketData": {
      "eyebrow": "Market Analysis",
      "title": "Market Data",
      "subtitle": "Real numbers showing Sadat City's superiority as an investment destination",
      "metricHeader": "Metric",
      "sadatHeader": "Sadat City",
      "avgHeader": "New Cities Average",
      "pricePerSqm": "Price per sqm",
      "sadatPrice": "~EGP 11,500",
      "avgPrice": "~EGP 35,000",
      "annualAppreciation": "Annual Growth",
      "sadatAppreciation": "33%",
      "avgAppreciation": "15-20%",
      "rentalYield": "Rental Yield",
      "sadatYield": "15-20%",
      "avgYield": "8-12%",
      "roi": "ROI (5 Years)",
      "sadatRoi": "180-250%",
      "avgRoi": "80-120%",
      "disclaimer": "* Figures are approximate based on market data as of March 2026. Past performance does not guarantee future results."
    },
    "packages": {
      "eyebrow": "Investment Options",
      "title": "Investment Packages",
      "subtitle": "Choose the package that suits your budget and investment goals",
      "recommended": "Most Popular",
      "starter": {
        "title": "Starter Package",
        "description": "Ideal for first-time investors looking for their first real estate opportunity",
        "price": "From EGP 700,000",
        "feature1": "100 m² apartment in Project 76",
        "feature2": "Up to 5 years installment",
        "feature3": "Expected 15% rental yield"
      },
      "premium": {
        "title": "Premium Package",
        "description": "The optimal choice for high investment returns in the Golden Zone",
        "price": "From EGP 1,050,000",
        "feature1": "150 m² apartment in Project 865",
        "feature2": "Prime location in the Golden Zone",
        "feature3": "Expected 18% rental yield"
      },
      "vip": {
        "title": "VIP Package",
        "description": "For investors seeking maximum returns with luxury units",
        "price": "From EGP 1,600,000",
        "feature1": "220 m² penthouse in Project 868",
        "feature2": "Super deluxe finishes",
        "feature3": "Expected 20% rental yield"
      }
    },
    "cta": {
      "eyebrow": "Start Today",
      "title": "Start Your Investment Journey Now",
      "subtitle": "Contact our investment consultant for a free feasibility study customized to your goals",
      "browseProjects": "Browse Projects"
    }
  },
  "sadatMaps": {
    "hero": {
      "eyebrow": "City Maps",
      "title": "Sadat City Maps",
      "subtitle": "A quick guide to understanding Sadat City's key zones and real estate distribution before you buy or invest"
    },
    "overview": {
      "eyebrow": "About This Guide",
      "title": "Quick Reference for Sadat City Zones",
      "paragraph1": "This page brings all Sadat City zones together in one place with a direct PDF download for each map.",
      "paragraph2": "Use it as a ready reference to open maps by zone and district."
    },
    "zones": {
      "eyebrow": "Zone Directory",
      "title": "Zone / Map",
      "description": "Click Download Map to open the PDF file for each zone.",
      "table": {
        "zone": "Zone",
        "map": "Map",
        "download": "Download Map"
      }
    },
    "whyMap": {
      "eyebrow": "Pro Tip",
      "title": "How to Use the Map Before Booking",
      "paragraph": "Start by defining your goal (end-use or investment), then compare zones by access to services, major roads, and growth pace. After that, compare available projects inside each zone to choose the best-fit unit."
    },
    "cta": {
      "eyebrow": "Ready to Move Forward",
      "title": "Your Next Step",
      "subtitle": "Browse Al-Ahram projects by zone and request a free consultation to choose the best location for your budget.",
      "projects": "Browse Projects by Zone",
      "guide": "Back to Sadat City Guide",
      "browseProjects": "Browse Projects",
      "whatsapp": "Chat on WhatsApp"
    }
  },
  "seo": {
    "home": {
      "description": "Al-Ahram Developments — residential apartments for sale in the Golden Zone, Sadat City. Competitive prices and flexible installment plans up to 5 years interest-free.",
      "keywords": "apartments for sale Sadat City, Al-Ahram Developments, Golden Zone real estate, Zone 21 residential units, installment apartments Sadat City, Sadat City property prices, real estate investment Sadat City"
    },
    "about": {
      "title": "About Us | Al-Ahram Developments",
      "description": "Al-Ahram Developments — a leading real estate developer building premium residential communities in Sadat City. High-quality units with exceptional finishes and after-sales service.",
      "keywords": "about Al-Ahram Developments, Al-Ahram real estate company, Sadat City developer, Al-Ahram projects history, real estate developer Egypt"
    },
    "contact": {
      "title": "Contact Us | Al-Ahram Developments",
      "description": "Contact the Al-Ahram Developments sales team. Call 01153516871 or message us on WhatsApp for available units, prices, and installment plans.",
      "keywords": "contact Al-Ahram Developments, Al-Ahram phone number, Al-Ahram WhatsApp, Sadat City real estate office, real estate inquiry Sadat City"
    },
    "gallery": {
      "title": "Project Gallery | Al-Ahram Developments",
      "description": "Browse the latest photos of Al-Ahram real estate projects in Sadat City — apartments, finishes, and construction progress in Zone 21 and surrounding areas.",
      "keywords": "Al-Ahram project photos, Sadat City apartment gallery, Zone 21 apartment interiors, real estate photos Sadat City, Golden Zone residential images"
    },
    "privacy": {
      "title": "Privacy Policy",
      "description": "Al-Ahram Developments privacy policy — how we collect, use, and protect your personal data",
      "keywords": "privacy policy, Al-Ahram, data protection, privacy"
    },
    "projects": {
      "title": "Our Real Estate Projects | Al-Ahram Developments",
      "description": "Explore Al-Ahram Developments projects in Sadat City — residential units in Zone 21, Zone 22, Zone 29, Al-Rawda district, and Zone 35. Affordable prices and easy installments.",
      "keywords": "Al-Ahram real estate projects, Zone 21 apartments Sadat City, Zone 22 units, Al-Rawda district projects, Zone 29 real estate, Zone 35 apartments, Sadat City residential compounds"
    },
    "blog": {
      "title": "Real Estate Blog | Al-Ahram Developments",
      "description": "Latest Egyptian real estate market articles — tips on buying apartments with installments, best investment zones in Sadat City, and Al-Ahram project news.",
      "keywords": "real estate blog Egypt, Egyptian property market 2025, buy apartment installments Egypt, Sadat City investment tips, Al-Ahram news, property investment Egypt"
    },
    "paymentPlans": {
      "title": "Payment & Installment Plans | Al-Ahram Developments",
      "description": "Flexible installment plans for Al-Ahram apartments in Sadat City — down payment from 10% and monthly installments up to 5 years interest-free. Calculate your installment now.",
      "keywords": "apartment installments Sadat City, Al-Ahram payment plans, 10% down payment apartments, interest-free installments Sadat City, real estate financing Sadat City, installment calculator Egypt"
    },
    "constructionUpdates": {
      "title": "Construction Updates | Al-Ahram Developments",
      "description": "Follow Al-Ahram real estate project progress in Sadat City — monthly photo and video updates for Zone 21, Zone 22, Zone 29, and Al-Rawda district projects.",
      "keywords": "Al-Ahram construction updates, project progress photos, Zone 21 construction, Sadat City building updates, Al-Rawda project progress, units under construction Sadat City, ready-to-deliver units Sadat City"
    },
    "sadatGuide": {
      "title": "Complete Sadat City Guide | Al-Ahram Developments",
      "description": "Your complete guide to Sadat City — location, distance from Cairo, services and amenities, best residential zones, and real estate prices 2026.",
      "keywords": "Sadat City guide, Sadat City distance from Cairo, Sadat City services, Sadat City residential zones, Sadat City real estate prices 2026, Golden Zone Sadat City, living in Sadat City, Sadat City Menoufia"
    },
    "sadatMaps": {
      "title": "Sadat City Maps",
      "description": "Download PDF maps for all Sadat City zones: Zone 21, 22, 24, 25, 26, 27, 28, 29, 31–36, Al-Mutamayiz, Al-Rawda, Al-Rihan, Al-Zaytoun, Al-Firdaws, Al-Nakhil. Your complete guide to residential and investment locations.",
      "keywords": "Sadat City zone maps, Zone 21 map Sadat City, Zone 22 map, Zone 29 map, Sadat City PDF maps download, Al-Mutamayiz district map, Sadat City districts, Zone 35 map, Al-Rawda map, Sadat City real estate zones"
    },
    "investors": {
      "title": "Real Estate Investment Opportunities | Al-Ahram Developments",
      "description": "Invest in Sadat City with Al-Ahram — up to 33% annual return, competitive prices, and projects in the highest-demand zones. Start your investment today.",
      "keywords": "real estate investment Sadat City, 33% annual return, best real estate investment Egypt 2025, buy property for investment installments, Golden Zone investment, Sadat City property for sale"
    }
  },
  "newsletter": {
    "title": "Newsletter",
    "description": "Subscribe to get the latest offers and project updates",
    "placeholder": "Your email address",
    "subscribe": "Subscribe",
    "success": "Thanks for subscribing! We'll send you the latest news and offers.",
    "error": "Something went wrong. Please try again."
  },
  "errors": {
    "unexpected": "An unexpected error occurred",
    "noConnection": "Cannot connect to the server",
    "badRequest": "Invalid request",
    "forbidden": "Access denied",
    "notFound": "Resource not found",
    "serverError": "Internal server error"
  },
  "calculator": {
    "sectionTitle": "Installment Calculator",
    "title": "Calculate Monthly Payment",
    "price": "Unit Price (EGP)",
    "downPayment": "Down Payment",
    "term": "Loan Term",
    "years": "years",
    "interestRate": "Interest Rate",
    "monthlyPayment": "Monthly Payment",
    "downPaymentAmount": "Down Payment Amount",
    "loanAmount": "Loan Amount",
    "totalAmount": "Total Amount",
    "totalInterest": "Total Interest",
    "disclaimer": "* These figures are approximate for guidance purposes only. Contact us for an accurate price quote."
  },
  "privacy": {
    "hero": {
      "eyebrow": "Legal",
      "title": "Privacy Policy",
      "lastUpdated": "Last Updated: January 2025"
    },
    "introduction": {
      "title": "Introduction",
      "content": "Al-Ahram for Development & Real Estate Investment is committed to protecting the privacy of our website visitors and clients. This policy explains how we collect, use, and protect the personal information you provide to us through our website or through direct communication with us."
    },
    "collection": {
      "title": "Information We Collect",
      "content": "We collect information that you voluntarily provide when using the contact form on our website, including: full name, phone number, and message. We do not collect any sensitive information such as payment details or national ID numbers through our website."
    },
    "usage": {
      "title": "How We Use Your Information",
      "content": "We use the information we collect for the following purposes: responding to your inquiries about our residential projects, contacting you regarding new offers and projects, improving our services and user experience on our website, and complying with legal and regulatory requirements."
    },
    "security": {
      "title": "Data Security",
      "content": "We take appropriate security measures to protect your personal information from unauthorized access, modification, disclosure, or destruction. However, no method of data transmission over the internet can be guaranteed to be 100% secure, and we do our best to protect your data."
    },
    "cookies": {
      "title": "Cookies",
      "content": "Our website may use cookies to improve your browsing experience and remember your preferences such as language and theme. You can control cookie settings through your browser."
    },
    "rights": {
      "title": "Your Rights",
      "content": "You have the right to access the personal information we hold about you, and to request its correction or deletion. You may also object to the processing of your data or request its restriction. To exercise any of these rights, please contact us using the contact information below."
    },
    "contact": {
      "title": "Contact Us",
      "content": "If you have any questions or concerns about this privacy policy or our data protection practices, please contact us:",
      "emailLabel": "Email: ",
      "phoneLabel": "Phone: "
    }
  },
  "units": {
    "eyebrow": "Browse Available Units",
    "title": "Explore Our Residential Units",
    "subtitle": "Compare areas and prices across all our projects, and find the unit that fits your needs",
    "noResults": "No units match your search, try widening the filters",
    "filters": {
      "maxPrice": "Max Price",
      "rooms": "Rooms",
      "any": "Any"
    },
    "card": {
      "sqm": "sqm",
      "rooms": "rooms",
      "floor": "Floor"
    },
    "status": {
      "available": "Available",
      "reserved": "Reserved",
      "sold": "Sold"
    },
    "seo": {
      "title": "Available Residential Units",
      "description": "Browse our available residential units in Sadat City with area, price, and room details for each unit",
      "keywords": "residential units Sadat City, apartments for sale, unit prices"
    }
  },
  "chat": {
    "title": "Al-Ahram Smart Assistant",
    "open": "Open smart assistant",
    "close": "Close chat",
    "greeting": "Hi! I'm the Al-Ahram smart assistant 🏛️ Ask me about our projects, areas, prices, or installment plans.",
    "placeholder": "Type your question...",
    "send": "Send",
    "typing": "Typing...",
    "error": "Sorry, something went wrong connecting. Please try again shortly."
  }
}
AHRAM_EOF_25
echo "  wrote: src/assets/i18n/en.json"

echo ""
echo "Done! All 26 files written."
echo ""
echo "Next steps:"
echo "1) Seed the database:"
echo "   TURSO_URL=... TURSO_AUTH_TOKEN=... npx tsx scripts/seed-turso.ts"
echo "2) Set the chat secret (production):"
echo "   wrangler pages secret put ANTHROPIC_API_KEY"
echo "   (or create a .dev.vars file locally with ANTHROPIC_API_KEY=sk-ant-... for ng serve/wrangler dev)"
echo "3) Install deps + build:"
echo "   npm install && npm run build"
