import { createClient, type ResultSet } from '@libsql/client';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const url = process.env['TURSO_URL'] || `file:${join(process.cwd(), 'data', 'alahram.db')}`;
const authToken = process.env['TURSO_AUTH_TOKEN'];

if (url.startsWith('file:')) {
  const dir = join(url.replace(/^file:/, ''), '..');
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

const db = createClient({ url, authToken });

// For local file DBs (dev + CI fallback), initialize schema immediately so
// tables exist before prerendering makes API calls against the empty DB.
if (url.startsWith('file:')) {
  const schemaPath = join(process.cwd(), 'src/server/schema.sql');
  if (existsSync(schemaPath)) {
    const schema = readFileSync(schemaPath, 'utf-8');
    const statements = schema.split(';').map(s => s.trim()).filter(Boolean);
    for (const sql of statements) {
      try { await db.execute(sql); } catch { /* already exists */ }
    }
  }
}

export function rowsToObjects(result: ResultSet): Record<string, unknown>[] {
  return result.rows.map(row => {
    const obj: Record<string, unknown> = {};
    for (let i = 0; i < result.columns.length; i++) {
      obj[result.columns[i]] = row[i];
    }
    return obj;
  });
}

export function rowToObject(result: ResultSet): Record<string, unknown> | undefined {
  if (result.rows.length === 0) return undefined;
  const row = result.rows[0];
  const obj: Record<string, unknown> = {};
  for (let i = 0; i < result.columns.length; i++) {
    obj[result.columns[i]] = row[i];
  }
  return obj;
}

export default db;
