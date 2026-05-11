import { Router, Request } from 'express';
import db, { rowsToObjects, rowToObject } from '../db.js';

const router = Router();

type Lang = 'ar' | 'en';

function getLang(req: Request): Lang {
  return req.query['lang'] === 'en' ? 'en' : 'ar';
}

// ── Zones ──

router.get('/zones', async (req, res) => {
  const lang = getLang(req);
  const result = await db.execute(`
    SELECT z.id, z.slug,
      z.name_${lang} AS name,
      z.description_${lang} AS description,
      z.image_url AS imageUrl,
      z.sort_order AS sortOrder,
      (SELECT COUNT(*) FROM projects p WHERE p.zone_id = z.id) AS projectCount
    FROM zones z
    ORDER BY z.sort_order
  `);
  res.json({ success: true, data: rowsToObjects(result) });
});

router.get('/zones/:slug', async (req, res) => {
  const lang = getLang(req);
  const zoneResult = await db.execute({
    sql: `
      SELECT z.id, z.slug,
        z.name_${lang} AS name,
        z.description_${lang} AS description,
        z.image_url AS imageUrl,
        z.sort_order AS sortOrder
      FROM zones z WHERE z.slug = ?
    `,
    args: [req.params['slug']],
  });

  const zone = rowToObject(zoneResult);
  if (!zone) {
    res.status(404).json({ success: false, error: 'Zone not found' });
    return;
  }

  const projectsResult = await db.execute({
    sql: `
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
      WHERE p.zone_id = ?
      ORDER BY p.sort_order
    `,
    args: [zone['id'] as number],
  });

  res.json({ success: true, data: { ...zone, projects: rowsToObjects(projectsResult) } });
});

// ── Projects ──

router.get('/projects', async (req, res) => {
  const lang = getLang(req);
  const featured = req.query['featured'];
  const zoneSlug = req.query['zone'] as string | undefined;

  let whereClause = '1=1';
  const args: (string | number)[] = [];

  if (featured === 'true') whereClause += ' AND p.is_featured = 1';
  if (zoneSlug) {
    whereClause += ' AND z.slug = ?';
    args.push(zoneSlug);
  }

  const result = await db.execute({
    sql: `
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
    args,
  });

  res.json({ success: true, data: rowsToObjects(result) });
});

router.get('/projects/:slug', async (req, res) => {
  const lang = getLang(req);
  const projectResult = await db.execute({
    sql: `
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
    args: [req.params['slug']],
  });

  const project = rowToObject(projectResult);
  if (!project) {
    res.status(404).json({ success: false, error: 'Project not found' });
    return;
  }

  const galleryResult = await db.execute({
    sql: `
      SELECT g.id, g.image_url AS imageUrl,
        g.caption_${lang} AS caption,
        g.sort_order AS sortOrder,
        g.media_type AS mediaType
      FROM gallery_images g WHERE g.project_id = ?
      ORDER BY g.sort_order
    `,
    args: [project['id'] as number],
  });

  res.json({ success: true, data: { ...project, gallery: rowsToObjects(galleryResult) } });
});

// ── Gallery (public) ──

router.get('/gallery', async (req, res) => {
  const lang = getLang(req);
  const projectSlug = req.query['project'] as string | undefined;

  const slugFilter = projectSlug ? 'AND p.slug = ?' : '';
  const args: string[] = projectSlug ? [projectSlug, projectSlug] : [];

  const result = await db.execute({
    sql: `
      SELECT p.id * 1000 AS id,
        p.image_url AS imageUrl,
        p.name_${lang} AS caption,
        0 AS sortOrder,
        'image' AS mediaType,
        p.slug AS projectSlug,
        p.name_${lang} AS projectName,
        'project' AS imageSource
      FROM projects p
      WHERE p.image_url != '' ${slugFilter}

      UNION ALL

      SELECT g.id, g.image_url AS imageUrl,
        g.caption_${lang} AS caption,
        g.sort_order AS sortOrder,
        g.media_type AS mediaType,
        p.slug AS projectSlug,
        p.name_${lang} AS projectName,
        'gallery' AS imageSource
      FROM gallery_images g
      JOIN projects p ON p.id = g.project_id
      WHERE 1=1 ${slugFilter}

      ORDER BY projectSlug, sortOrder
    `,
    args,
  });

  res.json({ success: true, data: rowsToObjects(result) });
});

export default router;
