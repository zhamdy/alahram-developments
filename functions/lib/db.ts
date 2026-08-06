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
