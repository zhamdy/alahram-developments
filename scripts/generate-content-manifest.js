/**
 * Fetches zones and projects from the live API and writes them to
 * src/app/content-manifest.json.
 *
 * The prerender list (app.routes.server.ts) and the sitemap both read this
 * file. Before it existed each kept its own hardcoded copy, so a project added
 * through the admin panel got no static page and Cloudflare Pages answered
 * direct hits with a 404.
 *
 * Run: node scripts/generate-content-manifest.js
 * Called automatically via npm run prebuild.
 */
const fs = require('fs');
const path = require('path');

const API_URL = process.env.CONTENT_API_URL || 'https://www.alahram-developments-sadat.com/api';
const OUT_FILE = path.join(__dirname, '..', 'src', 'app', 'content-manifest.json');
const TIMEOUT_MS = 20000;

/** Slugs that cannot round-trip through a URL path are skipped, not prerendered. */
const VALID_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

async function getJson(endpoint) {
  const res = await fetch(`${API_URL}${endpoint}`, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`${endpoint} responded ${res.status}`);
  const body = await res.json();
  if (!body || body.success !== true || !Array.isArray(body.data)) {
    throw new Error(`${endpoint} returned an unexpected payload`);
  }
  return body.data;
}

function readExisting() {
  if (!fs.existsSync(OUT_FILE)) return null;
  try {
    return JSON.parse(fs.readFileSync(OUT_FILE, 'utf8'));
  } catch {
    return null;
  }
}

async function main() {
  let zones;
  let projects;

  try {
    [zones, projects] = await Promise.all([getJson('/zones'), getJson('/projects')]);
  } catch (err) {
    // A build must not depend on the API being reachable; the committed
    // manifest is the fallback and is only stale, never wrong.
    const existing = readExisting();
    if (existing) {
      console.warn(`[content-manifest] fetch failed (${err.message}) — keeping committed manifest`);
      console.warn(
        `[content-manifest] ${existing.zones.length} zones, ${existing.projects.length} projects (stale)`,
      );
      return;
    }
    throw new Error(`content manifest fetch failed and no committed fallback exists: ${err.message}`);
  }

  const skipped = [];
  const zoneSlugs = [];
  for (const zone of zones) {
    if (VALID_SLUG.test(zone.slug)) zoneSlugs.push(zone.slug);
    else skipped.push(`zone ${JSON.stringify(zone.slug)}`);
  }

  const projectEntries = [];
  for (const project of projects) {
    if (!VALID_SLUG.test(project.slug) || !VALID_SLUG.test(project.zoneSlug || '')) {
      skipped.push(`project ${JSON.stringify(project.slug)}`);
      continue;
    }
    projectEntries.push({
      slug: project.slug,
      zoneSlug: project.zoneSlug,
      lastUpdatedAt: project.lastUpdatedAt || null,
    });
  }

  zoneSlugs.sort();
  projectEntries.sort((a, b) => a.slug.localeCompare(b.slug));

  const manifest = {
    generatedAt: new Date().toISOString().split('T')[0],
    source: API_URL,
    zones: zoneSlugs,
    projects: projectEntries,
  };

  fs.writeFileSync(OUT_FILE, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  console.log(
    `[content-manifest] ${zoneSlugs.length} zones, ${projectEntries.length} projects -> src/app/content-manifest.json`,
  );
  if (skipped.length > 0) {
    console.warn(
      `[content-manifest] skipped ${skipped.length} malformed slug(s), fix them in the admin panel: ${skipped.join(', ')}`,
    );
  }
}

main().catch(err => {
  console.error(`[content-manifest] ${err.message}`);
  process.exit(1);
});
