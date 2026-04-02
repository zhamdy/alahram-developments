import { Router } from 'express';
import multer from 'multer';
import { existsSync, mkdirSync, renameSync, unlinkSync } from 'node:fs';
import { join, extname } from 'node:path';
import db from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

// Apply auth to all admin routes
router.use(requireAuth, requireRole('admin', 'editor'));

// ── Multer setup ──
const uploadsDir = join(process.cwd(), 'data/uploads');
const projectsUploadDir = join(uploadsDir, 'projects');
const galleryUploadDir = join(uploadsDir, 'gallery');

for (const dir of [uploadsDir, projectsUploadDir, galleryUploadDir]) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, uploadsDir);
  },
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
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB (videos can be large)
  fileFilter(_req, file, cb) {
    const ext = extname(file.originalname).toLowerCase();
    cb(null, allowedExts.includes(ext));
  },
});

// ── Dashboard ──

// GET /api/admin/dashboard
router.get('/dashboard', (_req, res) => {
  const projectCount = (db.prepare('SELECT COUNT(*) as count FROM projects').get() as { count: number }).count;
  const contactCount = (db.prepare('SELECT COUNT(*) as count FROM contacts').get() as { count: number }).count;
  const unreadContacts = (db.prepare('SELECT COUNT(*) as count FROM contacts WHERE is_read = 0').get() as { count: number }).count;
  const subscriberCount = (db.prepare('SELECT COUNT(*) as count FROM subscribers').get() as { count: number }).count;
  const zoneCount = (db.prepare('SELECT COUNT(*) as count FROM zones').get() as { count: number }).count;
  const galleryCount = (db.prepare('SELECT COUNT(*) as count FROM gallery_images').get() as { count: number }).count;

  res.json({
    success: true,
    data: { projectCount, contactCount, unreadContacts, subscriberCount, zoneCount, galleryCount },
  });
});

// ── Projects CRUD ──

// GET /api/admin/projects
router.get('/projects', (req, res) => {
  const page = Math.max(1, parseInt(req.query['page'] as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query['limit'] as string) || 25));
  const offset = (page - 1) * limit;

  const total = (db.prepare('SELECT COUNT(*) as count FROM projects').get() as { count: number }).count;

  const projects = db.prepare(`
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
  `).all(limit, offset);

  res.json({
    success: true,
    data: projects,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  });
});

// GET /api/admin/projects/:id
router.get('/projects/:id', (req, res) => {
  const project = db.prepare(`
    SELECT p.*, z.slug AS zoneSlug, z.name_ar AS zoneNameAr, z.name_en AS zoneNameEn
    FROM projects p
    JOIN zones z ON z.id = p.zone_id
    WHERE p.id = ?
  `).get(req.params['id']);

  if (!project) {
    res.status(404).json({ success: false, error: 'Project not found' });
    return;
  }

  const gallery = db.prepare('SELECT * FROM gallery_images WHERE project_id = ? ORDER BY sort_order').all(req.params['id']);

  res.json({ success: true, data: { ...(project as object), gallery } });
});

// POST /api/admin/projects
router.post('/projects', (req, res) => {
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
    const result = db.prepare(`
      INSERT INTO projects (slug, zone_id, name_ar, name_en, description_ar, description_en,
        status_description_ar, status_description_en, location_ar, location_en,
        status_ar, status_en, image_url, progress, map_embed_url,
        is_featured, sort_order, last_updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      slug, zoneId, nameAr, nameEn,
      descriptionAr || '', descriptionEn || '',
      statusDescriptionAr || '', statusDescriptionEn || '',
      locationAr || '', locationEn || '',
      statusAr || '', statusEn || '',
      imageUrl || '', progress || 0, mapEmbedUrl || '',
      isFeatured ? 1 : 0, sortOrder || 0, lastUpdatedAt || new Date().toISOString().split('T')[0],
    );

    res.status(201).json({ success: true, data: { id: result.lastInsertRowid } });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    if (message.includes('UNIQUE')) {
      res.status(409).json({ success: false, error: 'A project with this slug already exists' });
    } else {
      res.status(500).json({ success: false, error: message });
    }
  }
});

// PUT /api/admin/projects/:id
router.put('/projects/:id', (req, res) => {
  const existing = db.prepare('SELECT id FROM projects WHERE id = ?').get(req.params['id']);
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
    db.prepare(`
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
    `).run(
      slug ?? null, zoneId ?? null, nameAr ?? null, nameEn ?? null,
      descriptionAr ?? null, descriptionEn ?? null,
      statusDescriptionAr ?? null, statusDescriptionEn ?? null,
      locationAr ?? null, locationEn ?? null,
      statusAr ?? null, statusEn ?? null,
      imageUrl ?? null, progress ?? null, mapEmbedUrl ?? null,
      isFeatured !== undefined ? (isFeatured ? 1 : 0) : null,
      sortOrder ?? null, lastUpdatedAt ?? null,
      req.params['id'],
    );

    res.json({ success: true, data: { id: req.params['id'] } });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ success: false, error: message });
  }
});

// DELETE /api/admin/projects/:id
router.delete('/projects/:id', (req, res) => {
  const result = db.prepare('DELETE FROM projects WHERE id = ?').run(req.params['id']);
  if (result.changes === 0) {
    res.status(404).json({ success: false, error: 'Project not found' });
    return;
  }
  res.json({ success: true, data: null });
});

// POST /api/admin/projects/:id/image — upload hero image
router.post('/projects/:id/image', upload.single('image'), (req, res) => {
  if (!req.file) {
    res.status(400).json({ success: false, error: 'No image file provided' });
    return;
  }

  const project = db.prepare('SELECT id, image_url FROM projects WHERE id = ?').get(req.params['id']) as
    | { id: number; image_url: string }
    | undefined;

  if (!project) {
    res.status(404).json({ success: false, error: 'Project not found' });
    return;
  }

  // Move file to projects subdir
  const destPath = join(projectsUploadDir, req.file.filename);
  renameSync(req.file.path, destPath);

  const imageUrl = `uploads/projects/${req.file.filename}`;
  db.prepare('UPDATE projects SET image_url = ? WHERE id = ?').run(imageUrl, project.id);

  res.json({ success: true, data: { imageUrl } });
});

// ── Zones CRUD ──

const zonesUploadDir = join(uploadsDir, 'zones');
if (!existsSync(zonesUploadDir)) mkdirSync(zonesUploadDir, { recursive: true });

// GET /api/admin/zones
router.get('/zones', (_req, res) => {
  const zones = db.prepare(`
    SELECT z.id, z.slug, z.name_ar AS nameAr, z.name_en AS nameEn,
      z.description_ar AS descriptionAr, z.description_en AS descriptionEn,
      z.image_url AS imageUrl, z.sort_order AS sortOrder,
      (SELECT COUNT(*) FROM projects p WHERE p.zone_id = z.id) AS projectCount
    FROM zones z ORDER BY z.sort_order
  `).all();
  res.json({ success: true, data: zones });
});

// GET /api/admin/zones/:id
router.get('/zones/:id', (req, res) => {
  const zone = db.prepare(`
    SELECT z.id, z.slug, z.name_ar AS nameAr, z.name_en AS nameEn,
      z.description_ar AS descriptionAr, z.description_en AS descriptionEn,
      z.image_url AS imageUrl, z.sort_order AS sortOrder
    FROM zones z WHERE z.id = ?
  `).get(req.params['id']);

  if (!zone) {
    res.status(404).json({ success: false, error: 'Zone not found' });
    return;
  }
  res.json({ success: true, data: zone });
});

// POST /api/admin/zones
router.post('/zones', (req, res) => {
  const { slug, nameAr, nameEn, descriptionAr, descriptionEn, sortOrder } = req.body;

  if (!slug || !nameAr || !nameEn) {
    res.status(400).json({ success: false, error: 'slug, nameAr, and nameEn are required' });
    return;
  }

  try {
    const result = db.prepare(`
      INSERT INTO zones (slug, name_ar, name_en, description_ar, description_en, sort_order)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(slug, nameAr, nameEn, descriptionAr || '', descriptionEn || '', sortOrder || 0);

    res.status(201).json({ success: true, data: { id: result.lastInsertRowid } });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    if (message.includes('UNIQUE')) {
      res.status(409).json({ success: false, error: 'A zone with this slug already exists' });
    } else {
      res.status(500).json({ success: false, error: message });
    }
  }
});

// PUT /api/admin/zones/:id
router.put('/zones/:id', (req, res) => {
  const existing = db.prepare('SELECT id FROM zones WHERE id = ?').get(req.params['id']);
  if (!existing) {
    res.status(404).json({ success: false, error: 'Zone not found' });
    return;
  }

  const { slug, nameAr, nameEn, descriptionAr, descriptionEn, sortOrder } = req.body;

  try {
    db.prepare(`
      UPDATE zones SET
        slug = COALESCE(?, slug), name_ar = COALESCE(?, name_ar), name_en = COALESCE(?, name_en),
        description_ar = COALESCE(?, description_ar), description_en = COALESCE(?, description_en),
        sort_order = COALESCE(?, sort_order)
      WHERE id = ?
    `).run(slug ?? null, nameAr ?? null, nameEn ?? null, descriptionAr ?? null, descriptionEn ?? null, sortOrder ?? null, req.params['id']);

    res.json({ success: true, data: { id: req.params['id'] } });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ success: false, error: message });
  }
});

// DELETE /api/admin/zones/:id
router.delete('/zones/:id', (req, res) => {
  const result = db.prepare('DELETE FROM zones WHERE id = ?').run(req.params['id']);
  if (result.changes === 0) {
    res.status(404).json({ success: false, error: 'Zone not found' });
    return;
  }
  res.json({ success: true, data: null });
});

// POST /api/admin/zones/:id/image — upload zone image
router.post('/zones/:id/image', upload.single('image'), (req, res) => {
  if (!req.file) {
    res.status(400).json({ success: false, error: 'No image file provided' });
    return;
  }

  const zone = db.prepare('SELECT id FROM zones WHERE id = ?').get(req.params['id']);
  if (!zone) {
    res.status(404).json({ success: false, error: 'Zone not found' });
    return;
  }

  const destPath = join(zonesUploadDir, req.file.filename);
  renameSync(req.file.path, destPath);

  const imageUrl = `uploads/zones/${req.file.filename}`;
  db.prepare('UPDATE zones SET image_url = ? WHERE id = ?').run(imageUrl, req.params['id']);

  res.json({ success: true, data: { imageUrl } });
});

// ── Gallery CRUD ──

// GET /api/admin/gallery
router.get('/gallery', (req, res) => {
  const projectId = req.query['projectId'] as string | undefined;
  let whereClause = '1=1';
  const params: unknown[] = [];

  if (projectId) {
    whereClause += ' AND g.project_id = ?';
    params.push(projectId);
  }

  const images = db.prepare(`
    SELECT g.id, g.project_id AS projectId, g.image_url AS imageUrl,
      g.caption_ar AS captionAr, g.caption_en AS captionEn,
      g.sort_order AS sortOrder, g.media_type AS mediaType, g.created_at AS createdAt,
      p.name_ar AS projectNameAr, p.name_en AS projectNameEn, p.slug AS projectSlug
    FROM gallery_images g
    JOIN projects p ON p.id = g.project_id
    WHERE ${whereClause}
    ORDER BY g.project_id, g.sort_order
  `).all(...params);

  res.json({ success: true, data: images });
});

// POST /api/admin/gallery — upload gallery image/video
router.post('/gallery', upload.single('image'), (req, res) => {
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
  const isVideo = allowedVideoExts.includes(ext);
  const mediaType = isVideo ? 'video' : 'image';

  // Move file to gallery subdir
  const destPath = join(galleryUploadDir, req.file.filename);
  renameSync(req.file.path, destPath);

  const imageUrl = `uploads/gallery/${req.file.filename}`;

  const result = db.prepare(`
    INSERT INTO gallery_images (project_id, image_url, caption_ar, caption_en, sort_order, media_type)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(projectId, imageUrl, captionAr || '', captionEn || '', sortOrder || 0, mediaType);

  res.status(201).json({ success: true, data: { id: result.lastInsertRowid, imageUrl, mediaType } });
});

// PUT /api/admin/gallery/:id
router.put('/gallery/:id', (req, res) => {
  const { captionAr, captionEn, sortOrder } = req.body;

  const result = db.prepare(`
    UPDATE gallery_images SET
      caption_ar = COALESCE(?, caption_ar),
      caption_en = COALESCE(?, caption_en),
      sort_order = COALESCE(?, sort_order)
    WHERE id = ?
  `).run(captionAr ?? null, captionEn ?? null, sortOrder ?? null, req.params['id']);

  if (result.changes === 0) {
    res.status(404).json({ success: false, error: 'Gallery image not found' });
    return;
  }
  res.json({ success: true, data: { id: req.params['id'] } });
});

// DELETE /api/admin/gallery/:id
router.delete('/gallery/:id', (req, res) => {
  const image = db.prepare('SELECT image_url FROM gallery_images WHERE id = ?').get(req.params['id']) as
    | { image_url: string }
    | undefined;

  if (!image) {
    res.status(404).json({ success: false, error: 'Gallery image not found' });
    return;
  }

  db.prepare('DELETE FROM gallery_images WHERE id = ?').run(req.params['id']);

  // Try to delete the file if it's an upload
  if (image.image_url.startsWith('uploads/')) {
    const filePath = join(process.cwd(), 'data', image.image_url);
    try { unlinkSync(filePath); } catch { /* file may not exist */ }
  }

  res.json({ success: true, data: null });
});

// ── Contacts ──

// GET /api/admin/contacts
router.get('/contacts', (req, res) => {
  const page = Math.max(1, parseInt(req.query['page'] as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query['limit'] as string) || 25));
  const offset = (page - 1) * limit;

  const total = (db.prepare('SELECT COUNT(*) as count FROM contacts').get() as { count: number }).count;

  const contacts = db.prepare(`
    SELECT id, name, phone, message, is_read AS isRead, submitted_at AS submittedAt
    FROM contacts
    ORDER BY submitted_at DESC
    LIMIT ? OFFSET ?
  `).all(limit, offset);

  res.json({
    success: true,
    data: contacts,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  });
});

// PUT /api/admin/contacts/:id/read
router.put('/contacts/:id/read', (req, res) => {
  const result = db.prepare('UPDATE contacts SET is_read = 1 WHERE id = ?').run(req.params['id']);
  if (result.changes === 0) {
    res.status(404).json({ success: false, error: 'Contact not found' });
    return;
  }
  res.json({ success: true, data: null });
});

// DELETE /api/admin/contacts/:id
router.delete('/contacts/:id', (req, res) => {
  const result = db.prepare('DELETE FROM contacts WHERE id = ?').run(req.params['id']);
  if (result.changes === 0) {
    res.status(404).json({ success: false, error: 'Contact not found' });
    return;
  }
  res.json({ success: true, data: null });
});

// ── Subscribers ──

// GET /api/admin/subscribers
router.get('/subscribers', (_req, res) => {
  const subscribers = db.prepare('SELECT id, email, subscribed_at AS subscribedAt FROM subscribers ORDER BY subscribed_at DESC').all();
  res.json({ success: true, data: subscribers });
});

export default router;
