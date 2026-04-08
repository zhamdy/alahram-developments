import Database from 'better-sqlite3';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

let _db: Database.Database | null = null;

function ensureProjectStatusDescriptionColumns(db: Database.Database): void {
  const columns = db.prepare("PRAGMA table_info('projects')").all() as Array<{ name: string }>;
  const hasStatusDescriptionAr = columns.some(column => column.name === 'status_description_ar');
  const hasStatusDescriptionEn = columns.some(column => column.name === 'status_description_en');

  if (!hasStatusDescriptionAr) {
    db.exec("ALTER TABLE projects ADD COLUMN status_description_ar TEXT NOT NULL DEFAULT ''");
  }

  if (!hasStatusDescriptionEn) {
    db.exec("ALTER TABLE projects ADD COLUMN status_description_en TEXT NOT NULL DEFAULT ''");
  }
}

function getDb(): Database.Database {
  if (_db) return _db;

  const dataDir = join(process.cwd(), 'data');
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true });
  }

  const dbPath = join(dataDir, 'alahram.db');
  _db = new Database(dbPath);

  _db.pragma('journal_mode = WAL');
  _db.pragma('foreign_keys = ON');

  // Run schema if schema.sql is found
  const schemaPath = join(process.cwd(), 'src/server/schema.sql');
  if (existsSync(schemaPath)) {
    const schema = readFileSync(schemaPath, 'utf-8');
    _db.exec(schema);
  }

  // Keep legacy databases compatible with project details queries.
  ensureProjectStatusDescriptionColumns(_db);

  return _db;
}

// Proxy that lazily initializes the database on first use
const db = new Proxy({} as Database.Database, {
  get(_target, prop: string) {
    const instance = getDb();
    const value = instance[prop as keyof Database.Database];
    if (typeof value === 'function') {
      return value.bind(instance);
    }
    return value;
  },
});

export default db;
