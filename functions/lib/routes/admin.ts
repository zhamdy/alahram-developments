import { Hono } from 'hono';
import type { Env } from '../../api/[[route]]';
import { getDb } from '../db';
import { requireAuth } from '../middleware/auth';
import { requireRole } from '../middleware/auth';

export const adminRoutes = new Hono<{ Bindings: Env }>();

// All admin routes require auth + admin/editor role
adminRoutes.use('*', requireAuth, requireRole('admin', 'editor'));

// ── Dashboard ──

adminRoutes.get('/dashboard', async (c) => {
  const db = getDb(c.env);

  const [projectCount, contactCount, unreadContacts, subscriberCount, zoneCount, galleryCount] = await Promise.all([
    db.execute('SELECT COUNT(*) as count FROM projects'),
    db.execute('SELECT COUNT(*) as count FROM contacts'),
    db.execute('SELECT COUNT(*) as count FROM contacts WHERE is_read = 0'),
    db.execute('SELECT COUNT(*) as count FROM subscribers'),
    db.execute('SELECT COUNT(*) as count FROM zones'),
    db.execute('SELECT COUNT(*) as count FROM gallery_images'),
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

// ── Subscribers ──

// GET /api/admin/subscribers
adminRoutes.get('/subscribers', async (c) => {
  const db = getDb(c.env);
  const result = await db.execute(
    'SELECT id, email, subscribed_at AS subscribedAt FROM subscribers ORDER BY subscribed_at DESC',
  );
  return c.json({ success: true, data: result.rows });
});
