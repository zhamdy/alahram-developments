/**
 * Repairs project and zone slugs that cannot round-trip through a URL path.
 *
 * Slugs entered through the admin panel before validation existed contain
 * spaces, uppercase letters or repeated hyphens (`project- 593`, `Project-917`,
 * `project--29`). Those never match a prerendered page, so Cloudflare Pages
 * answers a direct hit with a 404.
 *
 * Dry run:  TURSO_URL=libsql://... TURSO_AUTH_TOKEN=... npx tsx scripts/fix-project-slugs.ts
 * Apply:    ... npx tsx scripts/fix-project-slugs.ts --apply
 */
import { createClient } from '@libsql/client';

const url = process.env['TURSO_URL'];
const authToken = process.env['TURSO_AUTH_TOKEN'];

if (!url) {
  console.error('TURSO_URL is required');
  process.exit(1);
}

const apply = process.argv.includes('--apply');
const db = createClient({ url, authToken });

/** Mirrors slugify() in the admin routes — keep the two in step. */
function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

interface Row {
  id: number;
  slug: string;
}

async function repair(table: 'projects' | 'zones'): Promise<number> {
  const result = await db.execute(`SELECT id, slug FROM ${table} ORDER BY id`);
  const rows = result.rows as unknown as Row[];

  const seen = new Set(rows.map(r => r.slug));
  let changed = 0;

  for (const row of rows) {
    const clean = slugify(String(row.slug));

    if (clean === row.slug) continue;

    if (!clean) {
      console.error(`  SKIP ${table}#${row.id}: ${JSON.stringify(row.slug)} slugifies to empty`);
      continue;
    }

    if (seen.has(clean)) {
      // Renaming would collide with a real record — needs a human decision.
      console.error(
        `  SKIP ${table}#${row.id}: ${JSON.stringify(row.slug)} -> ${JSON.stringify(clean)} already taken`,
      );
      continue;
    }

    console.log(`  ${JSON.stringify(row.slug)} -> ${JSON.stringify(clean)}`);
    changed++;

    if (apply) {
      await db.execute({
        sql: `UPDATE ${table} SET slug = ? WHERE id = ?`,
        args: [clean, row.id],
      });
      seen.delete(row.slug);
      seen.add(clean);
    }
  }

  return changed;
}

async function main(): Promise<void> {
  console.log(apply ? 'APPLYING slug repairs' : 'DRY RUN — pass --apply to write');

  let total = 0;
  for (const table of ['projects', 'zones'] as const) {
    console.log(`\n${table}:`);
    const changed = await repair(table);
    if (changed === 0) console.log('  nothing to fix');
    total += changed;
  }

  console.log(`\n${total} slug(s) ${apply ? 'updated' : 'would be updated'}`);

  if (apply && total > 0) {
    console.log('Next: redeploy so the renamed projects get prerendered pages.');
  }
}

main()
  .catch(err => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  })
  .finally(() => db.close());
