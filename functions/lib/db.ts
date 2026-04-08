import { createClient, type Client } from '@libsql/client/web';

export interface DbEnv {
  TURSO_URL: string;
  TURSO_AUTH_TOKEN: string;
}

let projectSchemaEnsured = false;
let projectSchemaEnsuring: Promise<void> | null = null;

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
