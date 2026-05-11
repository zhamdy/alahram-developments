import { Router } from 'express';
import multer from 'multer';
import { existsSync, mkdirSync, renameSync, unlinkSync } from 'node:fs';
import { join, extname } from 'node:path';
import db, { rowsToObjects, rowToObject } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth, requireRole('admin', 'editor'));

// ── Multer setup ──
const dataDir = process.env['DATA_DIR'] ?? join(process.cwd(), 'data');
const uploadsDir = join(dataDir, 'uploads');
const projectsUploadDir = join(uploadsDir, 'projects');
const galleryUploadDir = join(uploadsDir, 'gallery');

for (const dir of [uploadsDir, projectsUploadDir, galleryUploadDir]) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

const storage = multer.diskStorage({
  destination(_req, _file, cb) { cb(null, uploadsDir); },
  filename(_req, file, cb) {
    const ext = extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`);
  },
});

const allowedImageExts = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
const allowedVideoExts = ['.mp4', '.webm', '.mov'];
const allowedExts = [...allowedImageExts, ...allowedVideoExts];

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    cb(null, allowedExts.includes(extname(file.originalname).toLowerCase()));
  },
});

// ── Dashboard ──

router.get('/dashboard', async (_req, res) => {
  const [projectCount, contactCount, unreadContacts, subscriberCount, zoneCount, galleryCount] = await Promise.all([
    db.execute('SELECT COUNT(*) as count FROM projects'),
    db.execute('SELECT COUNT(*) as count FROM contacts'),
    db.execute('SELECT COUNT(*) as count FROM contacts WHERE is_read = 0'),
    db.execute('SELECT COUNT(*) as count FROM subscribers'),
    db.execute('SELECT COUNT(*) as count FROM zones'),
    db.execute('SELECT COUNT(*) as count FROM gallery_images'),
  ]);

  res.json({
    success: true,
    data: {
      projectCount: projectCount.rows[0][0],
      contactCount: contactCount.rows[0][0],
      unreadContacts: unreadContacts.rows[0][0],
      subscriberCount: subscriberCount.rows[0][0],
      zoneCount: zoneCount.rows[0][0],
      galleryCount: galleryCount.rows[0][0],
    },
  });
});

// ── Projects CRUD ──

router.get('/projects', async (req, res) => {
  const page = Math.max(1, parseInt(req.query['page'] as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query['limit'] as string) || 25));
  const offset = (page - 1) * limit;

  const [totalResult, projectsResult] = await Promise.all([
    db.execute('SELECT COUNT(*) as count FROM projects'),
    db.execute({
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
    }),
  ]);

  const total = Number(totalResult.rows[0][0]);
  res.json({
    success: true,
    data: rowsToObjects(projectsResult),
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  });
});

router.get('/projects/:id', async (req, res) => {
  const [projectResult, galleryResult] = await Promise.all([
    db.execute({
      sql: `
        SELECT p.*, z.slug AS zoneSlug, z.name_ar AS zoneNameAr, z.name_en AS zoneNameEn
        FROM projects p
        JOIN zones z ON z.id = p.zone_id
        WHERE p.id = ?
      `,
      args: [req.params['id']],
    }),
    db.execute({
      sql: 'SELECT * FROM gallery_images WHERE project_id = ? ORDER BY sort_order',
      args: [req.params['id']],
    }),
  ]);

  const project = rowToObject(projectResult);
  if (!project) {
    res.status(404).json({ success: false, error: 'Project not found' });
    return;
  }

  res.json({ success: true, data: { ...project, gallery: rowsToObjects(galleryResult) } });
});

router.post('/projects', async (req, res) => {
  const {
    slug, zoneId, nameAr, nameEn, descriptionAr, descriptionEn,
    statusDescriptionAr, statusDescriptionEn, locationAr, locationEn,
    statusAr, statusEn, imageUrl, progress, mapEmbedUrl,
    isFeatured, sortOrder, lastUpdatedAt,
  } = req.body;

  if (!slug || !zoneId || !nameAr || !nameEn) {
    res.status(400).json({ success: false, error: 'slug, zoneId, nameAr, and nameEn are required' });
    return;
  }

  try {
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
    res.status(201).json({ success: true, data: { id: Number(result.lastInsertRowid) } });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    if (message.includes('UNIQUE')) {
      res.status(409).json({ success: false, error: 'A project with this slug already exists' });
    } else {
      res.status(500).json({ success: false, error: message });
    }
  }
});

router.put('/projects/:id', async (req, res) => {
  const existing = rowToObject(await db.execute({ sql: 'SELECT id FROM projects WHERE id = ?', args: [req.params['id']] }));
  if (!existing) {
    res.status(404).json({ success: false, error: 'Project not found' });
    return;
  }

  const {
    slug, zoneId, nameAr, nameEn, descriptionAr, descriptionEn,
    statusDescriptionAr, statusDescriptionEn, locationAr, locationEn,
    statusAr, statusEn, imageUrl, progress, mapEmbedUrl,
    isFeatured, sortOrder, lastUpdatedAt,
  } = req.body;

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
        req.params['id'],
      ],
    });
    res.json({ success: true, data: { id: req.params['id'] } });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ success: false, error: message });
  }
});

router.delete('/projects/:id', async (req, res) => {
  const result = await db.execute({ sql: 'DELETE FROM projects WHERE id = ?', args: [req.params['id']] });
  if (result.rowsAffected === 0) {
    res.status(404).json({ success: false, error: 'Project not found' });
    return;
  }
  res.json({ success: true, data: null });
});

router.post('/projects/:id/image', upload.single('image'), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ success: false, error: 'No image file provided' });
    return;
  }

  const project = rowToObject(await db.execute({ sql: 'SELECT id FROM projects WHERE id = ?', args: [req.params['id']] }));
  if (!project) {
    res.status(404).json({ success: false, error: 'Project not found' });
    return;
  }

  const destPath = join(projectsUploadDir, req.file.filename);
  renameSync(req.file.path, destPath);

  const imageUrl = `uploads/projects/${req.file.filename}`;
  await db.execute({ sql: 'UPDATE projects SET image_url = ? WHERE id = ?', args: [imageUrl, req.params['id']] });

  res.json({ success: true, data: { imageUrl } });
});

// ── Zones CRUD ──

const zonesUploadDir = join(uploadsDir, 'zones');
if (!existsSync(zonesUploadDir)) mkdirSync(zonesUploadDir, { recursive: true });

router.get('/zones', async (_req, res) => {
  const result = await db.execute(`
    SELECT z.id, z.slug, z.name_ar AS nameAr, z.name_en AS nameEn,
      z.description_ar AS descriptionAr, z.description_en AS descriptionEn,
      z.image_url AS imageUrl, z.sort_order AS sortOrder,
      (SELECT COUNT(*) FROM projects p WHERE p.zone_id = z.id) AS projectCount
    FROM zones z ORDER BY z.sort_order
  `);
  res.json({ success: true, data: rowsToObjects(result) });
});

router.get('/zones/:id', async (req, res) => {
  const result = await db.execute({
    sql: `
      SELECT z.id, z.slug, z.name_ar AS nameAr, z.name_en AS nameEn,
        z.description_ar AS descriptionAr, z.description_en AS descriptionEn,
        z.image_url AS imageUrl, z.sort_order AS sortOrder
      FROM zones z WHERE z.id = ?
    `,
    args: [req.params['id']],
  });

  const zone = rowToObject(result);
  if (!zone) {
    res.status(404).json({ success: false, error: 'Zone not found' });
    return;
  }
  res.json({ success: true, data: zone });
});

router.post('/zones', async (req, res) => {
  const { slug, nameAr, nameEn, descriptionAr, descriptionEn, sortOrder } = req.body;

  if (!slug || !nameAr || !nameEn) {
    res.status(400).json({ success: false, error: 'slug, nameAr, and nameEn are required' });
    return;
  }

  try {
    const result = await db.execute({
      sql: 'INSERT INTO zones (slug, name_ar, name_en, description_ar, description_en, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
      args: [slug, nameAr, nameEn, descriptionAr || '', descriptionEn || '', sortOrder || 0],
    });
    res.status(201).json({ success: true, data: { id: Number(result.lastInsertRowid) } });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    if (message.includes('UNIQUE')) {
      res.status(409).json({ success: false, error: 'A zone with this slug already exists' });
    } else {
      res.status(500).json({ success: false, error: message });
    }
  }
});

router.put('/zones/:id', async (req, res) => {
  const existing = rowToObject(await db.execute({ sql: 'SELECT id FROM zones WHERE id = ?', args: [req.params['id']] }));
  if (!existing) {
    res.status(404).json({ success: false, error: 'Zone not found' });
    return;
  }

  const { slug, nameAr, nameEn, descriptionAr, descriptionEn, sortOrder } = req.body;

  try {
    await db.execute({
      sql: `
        UPDATE zones SET
          slug = COALESCE(?, slug), name_ar = COALESCE(?, name_ar), name_en = COALESCE(?, name_en),
          description_ar = COALESCE(?, description_ar), description_en = COALESCE(?, description_en),
          sort_order = COALESCE(?, sort_order)
        WHERE id = ?
      `,
      args: [slug ?? null, nameAr ?? null, nameEn ?? null, descriptionAr ?? null, descriptionEn ?? null, sortOrder ?? null, req.params['id']],
    });
    res.json({ success: true, data: { id: req.params['id'] } });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ success: false, error: message });
  }
});

router.delete('/zones/:id', async (req, res) => {
  const result = await db.execute({ sql: 'DELETE FROM zones WHERE id = ?', args: [req.params['id']] });
  if (result.rowsAffected === 0) {
    res.status(404).json({ success: false, error: 'Zone not found' });
    return;
  }
  res.json({ success: true, data: null });
});

router.post('/zones/:id/image', upload.single('image'), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ success: false, error: 'No image file provided' });
    return;
  }

  const zone = rowToObject(await db.execute({ sql: 'SELECT id FROM zones WHERE id = ?', args: [req.params['id']] }));
  if (!zone) {
    res.status(404).json({ success: false, error: 'Zone not found' });
    return;
  }

  const destPath = join(zonesUploadDir, req.file.filename);
  renameSync(req.file.path, destPath);

  const imageUrl = `uploads/zones/${req.file.filename}`;
  await db.execute({ sql: 'UPDATE zones SET image_url = ? WHERE id = ?', args: [imageUrl, req.params['id']] });

  res.json({ success: true, data: { imageUrl } });
});

// ── Gallery CRUD ──

router.get('/gallery', async (req, res) => {
  const projectId = req.query['projectId'] as string | undefined;
  const args: string[] = [];
  let whereClause = '1=1';

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

  res.json({ success: true, data: rowsToObjects(result) });
});

router.post('/gallery', upload.single('image'), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ success: false, error: 'No file provided' });
    return;
  }

  const { projectId, captionAr, captionEn, sortOrder } = req.body;
  if (!projectId) {
    res.status(400).json({ success: false, error: 'projectId is required' });
    return;
  }

  const ext = extname(req.file.originalname).toLowerCase();
  const mediaType = allowedVideoExts.includes(ext) ? 'video' : 'image';

  const destPath = join(galleryUploadDir, req.file.filename);
  renameSync(req.file.path, destPath);

  const imageUrl = `uploads/gallery/${req.file.filename}`;
  const result = await db.execute({
    sql: 'INSERT INTO gallery_images (project_id, image_url, caption_ar, caption_en, sort_order, media_type) VALUES (?, ?, ?, ?, ?, ?)',
    args: [projectId, imageUrl, captionAr || '', captionEn || '', sortOrder || 0, mediaType],
  });

  res.status(201).json({ success: true, data: { id: Number(result.lastInsertRowid), imageUrl, mediaType } });
});

router.put('/gallery/:id', async (req, res) => {
  const { captionAr, captionEn, sortOrder } = req.body;

  const result = await db.execute({
    sql: `
      UPDATE gallery_images SET
        caption_ar = COALESCE(?, caption_ar),
        caption_en = COALESCE(?, caption_en),
        sort_order = COALESCE(?, sort_order)
      WHERE id = ?
    `,
    args: [captionAr ?? null, captionEn ?? null, sortOrder ?? null, req.params['id']],
  });

  if (result.rowsAffected === 0) {
    res.status(404).json({ success: false, error: 'Gallery image not found' });
    return;
  }
  res.json({ success: true, data: { id: req.params['id'] } });
});

router.delete('/gallery/:id', async (req, res) => {
  const image = rowToObject(await db.execute({ sql: 'SELECT image_url FROM gallery_images WHERE id = ?', args: [req.params['id']] }));

  if (!image) {
    res.status(404).json({ success: false, error: 'Gallery image not found' });
    return;
  }

  await db.execute({ sql: 'DELETE FROM gallery_images WHERE id = ?', args: [req.params['id']] });

  if ((image['image_url'] as string).startsWith('uploads/')) {
    const filePath = join(dataDir, image['image_url'] as string);
    try { unlinkSync(filePath); } catch { /* file may not exist */ }
  }

  res.json({ success: true, data: null });
});

// ── Contacts ──

router.get('/contacts', async (req, res) => {
  const page = Math.max(1, parseInt(req.query['page'] as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query['limit'] as string) || 25));
  const offset = (page - 1) * limit;

  const [totalResult, contactsResult] = await Promise.all([
    db.execute('SELECT COUNT(*) as count FROM contacts'),
    db.execute({
      sql: `
        SELECT id, name, phone, message, is_read AS isRead, submitted_at AS submittedAt
        FROM contacts ORDER BY submitted_at DESC
        LIMIT ? OFFSET ?
      `,
      args: [limit, offset],
    }),
  ]);

  const total = Number(totalResult.rows[0][0]);
  res.json({
    success: true,
    data: rowsToObjects(contactsResult),
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  });
});

router.put('/contacts/:id/read', async (req, res) => {
  const result = await db.execute({ sql: 'UPDATE contacts SET is_read = 1 WHERE id = ?', args: [req.params['id']] });
  if (result.rowsAffected === 0) {
    res.status(404).json({ success: false, error: 'Contact not found' });
    return;
  }
  res.json({ success: true, data: null });
});

router.delete('/contacts/:id', async (req, res) => {
  const result = await db.execute({ sql: 'DELETE FROM contacts WHERE id = ?', args: [req.params['id']] });
  if (result.rowsAffected === 0) {
    res.status(404).json({ success: false, error: 'Contact not found' });
    return;
  }
  res.json({ success: true, data: null });
});

// ── Subscribers ──

router.get('/subscribers', async (_req, res) => {
  const result = await db.execute('SELECT id, email, subscribed_at AS subscribedAt FROM subscribers ORDER BY subscribed_at DESC');
  res.json({ success: true, data: rowsToObjects(result) });
});

export default router;
