// Stops a deploy that would publish media `npm run media` hasn't processed.
//
// Reads the built pages in _site and checks that:
//   - every image and video file a page asks for (src, srcset, poster) was
//     built, which catches copies made locally but never committed
//   - each original has its pixel size in _data/media.json (npm run
//     media:dims), so the page reserves its space before it loads
//   - each JPEG or PNG under /assets/img/ has AVIF and WebP copies listed in
//     _data/responsive.json (npm run images)
//   - each MP4 is listed in _data/video.json (npm run videos)
// Prints what's missing and exits 1, which fails the GitHub Actions build.
// The fix is the same each time: npm run media, then commit and push.
//
// Runs after `jekyll build` (.github/workflows/pages.yml), or locally:
// npm run check:media
import fs from 'node:fs';
import path from 'node:path';

const SITE = '_site';
const read = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const media = read('_data/media.json');
const responsive = read('_data/responsive.json');
const video = read('_data/video.json');
const built = (url) => fs.existsSync(path.join(SITE, url));

function* walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else if (p.endsWith('.html')) yield p;
  }
}

// Where each original is used, for the report, and any file a page asks for
// that isn't in the build.
const used = new Map();
const absent = new Map();
const MEDIA = /\.(jpe?g|png|gif|webp|avif|svg|mp4|webm)$/i;
for (const file of walk(SITE)) {
  const html = fs.readFileSync(file, 'utf8');
  const page = '/' + path.relative(SITE, file).replace(/index\.html$/, '');

  const asked = [...html.matchAll(/\s(?:src|poster)=["'](\/assets\/[^"']+)["']/g)].map((m) => m[1]);
  for (const [, set] of html.matchAll(/\ssrcset=["']([^"']+)["']/g)) {
    asked.push(...set.split(',').map((c) => c.trim().split(/\s+/)[0]).filter((u) => u.startsWith('/assets/')));
  }
  for (const url of asked) {
    const clean = url.split('?')[0].replace(/\/{2,}/g, '/');
    if (MEDIA.test(clean) && !built(clean)) {
      if (!absent.has(clean)) absent.set(clean, new Set());
      absent.get(clean).add(page);
    }
  }
  for (const [, url] of html.matchAll(/<(?:img|video|source)\b[^>]*?\ssrc=["'](\/assets\/[^"']+)["']/g)) {
    const clean = url.split('?')[0].replace(/\/{2,}/g, '/');
    // Generated copies are checked through their originals.
    if (clean.startsWith('/assets/img/r/') || /(\.av1|-m)\.mp4$/.test(clean)) continue;
    if (!MEDIA.test(clean)) continue;
    if (!used.has(clean)) used.set(clean, new Set());
    used.get(clean).add(page);
  }
}

const problems = [];
for (const [url, pages] of [...used].sort(([a], [b]) => a.localeCompare(b))) {
  const missing = [];
  if (!media[url]) missing.push('size (media:dims)');

  if (/^\/assets\/img\/.+\.(jpe?g|png)$/i.test(url)) {
    if (!responsive[url]) missing.push('AVIF/WebP copies (images)');
  }
  if (/\.mp4$/i.test(url) && !video[url]) missing.push('video copies (videos)');

  if (missing.length) problems.push(`  ${url}\n    missing: ${missing.join(', ')}\n    on: ${[...pages].join(', ')}`);
}

for (const [url, pages] of [...absent].sort(([a], [b]) => a.localeCompare(b))) {
  problems.push(`  ${url}\n    missing: the file (made locally but not committed?)\n    on: ${[...pages].join(', ')}`);
}

if (problems.length) {
  console.error(`${problems.length} media file(s) haven't been processed:\n\n${problems.join('\n')}\n`);
  console.error('Run `npm run media`, check the pages locally, then commit and push the results.');
  process.exit(1);
}
console.log(`Media check passed: ${used.size} files, all sized and with their copies.`);
