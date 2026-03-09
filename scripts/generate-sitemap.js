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
  { path: '/payment-plans', priority: '0.7', changefreq: 'monthly' },
  { path: '/investors', priority: '0.7', changefreq: 'monthly' },
  { path: '/blog', priority: '0.8', changefreq: 'weekly' },
  { path: '/contact', priority: '0.6', changefreq: 'monthly' },
  { path: '/privacy', priority: '0.3', changefreq: 'yearly' },
];

// Extract slugs from data files using regex
function extractSlugs(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const slugRegex = /slug:\s*'([^']+)'/g;
  const slugs = [];
  let match;
  while ((match = slugRegex.exec(content)) !== null) {
    slugs.push(match[1]);
  }
  return slugs;
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

const projectsFile = path.join(__dirname, '..', 'src', 'app', 'features', 'projects', 'data', 'projects.data.ts');
const blogFile = path.join(__dirname, '..', 'src', 'app', 'features', 'blog', 'data', 'blog.data.ts');

const projectSlugs = extractSlugs(projectsFile);
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

for (const slug of projectSlugs) {
  allRoutes.push({
    path: `/projects/${slug}`,
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
    alternates.push(`    <xhtml:link rel="alternate" hreflang="x-default" href="${BASE_URL}/ar${route.path}" />`);

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
