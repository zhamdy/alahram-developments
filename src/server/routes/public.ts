import { Router, Request } from 'express';
import db from '../db.js';

const router = Router();

type Lang = 'ar' | 'en';

function getLang(req: Request): Lang {
  const lang = req.query['lang'];
  return lang === 'en' ? 'en' : 'ar';
}

// ── Zones ──

// GET /api/zones
router.get('/zones', (req, res) => {
  const lang = getLang(req);
  const zones = db
    .prepare(
      `
    SELECT z.id, z.slug,
      z.name_${lang} AS name,
      z.description_${lang} AS description,
      z.image_url AS imageUrl,
      z.sort_order AS sortOrder,
      (SELECT COUNT(*) FROM projects p WHERE p.zone_id = z.id) AS projectCount
    FROM zones z
    ORDER BY z.sort_order
  `,
    )
    .all();

  res.json({ success: true, data: zones });
});

// GET /api/zones/:slug
router.get('/zones/:slug', (req, res) => {
  const lang = getLang(req);
  const zone = db
    .prepare(
      `
    SELECT z.id, z.slug,
      z.name_${lang} AS name,
      z.description_${lang} AS description,
      z.image_url AS imageUrl,
      z.sort_order AS sortOrder
    FROM zones z WHERE z.slug = ?
  `,
    )
    .get(req.params['slug']);

  if (!zone) {
    res.status(404).json({ success: false, error: 'Zone not found' });
    return;
  }

  const projects = db
    .prepare(
      `
    SELECT p.id, p.slug, p.zone_id AS zoneId, z.slug AS zoneSlug,
      p.name_${lang} AS name,
      p.description_${lang} AS description,
      p.location_${lang} AS location,
      p.status_${lang} AS status,
      p.image_url AS imageUrl,
      p.progress,
      p.is_featured AS isFeatured,
      p.last_updated_at AS lastUpdatedAt
    FROM projects p
    JOIN zones z ON z.id = p.zone_id
    WHERE p.zone_id = ${(zone as { id: number }).id}
    ORDER BY p.sort_order
  `,
    )
    .all();

  res.json({ success: true, data: { ...zone, projects } });
});

// ── Projects ──

// GET /api/projects
router.get('/projects', (req, res) => {
  const lang = getLang(req);
  const featured = req.query['featured'];
  const zoneSlug = req.query['zone'] as string | undefined;

  let whereClause = '1=1';
  const params: unknown[] = [];

  if (featured === 'true') {
    whereClause += ' AND p.is_featured = 1';
  }
  if (zoneSlug) {
    whereClause += ' AND z.slug = ?';
    params.push(zoneSlug);
  }

  const projects = db
    .prepare(
      `
    SELECT p.id, p.slug, p.zone_id AS zoneId, z.slug AS zoneSlug,
      p.name_${lang} AS name,
      p.description_${lang} AS description,
      p.location_${lang} AS location,
      p.status_${lang} AS status,
      p.image_url AS imageUrl,
      p.progress,
      p.is_featured AS isFeatured,
      p.last_updated_at AS lastUpdatedAt
    FROM projects p
    JOIN zones z ON z.id = p.zone_id
    WHERE ${whereClause}
    ORDER BY p.sort_order
  `,
    )
    .all(...params);

  res.json({ success: true, data: projects });
});

// GET /api/projects/:slug
router.get('/projects/:slug', (req, res) => {
  const lang = getLang(req);
  let project: Record<string, unknown> | undefined;

  try {
    project = db
      .prepare(
        `
      SELECT p.id, p.slug, p.zone_id AS zoneId, z.slug AS zoneSlug,
        p.name_${lang} AS name,
        p.description_${lang} AS description,
        p.status_description_${lang} AS statusDescription,
        p.location_${lang} AS location,
        p.status_${lang} AS status,
        z.name_${lang} AS zoneName,
        p.image_url AS imageUrl,
        p.progress,
        p.map_embed_url AS mapEmbedUrl,
        p.is_featured AS isFeatured,
        p.last_updated_at AS lastUpdatedAt
      FROM projects p
      JOIN zones z ON z.id = p.zone_id
      WHERE p.slug = ?
    `,
      )
      .get(req.params['slug']) as Record<string, unknown> | undefined;
  } catch {
    // Backward-compatible fallback for older schemas missing status_description_* columns.
    project = db
      .prepare(
        `
      SELECT p.id, p.slug, p.zone_id AS zoneId, z.slug AS zoneSlug,
        p.name_${lang} AS name,
        p.description_${lang} AS description,
        p.description_${lang} AS statusDescription,
        p.location_${lang} AS location,
        p.status_${lang} AS status,
        z.name_${lang} AS zoneName,
        p.image_url AS imageUrl,
        p.progress,
        p.map_embed_url AS mapEmbedUrl,
        p.is_featured AS isFeatured,
        p.last_updated_at AS lastUpdatedAt
      FROM projects p
      JOIN zones z ON z.id = p.zone_id
      WHERE p.slug = ?
    `,
      )
      .get(req.params['slug']) as Record<string, unknown> | undefined;
  }

  if (!project) {
    res.status(404).json({ success: false, error: 'Project not found' });
    return;
  }

  const gallery = db
    .prepare(
      `
    SELECT g.id, g.image_url AS imageUrl,
      g.caption_${lang} AS caption,
      g.sort_order AS sortOrder,
      g.media_type AS mediaType
    FROM gallery_images g WHERE g.project_id = ?
    ORDER BY g.sort_order
  `,
    )
    .all(project['id']);

  res.json({ success: true, data: { ...project, gallery } });
});

// ── Gallery (public) ──

// GET /api/gallery
router.get('/gallery', (req, res) => {
  const lang = getLang(req);
  const projectSlug = req.query['project'] as string | undefined;

  let whereClause = '1=1';
  const params: unknown[] = [];

  if (projectSlug) {
    whereClause += ' AND p.slug = ?';
    params.push(projectSlug);
  }

  const images = db
    .prepare(
      `
    SELECT g.id, g.image_url AS imageUrl,
      g.caption_${lang} AS caption,
      g.sort_order AS sortOrder,
      g.media_type AS mediaType,
      p.slug AS projectSlug,
      p.name_${lang} AS projectName
    FROM gallery_images g
    JOIN projects p ON p.id = g.project_id
    WHERE ${whereClause}
    ORDER BY g.sort_order
  `,
    )
    .all(...params);

  res.json({ success: true, data: images });
});

export default router;
