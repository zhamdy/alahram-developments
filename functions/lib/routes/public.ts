import { Hono } from 'hono';
import type { Env } from '../../api/[[route]]';
import { getDb } from '../db';

type Lang = 'ar' | 'en';

function getLang(lang: string | undefined): Lang {
  return lang === 'en' ? 'en' : 'ar';
}

export const publicRoutes = new Hono<{ Bindings: Env }>();

// ── Zones ──

// GET /api/zones
publicRoutes.get('/zones', async (c) => {
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
publicRoutes.get('/zones/:slug', async (c) => {
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
publicRoutes.get('/projects', async (c) => {
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
publicRoutes.get('/projects/:slug', async (c) => {
  const lang = getLang(c.req.query('lang'));
  const db = getDb(c.env);
  const slug = c.req.param('slug');

  const nameCol = lang === 'en' ? 'name_en' : 'name_ar';
  const descCol = lang === 'en' ? 'description_en' : 'description_ar';
  const fullDescCol = lang === 'en' ? 'status_description_en' : 'status_description_ar';
  const locCol = lang === 'en' ? 'location_en' : 'location_ar';
  const statusCol = lang === 'en' ? 'status_en' : 'status_ar';
  const zoneNameCol = lang === 'en' ? 'name_en' : 'name_ar';
  const captionCol = lang === 'en' ? 'caption_en' : 'caption_ar';

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

  const project = projectResult.rows[0];
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
    args: [project.id],
  });

  return c.json({ success: true, data: { ...project, gallery: galleryResult.rows } });
});

// ── Gallery (public) ──

// GET /api/gallery
publicRoutes.get('/gallery', async (c) => {
  const lang = getLang(c.req.query('lang'));
  const db = getDb(c.env);
  const projectSlug = c.req.query('project');

  const captionCol = lang === 'en' ? 'caption_en' : 'caption_ar';
  const pNameCol = lang === 'en' ? 'name_en' : 'name_ar';

  let whereClause = '1=1';
  const args: string[] = [];

  if (projectSlug) {
    whereClause += ' AND p.slug = ?';
    args.push(projectSlug);
  }

  const result = await db.execute({
    sql: `
      SELECT g.id, g.image_url AS imageUrl,
        g.${captionCol} AS caption,
        g.sort_order AS sortOrder,
        g.media_type AS mediaType,
        p.slug AS projectSlug,
        p.${pNameCol} AS projectName
      FROM gallery_images g
      JOIN projects p ON p.id = g.project_id
      WHERE ${whereClause}
      ORDER BY g.sort_order
    `,
    args,
  });

  return c.json({ success: true, data: result.rows });
});

// ── Newsletter ──

// POST /api/newsletter
publicRoutes.post('/newsletter', async (c) => {
  const body = await c.req.json<{ email?: string }>();
  const email = body?.email;

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return c.json({ success: false, message: 'Invalid email' }, 400);
  }

  const db = getDb(c.env);
  const sanitized = email.trim().toLowerCase();

  const existing = await db.execute({ sql: 'SELECT id FROM subscribers WHERE email = ?', args: [sanitized] });
  if (existing.rows.length > 0) {
    return c.json({ success: true, message: 'Already subscribed' });
  }

  await db.execute({ sql: 'INSERT INTO subscribers (email) VALUES (?)', args: [sanitized] });
  return c.json({ success: true, message: 'Subscribed successfully' });
});

// ── Contact ──

// POST /api/contact
publicRoutes.post('/contact', async (c) => {
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
