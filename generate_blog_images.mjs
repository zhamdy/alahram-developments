// generate_blog_images.mjs
// Downloads topically relevant photos from Pexels (free API, no billing)
// Get free API key at: https://www.pexels.com/api/
//
// Usage: PEXELS_API_KEY=your_key node generate_blog_images.mjs

import fs from 'fs';
import path from 'path';
import https from 'https';

const API_KEY = process.env.PEXELS_API_KEY;
if (!API_KEY) {
  console.error('Error: PEXELS_API_KEY env var not set.');
  console.error('Get a free key at https://www.pexels.com/api/ then run:');
  console.error('  PEXELS_API_KEY=your_key node generate_blog_images.mjs');
  process.exit(1);
}

const OUTPUT_DIR = 'src/assets/images/blog';
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// [filename, pexels_search_query]
const IMAGES = [
  ["blog-1.jpg",  "modern city Egypt aerial view"],
  ["blog-2.jpg",  "construction building site crane workers"],
  ["blog-3.jpg",  "residential neighborhood boulevard palm trees"],
  ["blog-4.jpg",  "real estate contract business meeting"],
  ["blog-5.jpg",  "aerial view residential district development"],
  ["blog-6.jpg",  "apartment interior modern bright living room"],
  ["blog-7.jpg",  "luxury apartment building exterior architecture"],
  ["blog-8.jpg",  "city residential zone urban aerial"],
  ["blog-9.jpg",  "mortgage bank signing document home loan"],
  ["blog-10.jpg", "industrial technology park factory buildings"],
  ["blog-11.jpg", "financial planning payment schedule desk"],
  ["blog-12.jpg", "quiet upscale residential villa street"],
  ["blog-13.jpg", "family new home keys happy handover"],
  ["blog-14.jpg", "highway expressway construction infrastructure"],
  ["blog-15.jpg", "apartment building real estate architecture"],
  ["blog-16.jpg", "industrial zone factory production"],
  ["blog-17.jpg", "textile factory weaving production"],
  ["blog-18.jpg", "happy family inside new apartment home"],
  ["blog-19.jpg", "urban city planning architecture model"],
  ["blog-20.jpg", "green park garden residential compound"],
  ["blog-21.jpg", "modern city skyline buildings Egypt"],
  ["blog-22.jpg", "sustainable green building architecture eco"],
  ["blog-23.jpg", "city boulevard street modern buildings"],
  ["blog-24.jpg", "spacious apartment interior design"],
  ["blog-25.jpg", "desert highway road aerial Egypt"],
  ["blog-26.jpg", "gated compound entrance residential gate"],
  ["blog-27.jpg", "investment chart laptop finance money"],
  ["blog-28.jpg", "completed residential buildings development"],
  ["blog-29.jpg", "shopping mall commercial center modern"],
  ["blog-30.jpg", "retail shops commercial street storefront"],
  ["blog-31.jpg", "swimming pool compound leisure lifestyle"],
  ["blog-32.jpg", "university campus students education"],
  ["blog-33.jpg", "construction workers building finishing"],
  ["blog-34.jpg", "customer service office real estate reception"],
  ["blog-35.jpg", "university building private campus modern"],
  ["blog-36.jpg", "contract legal document signing papers"],
  ["blog-37.jpg", "school children education building"],
  ["blog-38.jpg", "hospital medical center modern building"],
  ["blog-39.jpg", "family home interior living room cozy"],
  ["blog-40.jpg", "highway interchange traffic infrastructure city"],
  ["blog-41.jpg", "real estate market growth chart data"],
  ["blog-42.jpg", "building utilities electrical infrastructure"],
  ["blog-43.jpg", "road construction urban development progress"],
  ["blog-44.jpg", "architect developer building achievement proud"],
  ["blog-45.jpg", "panoramic modern city new urban development"],
  ["blog-46.jpg", "peaceful quiet residential street morning"],
  ["blog-47.jpg", "city expansion future construction cranes"],
  ["blog-48.jpg", "business investment signing ceremony office"],
  ["blog-49.jpg", "mosque architecture community Egypt"],
  ["blog-50.jpg", "futuristic modern city architecture future"],
];

async function searchPexels(query) {
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`;
  const res = await fetch(url, { headers: { Authorization: API_KEY } });
  if (!res.ok) throw new Error(`Pexels search HTTP ${res.status}`);
  const json = await res.json();
  const photo = json.photos?.[0];
  if (!photo) throw new Error(`No results for "${query}"`);
  // Use large2x (1200px wide) or original
  return photo.src.large2x || photo.src.large || photo.src.original;
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const get = (u) => {
      https.get(u, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          file.close();
          return get(res.headers.location);
        }
        if (res.statusCode !== 200) {
          file.close();
          fs.unlinkSync(dest);
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
      console.log(`[${i+1}/${total}] ⏭  ${filename} (exists)`);
      skipped++;
      continue;
    }

    process.stdout.write(`[${i+1}/${total}] "${query}" → ${filename}... `);
    try {
      const photoUrl = await searchPexels(query);
      await downloadFile(photoUrl, dest);
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
