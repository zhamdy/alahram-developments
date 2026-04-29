// generate_project_images.mjs — downloads project images from Pexels
// Usage: PEXELS_API_KEY=your_key node generate_project_images.mjs

import fs from 'fs';
import path from 'path';
import https from 'https';

const API_KEY = process.env.PEXELS_API_KEY;
if (!API_KEY) { console.error('Set PEXELS_API_KEY'); process.exit(1); }

const OUTPUT_DIR = 'src/assets/images/projects';
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// Hero images (1200x800) and gallery images (1200x800)
const IMAGES = [
  // Hero images
  ["project-76-hero.jpg",     "modern residential apartment building Egypt exterior"],
  ["project-76-hero.webp",    "modern residential apartment building Egypt exterior"],
  ["project-865-hero.jpg",    "luxury apartment building facade architecture white"],
  ["project-865-hero.webp",   "luxury apartment building facade architecture white"],
  ["project-868-hero.jpg",    "contemporary apartment complex residential tower"],
  ["project-868-hero.webp",   "contemporary apartment complex residential tower"],
  ["project-29-hero.jpg",     "mid-rise residential building Egypt compound"],
  ["project-94-hero.jpg",     "modern apartment block exterior urban Egypt"],
  ["project-137-hero.jpg",    "residential building architecture modern Egypt"],
  ["project-255-hero.jpg",    "apartment complex modern facade Egypt"],
  ["project-331-hero.jpg",    "luxury residential compound Egypt modern"],
  ["project-336-hero.jpg",    "modern apartment building white exterior Egypt"],
  ["project-348-hero.jpg",    "contemporary residential tower architecture"],
  ["project-584-hero.jpg",    "modern compound apartment building exterior"],
  ["project-629-hero.jpg",    "elegant apartment building architecture Egypt"],
  ["project-791-hero.jpg",    "residential building modern design Egypt"],
  ["project-794-hero.jpg",    "apartment block architecture modern facade"],
  ["project-799-hero.jpg",    "luxury apartment building exterior white"],
  ["project-870-hero.jpg",    "modern residential compound architecture Egypt"],
  ["project-947-hero.jpg",    "contemporary apartment tower Egypt modern"],
  ["project-1102-hero.jpg",   "modern residential building white facade Egypt"],
  ["project-1290-hero.jpg",   "luxury apartment complex architecture Egypt"],
  ["mini-compound-hero.jpg",  "small residential compound gated community Egypt"],
  ["al-rawda.jpg",            "residential garden compound Egypt green"],
  // Zone / area images
  ["zone-14.jpg",             "aerial residential district Egypt development"],
  ["zone-22.jpg",             "modern neighborhood aerial view Egypt"],
  ["zone-29.jpg",             "residential zone city aerial Egypt"],
  ["zone-35.jpg",             "planned residential area Egypt aerial"],
  ["zone-7-homeland.jpg",     "Egypt residential area neighborhood wide"],
  ["zone-7-strip.jpg",        "Egyptian city street residential boulevard"],
  // Gallery images (project-76)
  ["project-76-gallery-1.jpg", "apartment interior modern living room Egypt"],
  ["project-76-gallery-2.jpg", "kitchen modern apartment interior design"],
  ["project-76-gallery-3.jpg", "bedroom modern apartment interior bright"],
  ["project-76-gallery-4.jpg", "apartment balcony view residential building"],
  // Gallery images (project-865)
  ["project-865-gallery-1.jpg", "luxury apartment living room interior design"],
  ["project-865-gallery-2.jpg", "modern kitchen interior apartment bright"],
  ["project-865-gallery-3.jpg", "master bedroom modern apartment interior"],
  ["project-865-gallery-4.jpg", "residential compound garden green landscape"],
  // Gallery images (project-868)
  ["project-868-gallery-1.jpg", "spacious apartment interior modern Egypt"],
  ["project-868-gallery-2.jpg", "open plan living dining apartment modern"],
  ["project-868-gallery-3.jpg", "contemporary bedroom apartment interior"],
  ["project-868-gallery-4.jpg", "apartment building rooftop view compound"],
];

async function searchPexels(query, orientation = 'landscape') {
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1&orientation=${orientation}`;
  const res = await fetch(url, { headers: { Authorization: API_KEY } });
  if (!res.ok) throw new Error(`Pexels HTTP ${res.status}`);
  const json = await res.json();
  const photo = json.photos?.[0];
  if (!photo) throw new Error(`No results for "${query}"`);
  return photo.src.large2x || photo.src.large || photo.src.original;
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const get = u => {
      https.get(u, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          file.close(); return get(res.headers.location);
        }
        if (res.statusCode !== 200) {
          file.close(); try { fs.unlinkSync(dest); } catch {}
          return reject(new Error(`HTTP ${res.statusCode}`));
        }
        res.pipe(file);
        file.on('finish', () => file.close(resolve));
      }).on('error', e => { try { fs.unlinkSync(dest); } catch {} reject(e); });
    };
    get(url);
  });
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const total = IMAGES.length;
  let done = 0, skipped = 0, failed = 0;

  for (let i = 0; i < total; i++) {
    const [filename, query] = IMAGES[i];
    const dest = path.join(OUTPUT_DIR, filename);

    if (fs.existsSync(dest) && fs.statSync(dest).size > 50_000) {
      console.log(`[${i+1}/${total}] ⏭  ${filename}`);
      skipped++; continue;
    }

    process.stdout.write(`[${i+1}/${total}] "${query}" → ${filename}... `);
    try {
      const photoUrl = await searchPexels(query);
      await downloadFile(photoUrl, dest);
      // For .webp entries, just copy the jpg version (browser will use jpg fallback anyway)
      if (filename.endsWith('.webp')) {
        const jpgSrc = dest.replace('.webp', '.jpg');
        if (fs.existsSync(jpgSrc)) { fs.copyFileSync(jpgSrc, dest); }
      }
      const kb = Math.round(fs.statSync(dest).size / 1024);
      console.log(`✓ (${kb} KB)`);
      done++;
    } catch (e) {
      console.log(`✗ ${e.message}`);
      failed++;
    }

    if (i < total - 1) await sleep(500);
  }

  console.log(`\nDone. Downloaded: ${done}  Skipped: ${skipped}  Failed: ${failed}`);
})();
