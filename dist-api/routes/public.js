"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_js_1 = __importDefault(require("../db.js"));
const router = (0, express_1.Router)();
function getLang(req) {
    const lang = req.query['lang'];
    return lang === 'en' ? 'en' : 'ar';
}
// ── Zones ──
// GET /api/zones
router.get('/zones', (req, res) => {
    const lang = getLang(req);
    const zones = db_js_1.default.prepare(`
    SELECT z.id, z.slug,
      z.name_${lang} AS name,
      z.description_${lang} AS description,
      z.image_url AS imageUrl,
      z.sort_order AS sortOrder,
      (SELECT COUNT(*) FROM projects p WHERE p.zone_id = z.id) AS projectCount
    FROM zones z
    ORDER BY z.sort_order
  `).all();
    res.json({ success: true, data: zones });
});
// GET /api/zones/:slug
router.get('/zones/:slug', (req, res) => {
    const lang = getLang(req);
    const zone = db_js_1.default.prepare(`
    SELECT z.id, z.slug,
      z.name_${lang} AS name,
      z.description_${lang} AS description,
      z.image_url AS imageUrl,
      z.sort_order AS sortOrder
    FROM zones z WHERE z.slug = ?
  `).get(req.params['slug']);
    if (!zone) {
        res.status(404).json({ success: false, error: 'Zone not found' });
        return;
    }
    const projects = db_js_1.default.prepare(`
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
    WHERE p.zone_id = ${zone.id}
    ORDER BY p.sort_order
  `).all();
    res.json({ success: true, data: { ...zone, projects } });
});
// ── Projects ──
// GET /api/projects
router.get('/projects', (req, res) => {
    const lang = getLang(req);
    const featured = req.query['featured'];
    const zoneSlug = req.query['zone'];
    let whereClause = '1=1';
    const params = [];
    if (featured === 'true') {
        whereClause += ' AND p.is_featured = 1';
    }
    if (zoneSlug) {
        whereClause += ' AND z.slug = ?';
        params.push(zoneSlug);
    }
    const projects = db_js_1.default.prepare(`
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
  `).all(...params);
    res.json({ success: true, data: projects });
});
// GET /api/projects/:slug
router.get('/projects/:slug', (req, res) => {
    const lang = getLang(req);
    const project = db_js_1.default.prepare(`
    SELECT p.id, p.slug, p.zone_id AS zoneId, z.slug AS zoneSlug,
      p.name_${lang} AS name,
      p.description_${lang} AS description,
      p.full_description_${lang} AS fullDescription,
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
  `).get(req.params['slug']);
    if (!project) {
        res.status(404).json({ success: false, error: 'Project not found' });
        return;
    }
    const gallery = db_js_1.default.prepare(`
    SELECT g.id, g.image_url AS imageUrl,
      g.caption_${lang} AS caption,
      g.sort_order AS sortOrder
    FROM gallery_images g WHERE g.project_id = ?
    ORDER BY g.sort_order
  `).all(project.id);
    res.json({ success: true, data: { ...project, gallery } });
});
// ── Gallery (public) ──
// GET /api/gallery
router.get('/gallery', (req, res) => {
    const lang = getLang(req);
    const projectSlug = req.query['project'];
    let whereClause = '1=1';
    const params = [];
    if (projectSlug) {
        whereClause += ' AND p.slug = ?';
        params.push(projectSlug);
    }
    const images = db_js_1.default.prepare(`
    SELECT g.id, g.image_url AS imageUrl,
      g.caption_${lang} AS caption,
      g.sort_order AS sortOrder,
      p.slug AS projectSlug,
      p.name_${lang} AS projectName
    FROM gallery_images g
    JOIN projects p ON p.id = g.project_id
    WHERE ${whereClause}
    ORDER BY g.sort_order
  `).all(...params);
    res.json({ success: true, data: images });
});
exports.default = router;
