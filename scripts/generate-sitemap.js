/**
 * Generates sitemap.xml from route config and content data.
 * Run: node scripts/generate-sitemap.js
 * Called automatically via npm run prebuild.
 */
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://alahram-developments.com';
const today = new Date().toISOString().split('T')[0];

// Static routes with priorities and change frequencies
const staticRoutes = [
  { path: '/', priority: '1.0', changefreq: 'weekly' },
  { path: '/projects', priority: '0.9', changefreq: 'weekly' },
  { path: '/about', priority: '0.7', changefreq: 'monthly' },
  { path: '/gallery', priority: '0.7', changefreq: 'monthly' },
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

// Build URL entries
const urls = [];

for (const route of staticRoutes) {
  urls.push({
    loc: `${BASE_URL}${route.path === '/' ? '' : route.path}`,
    lastmod: today,
    changefreq: route.changefreq,
    priority: route.priority,
  });
}

for (const slug of projectSlugs) {
  urls.push({
    loc: `${BASE_URL}/projects/${slug}`,
    lastmod: today,
    changefreq: 'monthly',
    priority: '0.8',
  });
}

for (const entry of blogEntries) {
  urls.push({
    loc: `${BASE_URL}/blog/${entry.slug}`,
    lastmod: entry.date,
    changefreq: 'monthly',
    priority: '0.7',
  });
}

// Generate XML
const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`,
  )
  .join('\n')}
</urlset>
`;

const outputPath = path.join(__dirname, '..', 'public', 'sitemap.xml');
fs.writeFileSync(outputPath, xml, 'utf8');
console.log(`Sitemap generated: ${urls.length} URLs written to public/sitemap.xml`);
