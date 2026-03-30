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
  { slug: 'zone-7-strip', nameKey: 'zones.zone7Strip.name', descKey: 'zones.zone7Strip.description', imageUrl: 'assets/images/projects/zone-7-strip.jpg', sortOrder: 1 },
  { slug: 'zone-7-homeland', nameKey: 'zones.zone7Homeland.name', descKey: 'zones.zone7Homeland.description', imageUrl: 'assets/images/projects/zone-7-homeland.jpg', sortOrder: 2 },
  { slug: 'zone-14', nameKey: 'zones.zone14.name', descKey: 'zones.zone14.description', imageUrl: 'assets/images/projects/zone-14.jpg', sortOrder: 3 },
  { slug: 'zone-21', nameKey: 'zones.zone21.name', descKey: 'zones.zone21.description', imageUrl: 'assets/images/projects/zone-21.jpg', sortOrder: 4 },
  { slug: 'zone-22', nameKey: 'zones.zone22.name', descKey: 'zones.zone22.description', imageUrl: 'assets/images/projects/zone-22.jpg', sortOrder: 5 },
  { slug: 'zone-29', nameKey: 'zones.zone29.name', descKey: 'zones.zone29.description', imageUrl: 'assets/images/projects/zone-29.jpg', sortOrder: 6 },
  { slug: 'al-rawda', nameKey: 'zones.alRawda.name', descKey: 'zones.alRawda.description', imageUrl: 'assets/images/projects/al-rawda.jpg', sortOrder: 7 },
  { slug: 'zone-35', nameKey: 'zones.zone35.name', descKey: 'zones.zone35.description', imageUrl: 'assets/images/projects/zone-35.jpg', sortOrder: 8 },
];

// ── Project data ──

interface ProjectSeed {
  slug: string;
  zoneSlug: string;
  nameKey: string;
  descKey: string;
  fullDescKey: string;
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
  { slug: 'project-255', zoneSlug: 'zone-7-strip', nameKey: 'projects.project255.name', descKey: 'projects.project255.description', fullDescKey: '', locationKey: 'projects.project255.location', statusKey: 'projects.project255.status', imageUrl: 'assets/images/projects/project-255-hero.jpg', progress: 0, lastUpdatedAt: '2026-03-01', isFeatured: false, mapEmbedUrl: '', galleryImages: [] },
  { slug: 'project-29', zoneSlug: 'zone-7-homeland', nameKey: 'projects.project29.name', descKey: 'projects.project29.description', fullDescKey: '', locationKey: 'projects.project29.location', statusKey: 'projects.project29.status', imageUrl: 'assets/images/projects/project-29-hero.jpg', progress: 0, lastUpdatedAt: '2026-03-01', isFeatured: false, mapEmbedUrl: '', galleryImages: [] },
  { slug: 'project-336', zoneSlug: 'zone-14', nameKey: 'projects.project336.name', descKey: 'projects.project336.description', fullDescKey: '', locationKey: 'projects.project336.location', statusKey: 'projects.project336.status', imageUrl: 'assets/images/projects/project-336-hero.jpg', progress: 100, lastUpdatedAt: '2026-03-01', isFeatured: false, mapEmbedUrl: '', galleryImages: [] },
  { slug: 'project-331', zoneSlug: 'zone-14', nameKey: 'projects.project331.name', descKey: 'projects.project331.description', fullDescKey: '', locationKey: 'projects.project331.location', statusKey: 'projects.project331.status', imageUrl: 'assets/images/projects/project-331-hero.jpg', progress: 100, lastUpdatedAt: '2026-03-01', isFeatured: false, mapEmbedUrl: '', galleryImages: [] },
  { slug: 'project-348', zoneSlug: 'zone-14', nameKey: 'projects.project348.name', descKey: 'projects.project348.description', fullDescKey: '', locationKey: 'projects.project348.location', statusKey: 'projects.project348.status', imageUrl: 'assets/images/projects/project-348-hero.jpg', progress: 40, lastUpdatedAt: '2026-03-01', isFeatured: false, mapEmbedUrl: '', galleryImages: [] },
  { slug: 'mini-compound', zoneSlug: 'zone-21', nameKey: 'projects.miniCompound.name', descKey: 'projects.miniCompound.description', fullDescKey: '', locationKey: 'projects.miniCompound.location', statusKey: 'projects.miniCompound.status', imageUrl: 'assets/images/projects/mini-compound-hero.jpg', progress: 90, lastUpdatedAt: '2026-03-15', isFeatured: false, mapEmbedUrl: '', galleryImages: [] },
  { slug: 'project-629', zoneSlug: 'zone-21', nameKey: 'projects.project629.name', descKey: 'projects.project629.description', fullDescKey: '', locationKey: 'projects.project629.location', statusKey: 'projects.project629.status', imageUrl: 'assets/images/projects/project-629-hero.jpg', progress: 90, lastUpdatedAt: '2026-03-10', isFeatured: false, mapEmbedUrl: '', galleryImages: [] },
  { slug: 'project-584', zoneSlug: 'zone-21', nameKey: 'projects.project584.name', descKey: 'projects.project584.description', fullDescKey: '', locationKey: 'projects.project584.location', statusKey: 'projects.project584.status', imageUrl: 'assets/images/projects/project-584-hero.jpg', progress: 80, lastUpdatedAt: '2026-03-05', isFeatured: false, mapEmbedUrl: '', galleryImages: [] },
  {
    slug: 'project-865', zoneSlug: 'zone-21', nameKey: 'projects.project865.name', descKey: 'projects.project865.description', fullDescKey: 'projects.project865.fullDescription', locationKey: 'projects.project865.location', statusKey: 'projects.project865.status', imageUrl: 'assets/images/projects/project-865-hero.jpg', progress: 70, lastUpdatedAt: '2026-03-01', isFeatured: true,
    mapEmbedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3441.5!2d30.52!3d30.37!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzDCsDIyJzEyLjAiTiAzMMKwMzEnMTIuMCJF!5e0!3m2!1sar!2seg!4v1',
    galleryImages: ['assets/images/projects/project-865-gallery-1.jpg', 'assets/images/projects/project-865-gallery-2.jpg', 'assets/images/projects/project-865-gallery-3.jpg', 'assets/images/projects/project-865-gallery-4.jpg'],
  },
  {
    slug: 'project-868', zoneSlug: 'zone-21', nameKey: 'projects.project868.name', descKey: 'projects.project868.description', fullDescKey: 'projects.project868.fullDescription', locationKey: 'projects.project868.location', statusKey: 'projects.project868.status', imageUrl: 'assets/images/projects/project-868-hero.jpg', progress: 70, lastUpdatedAt: '2026-02-15', isFeatured: true,
    mapEmbedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3441.5!2d30.52!3d30.37!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzDCsDIyJzE4LjAiTiAzMMKwMzEnMTguMCJF!5e0!3m2!1sar!2seg!4v2',
    galleryImages: ['assets/images/projects/project-868-gallery-1.jpg', 'assets/images/projects/project-868-gallery-2.jpg', 'assets/images/projects/project-868-gallery-3.jpg', 'assets/images/projects/project-868-gallery-4.jpg'],
  },
  { slug: 'project-947', zoneSlug: 'zone-21', nameKey: 'projects.project947.name', descKey: 'projects.project947.description', fullDescKey: '', locationKey: 'projects.project947.location', statusKey: 'projects.project947.status', imageUrl: 'assets/images/projects/project-947-hero.jpg', progress: 50, lastUpdatedAt: '2026-03-01', isFeatured: false, mapEmbedUrl: '', galleryImages: [] },
  { slug: 'project-791', zoneSlug: 'zone-21', nameKey: 'projects.project791.name', descKey: 'projects.project791.description', fullDescKey: '', locationKey: 'projects.project791.location', statusKey: 'projects.project791.status', imageUrl: 'assets/images/projects/project-791-hero.jpg', progress: 30, lastUpdatedAt: '2026-02-20', isFeatured: false, mapEmbedUrl: '', galleryImages: [] },
  { slug: 'project-794', zoneSlug: 'zone-21', nameKey: 'projects.project794.name', descKey: 'projects.project794.description', fullDescKey: '', locationKey: 'projects.project794.location', statusKey: 'projects.project794.status', imageUrl: 'assets/images/projects/project-794-hero.jpg', progress: 10, lastUpdatedAt: '2026-02-01', isFeatured: false, mapEmbedUrl: '', galleryImages: [] },
  { slug: 'project-799', zoneSlug: 'zone-21', nameKey: 'projects.project799.name', descKey: 'projects.project799.description', fullDescKey: '', locationKey: 'projects.project799.location', statusKey: 'projects.project799.status', imageUrl: 'assets/images/projects/project-799-hero.jpg', progress: 10, lastUpdatedAt: '2026-02-01', isFeatured: false, mapEmbedUrl: '', galleryImages: [] },
  { slug: 'project-870', zoneSlug: 'zone-21', nameKey: 'projects.project870.name', descKey: 'projects.project870.description', fullDescKey: '', locationKey: 'projects.project870.location', statusKey: 'projects.project870.status', imageUrl: 'assets/images/projects/project-870-hero.jpg', progress: 0, lastUpdatedAt: '2026-03-01', isFeatured: false, mapEmbedUrl: '', galleryImages: [] },
  { slug: 'project-1102', zoneSlug: 'zone-22', nameKey: 'projects.project1102.name', descKey: 'projects.project1102.description', fullDescKey: '', locationKey: 'projects.project1102.location', statusKey: 'projects.project1102.status', imageUrl: 'assets/images/projects/project-1102-hero.jpg', progress: 70, lastUpdatedAt: '2026-03-01', isFeatured: false, mapEmbedUrl: '', galleryImages: [] },
  { slug: 'project-1290', zoneSlug: 'zone-29', nameKey: 'projects.project1290.name', descKey: 'projects.project1290.description', fullDescKey: '', locationKey: 'projects.project1290.location', statusKey: 'projects.project1290.status', imageUrl: 'assets/images/projects/project-1290-hero.jpg', progress: 100, lastUpdatedAt: '2026-03-01', isFeatured: false, mapEmbedUrl: '', galleryImages: [] },
  { slug: 'project-94', zoneSlug: 'al-rawda', nameKey: 'projects.project94.name', descKey: 'projects.project94.description', fullDescKey: '', locationKey: 'projects.project94.location', statusKey: 'projects.project94.status', imageUrl: 'assets/images/projects/project-94-hero.jpg', progress: 30, lastUpdatedAt: '2026-03-01', isFeatured: false, mapEmbedUrl: '', galleryImages: [] },
  {
    slug: 'project-76', zoneSlug: 'al-rawda', nameKey: 'projects.project76.name', descKey: 'projects.project76.description', fullDescKey: 'projects.project76.fullDescription', locationKey: 'projects.project76.location', statusKey: 'projects.project76.status', imageUrl: 'assets/images/projects/project-76-hero.jpg', progress: 20, lastUpdatedAt: '2026-01-10', isFeatured: true,
    mapEmbedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3441.5!2d30.51!3d30.36!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzDCsDIxJzM2LjAiTiAzMMKwMzAnMzYuMCJF!5e0!3m2!1sar!2seg!4v3',
    galleryImages: ['assets/images/projects/project-76-gallery-1.jpg', 'assets/images/projects/project-76-gallery-2.jpg', 'assets/images/projects/project-76-gallery-3.jpg', 'assets/images/projects/project-76-gallery-4.jpg'],
  },
  { slug: 'project-137', zoneSlug: 'zone-35', nameKey: 'projects.project137.name', descKey: 'projects.project137.description', fullDescKey: '', locationKey: 'projects.project137.location', statusKey: 'projects.project137.status', imageUrl: 'assets/images/projects/project-137-hero.jpg', progress: 80, lastUpdatedAt: '2026-03-01', isFeatured: false, mapEmbedUrl: '', galleryImages: [] },
];

// ── Seed ──

async function seed(): Promise<void> {
  console.log('Seeding Turso database...');

  // 1. Run schema
  // Split schema by statements (libsql doesn't support multi-statement exec in one call)
  const statements = schema
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const stmt of statements) {
    await db.execute(stmt);
  }
  console.log('  Schema applied');

  // 2. Admin user
  const existingUser = await db.execute({ sql: 'SELECT id FROM users WHERE email = ?', args: ['admin@alahram.com'] });
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
    const zoneResult = await db.execute({ sql: 'SELECT id FROM zones WHERE slug = ?', args: [p.zoneSlug] });
    const zone = zoneResult.rows[0];
    if (!zone) {
      console.warn(`  Zone not found: ${p.zoneSlug} (for project ${p.slug})`);
      continue;
    }
    sortOrder++;
    await db.execute({
      sql: `INSERT OR IGNORE INTO projects (slug, zone_id, name_ar, name_en, description_ar, description_en,
        full_description_ar, full_description_en, location_ar, location_en, status_ar, status_en,
        image_url, progress, map_embed_url, is_featured, sort_order, last_updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        p.slug, zone.id,
        getTranslation(ar, p.nameKey), getTranslation(en, p.nameKey),
        getTranslation(ar, p.descKey), getTranslation(en, p.descKey),
        p.fullDescKey ? getTranslation(ar, p.fullDescKey) : '',
        p.fullDescKey ? getTranslation(en, p.fullDescKey) : '',
        getTranslation(ar, p.locationKey), getTranslation(en, p.locationKey),
        getTranslation(ar, p.statusKey), getTranslation(en, p.statusKey),
        p.imageUrl, p.progress, p.mapEmbedUrl,
        p.isFeatured ? 1 : 0, sortOrder, p.lastUpdatedAt,
      ],
    });
  }
  console.log(`  Seeded ${PROJECTS.length} projects`);

  // 5. Gallery images
  let galleryCount = 0;
  for (const p of PROJECTS) {
    if (p.galleryImages.length === 0) continue;
    const projResult = await db.execute({ sql: 'SELECT id FROM projects WHERE slug = ?', args: [p.slug] });
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

  console.log('Seed complete!');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
