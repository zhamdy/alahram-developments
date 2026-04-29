// generate_blog_images.mjs — downloads free stock photos from Unsplash (no API key needed)
import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';

const OUTPUT_DIR = 'src/assets/images/blog';
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// Each entry: [filename, unsplash_search_keywords]
// URL: https://source.unsplash.com/1200x675/?keyword — free, no key, redirects to a real photo
const IMAGES = [
  ["blog-1.jpg",  "egypt,city,aerial,residential"],
  ["blog-2.jpg",  "construction,building,crane,architecture"],
  ["blog-3.jpg",  "neighborhood,boulevard,palm,residential"],
  ["blog-4.jpg",  "real-estate,office,contract,business"],
  ["blog-5.jpg",  "aerial,district,city,development"],
  ["blog-6.jpg",  "apartment,interior,living-room,modern"],
  ["blog-7.jpg",  "luxury,apartment,building,facade"],
  ["blog-8.jpg",  "city,urban,aerial,residential-zone"],
  ["blog-9.jpg",  "mortgage,bank,finance,document"],
  ["blog-10.jpg", "industrial,factory,technology,park"],
  ["blog-11.jpg", "finance,payment,plan,desk"],
  ["blog-12.jpg", "villa,street,quiet,neighborhood"],
  ["blog-13.jpg", "family,keys,new-home,handover"],
  ["blog-14.jpg", "highway,road,infrastructure,construction"],
  ["blog-15.jpg", "apartment,villa,real-estate,compare"],
  ["blog-16.jpg", "industrial,zone,factory,egypt"],
  ["blog-17.jpg", "textile,factory,weaving,industrial"],
  ["blog-18.jpg", "family,home,happy,apartment"],
  ["blog-19.jpg", "urban,planning,architecture,model"],
  ["blog-20.jpg", "park,green,garden,compound"],
  ["blog-21.jpg", "city,modern,skyline,egypt"],
  ["blog-22.jpg", "sustainable,architecture,green,building"],
  ["blog-23.jpg", "city,boulevard,urban,modern"],
  ["blog-24.jpg", "apartment,interior,spacious,design"],
  ["blog-25.jpg", "highway,desert,road,egypt"],
  ["blog-26.jpg", "compound,gate,residential,gated"],
  ["blog-27.jpg", "investment,chart,laptop,finance"],
  ["blog-28.jpg", "residential,buildings,completed,development"],
  ["blog-29.jpg", "mall,shopping,commercial,modern"],
  ["blog-30.jpg", "retail,shops,commercial,street"],
  ["blog-31.jpg", "pool,compound,leisure,lifestyle"],
  ["blog-32.jpg", "university,campus,students,education"],
  ["blog-33.jpg", "construction,finishing,building,workers"],
  ["blog-34.jpg", "customer-service,office,reception,real-estate"],
  ["blog-35.jpg", "university,private,campus,modern"],
  ["blog-36.jpg", "contract,legal,document,sign"],
  ["blog-37.jpg", "school,children,education,gate"],
  ["blog-38.jpg", "hospital,medical,healthcare,building"],
  ["blog-39.jpg", "family,home,investment,balance"],
  ["blog-40.jpg", "highway,interchange,traffic,infrastructure"],
  ["blog-41.jpg", "market,chart,growth,real-estate"],
  ["blog-42.jpg", "utilities,infrastructure,electrical,building"],
  ["blog-43.jpg", "road,transformation,urban,development"],
  ["blog-44.jpg", "developer,building,proud,achievement"],
  ["blog-45.jpg", "city,new,modern,panoramic"],
  ["blog-46.jpg", "quiet,street,morning,peaceful"],
  ["blog-47.jpg", "city,expansion,future,construction"],
  ["blog-48.jpg", "government,business,investment,signing"],
  ["blog-49.jpg", "mosque,community,architecture,egypt"],
  ["blog-50.jpg", "modern,city,future,architecture"],
];

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const protocol = url.startsWith('https') ? https : http;

    const req = protocol.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
      // Follow redirects (Unsplash source returns 302)
      if (res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 307) {
        file.close();
        fs.unlinkSync(dest);
        return download(res.headers.location, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        file.close();
        fs.unlinkSync(dest);
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
    });
    req.on('error', e => { fs.unlinkSync(dest); reject(e); });
    req.setTimeout(30000, () => { req.destroy(); reject(new Error('timeout')); });
  });
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const total = IMAGES.length;
  let done = 0, skipped = 0, failed = 0;

  for (let i = 0; i < total; i++) {
    const [filename, keywords] = IMAGES[i];
    const dest = path.join(OUTPUT_DIR, filename);

    if (fs.existsSync(dest) && fs.statSync(dest).size > 5000) {
      console.log(`[${i+1}/${total}] ⏭  ${filename} (exists)`);
      skipped++;
      continue;
    }

    const seed = filename.replace('.jpg', '');
    const url = `https://picsum.photos/seed/${seed}/1200/675`;
    process.stdout.write(`[${i+1}/${total}] Downloading ${filename}... `);
    try {
      await download(url, dest);
      const kb = Math.round(fs.statSync(dest).size / 1024);
      console.log(`✓ (${kb} KB)`);
      done++;
    } catch (e) {
      console.log(`✗ ${e.message}`);
      failed++;
    }

    if (i < total - 1) await sleep(800);
  }

  console.log(`\nDone. Downloaded: ${done}  Skipped: ${skipped}  Failed: ${failed}`);
})();
