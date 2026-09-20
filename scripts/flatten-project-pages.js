/**
 * Copies every prerendered zone and project page to a flat sibling file.
 * Run: node scripts/flatten-project-pages.js
 * Called automatically via npm run postbuild.
 *
 * Cloudflare Pages does not serve the prerendered document for
 * /:locale/projects/:zone[/:slug]/ — it returns the homepage instead, although
 * the asset is present (requesting its index.html 308s, while a genuinely
 * missing path 404s). Blog pages of the same shape are unaffected.
 *
 * The flat copies give those pages a path with no directory index involved, so
 * the rewrites in public/_redirects can reach them. Extensionless targets that
 * resolve to a .html file are the same mechanism the /admin/* rule already uses.
 */
const fs = require('fs');
const path = require('path');

const DIST = path.join(__dirname, '..', 'dist', 'alahram-developments', 'browser');
const MANIFEST_PATH = path.join(__dirname, '..', 'src', 'app', 'content-manifest.json');
const LOCALES = ['ar', 'en'];

function flatten() {
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  const pages = [];

  for (const locale of LOCALES) {
    for (const zone of manifest.zones) {
      pages.push(path.join(locale, 'projects', zone));
    }
    for (const project of manifest.projects) {
      pages.push(path.join(locale, 'projects', project.zoneSlug, project.slug));
    }
  }

  let copied = 0;
  const missing = [];

  for (const page of pages) {
    const source = path.join(DIST, page, 'index.html');
    if (!fs.existsSync(source)) {
      missing.push(page);
      continue;
    }
    fs.copyFileSync(source, path.join(DIST, `${page}.page.html`));
    copied++;
  }

  return { copied, missing };
}

if (require.main === module) {
  const { copied, missing } = flatten();
  if (missing.length) {
    console.warn(`[flatten] no prerendered page for: ${missing.join(', ')}`);
  }
  console.log(`[flatten] ${copied} zone/project pages copied to flat .page.html files`);
  if (!copied) {
    console.error('[flatten] nothing was copied — the rewrites in _redirects would 404');
    process.exit(1);
  }
}

module.exports = { flatten, DIST, MANIFEST_PATH };
