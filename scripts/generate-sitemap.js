/**
 * Generates sitemap.xml from route config and content data.
 * Run: node scripts/generate-sitemap.js
 * Called automatically via npm run prebuild.
 */
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://alahram-developments.com';
const LOCALES = ['ar', 'en'];
const today = new Date().toISOString().split('T')[0];

// Static routes with priorities and change frequencies
const staticRoutes = [
  { path: '/', priority: '1.0', changefreq: 'weekly' },
  { path: '/projects', priority: '0.9', changefreq: 'weekly' },
  { path: '/about', priority: '0.7', changefreq: 'monthly' },
  { path: '/gallery', priority: '0.7', changefreq: 'monthly' },
  { path: '/sadat-guide', priority: '0.8', changefreq: 'monthly' },
  { path: '/construction', priority: '0.7', changefreq: 'weekly' },
  { path: '/faq', priority: '0.6', changefreq: 'monthly' },
  { path: '/blog', priority: '0.8', changefreq: 'weekly' },
  { path: '/contact', priority: '0.6', changefreq: 'monthly' },
  { path: '/privacy', priority: '0.3', changefreq: 'yearly' },
];

// Zone slugs
const ZONE_SLUGS = [
  'zone-7-strip', 'zone-7-homeland', 'zone-14', 'zone-21',
  'zone-22', 'zone-29', 'al-rawda', 'zone-35',
];

// Extract project slugs with zone mapping from data file using regex
function extractProjectsWithZones(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const projects = [];
  // Match patterns like: slug: 'xxx', zoneSlug: 'yyy' (they appear in any order within object)
  // We'll find each project object block
  const objectRegex = /\{[^}]*slug:\s*'([^']+)'[^}]*zoneSlug:\s*'([^']+)'[^}]*\}|{[^}]*zoneSlug:\s*'([^']+)'[^}]*slug:\s*'([^']+)'[^}]*\}/gs;
  let match;
  while ((match = objectRegex.exec(content)) !== null) {
    const slug = match[1] || match[4];
    const zoneSlug = match[2] || match[3];
    if (slug && zoneSlug) {
      projects.push({ slug, zoneSlug });
    }
  }
  // Fallback: parse line by line if regex didn't catch nested structure
  if (projects.length === 0) {
    const lines = content.split('\n');
    let currentSlug = null;
    let currentZoneSlug = null;
    for (const line of lines) {
      const slugMatch = line.match(/^\s*slug:\s*'([^']+)'/);
      const zoneMatch = line.match(/^\s*zoneSlug:\s*'([^']+)'/);
      if (slugMatch) currentSlug = slugMatch[1];
      if (zoneMatch) currentZoneSlug = zoneMatch[1];
      if (currentSlug && currentZoneSlug) {
        projects.push({ slug: currentSlug, zoneSlug: currentZoneSlug });
        currentSlug = null;
        currentZoneSlug = null;
      }
    }
  }
  return projects;
}

// Extract dates from blog data
function extractBlogEntries(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const entries = [];
  const slugRegex = /slug:\s*'([^']+)'/g;
  const dateRegex = /date:\s*'([^']+)'/g;
  const slugs = [];
  const dates = [];
  let match;
  while ((match = slugRegex.exec(content)) !== null) slugs.push(match[1]);
  while ((match = dateRegex.exec(content)) !== null) dates.push(match[1]);
  for (let i = 0; i < slugs.length; i++) {
    entries.push({ slug: slugs[i], date: dates[i] || today });
  }
  return entries;
}

const projectsFile = path.join(
  __dirname,
  '..',
  'src',
  'app',
  'features',
  'projects',
  'data',
  'projects.data.ts',
);
const blogFile = path.join(
  __dirname,
  '..',
  'src',
  'app',
  'features',
  'blog',
  'data',
  'blog.data.ts',
);

const projectEntries = extractProjectsWithZones(projectsFile);
const blogEntries = extractBlogEntries(blogFile);

// Build route definitions (path relative to locale root)
const allRoutes = [];

for (const route of staticRoutes) {
  allRoutes.push({
    path: route.path === '/' ? '' : route.path,
    lastmod: today,
    changefreq: route.changefreq,
    priority: route.priority,
  });
}

// Zone pages
for (const zoneSlug of ZONE_SLUGS) {
  allRoutes.push({
    path: `/projects/${zoneSlug}`,
    lastmod: today,
    changefreq: 'weekly',
    priority: '0.85',
  });
}

// Project detail pages (with zone slug)
for (const project of projectEntries) {
  allRoutes.push({
    path: `/projects/${project.zoneSlug}/${project.slug}`,
    lastmod: today,
    changefreq: 'monthly',
    priority: '0.8',
  });
}

for (const entry of blogEntries) {
  allRoutes.push({
    path: `/blog/${entry.slug}`,
    lastmod: entry.date,
    changefreq: 'monthly',
    priority: '0.7',
  });
}

// Generate URL entries with hreflang alternates for each locale
function buildUrlEntry(route) {
  const entries = [];

  for (const locale of LOCALES) {
    const loc = `${BASE_URL}/${locale}${route.path}`;

    const alternates = LOCALES.map(alt => {
      const href = `${BASE_URL}/${alt}${route.path}`;
      return `    <xhtml:link rel="alternate" hreflang="${alt}" href="${href}" />`;
    });
    // Add x-default pointing to Arabic
    alternates.push(
      `    <xhtml:link rel="alternate" hreflang="x-default" href="${BASE_URL}/ar${route.path}" />`,
    );

    entries.push(`  <url>
    <loc>${loc}</loc>
    <lastmod>${route.lastmod}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
${alternates.join('\n')}
  </url>`);
  }

  return entries;
}

// Generate XML
const urlEntries = allRoutes.flatMap(buildUrlEntry);

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urlEntries.join('\n')}
</urlset>
`;

const outputPath = path.join(__dirname, '..', 'public', 'sitemap.xml');
fs.writeFileSync(outputPath, xml, 'utf8');
console.log(`Sitemap generated: ${urlEntries.length} URLs written to public/sitemap.xml`);
