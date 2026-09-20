/**
 * Generates the optimized image variants the templates reference.
 * Run: node scripts/generate-images.js
 * Called automatically via npm run prebuild.
 *
 * Outputs are committed so `npm start` works without running a build first, and
 * are skipped when they are already newer than their source, so repeat builds
 * cost nothing. Sources are never written to.
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'src', 'assets', 'images', 'generated');

// The hero is the LCP element, so it gets AVIF and WebP at the same widths the
// <img> offers. The logos are rendered small but shipped at photographic size.
const JOBS = [
  { source: 'src/assets/images/hero-1672w.png', name: 'hero', widths: [640, 1024, 1672], formats: ['avif', 'webp'] },
  { source: 'public/logo.png', name: 'logo', widths: [400], formats: ['webp'] },
  { source: 'public/logo-footer.PNG', name: 'logo-footer', widths: [400], formats: ['webp'] },
  // Decorative section art, shipped as 2-3 MB PNGs. breadcrumb is the hero
  // background on nine pages, so it is above the fold on most of the site.
  { source: 'src/assets/images/breadcrumb.png', name: 'breadcrumb', widths: [1376], formats: ['webp'] },
  { source: 'src/assets/images/lifestyle-strip.png', name: 'lifestyle-strip', widths: [1536], formats: ['webp'] },
  { source: 'src/assets/images/brand-story.png', name: 'brand-story', widths: [1408], formats: ['webp'] },
  { source: 'src/assets/images/cta.png', name: 'cta', widths: [1264], formats: ['webp'] },
];

const QUALITY = { avif: 55, webp: 78 };

function isStale(source, target) {
  if (!fs.existsSync(target)) return true;
  return fs.statSync(source).mtimeMs > fs.statSync(target).mtimeMs;
}

async function generate() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const written = [];
  let skipped = 0;

  for (const job of JOBS) {
    const source = path.join(ROOT, job.source);
    if (!fs.existsSync(source)) {
      throw new Error(`[images] missing source: ${job.source}`);
    }

    for (const width of job.widths) {
      for (const format of job.formats) {
        const file = `${job.name}-${width}w.${format}`;
        const target = path.join(OUT_DIR, file);

        if (!isStale(source, target)) {
          skipped++;
          continue;
        }

        await sharp(source)
          .resize({ width, withoutEnlargement: true })
          .toFormat(format, { quality: QUALITY[format] })
          .toFile(target);

        written.push(`${file} (${(fs.statSync(target).size / 1024).toFixed(0)} KB)`);
      }
    }
  }

  return { written, skipped };
}

if (require.main === module) {
  generate()
    .then(({ written, skipped }) => {
      for (const file of written) console.log(`[images] wrote ${file}`);
      console.log(`[images] ${written.length} generated, ${skipped} already current`);
    })
    .catch(err => {
      console.error(`[images] ${err.message}`);
      process.exit(1);
    });
}

module.exports = { generate, OUT_DIR };
