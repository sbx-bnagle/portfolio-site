// Makes the smaller and modern-format copies behind the site's <picture>s.
//
// Reads the built pages in _site for every JPEG and PNG they show, and writes
// AVIF and WebP copies at a ladder of widths up to the original's, to
// assets/img/r/ beside the original's path ("ALCF/ar.jpg" -> "r/ALCF/ar-1600.avif").
// _data/responsive.json lists what exists; _includes/picture.html turns that
// into srcset. Existing copies newer than their original are kept, so a re-run
// only does new work.
//
// Run after `jekyll build` (or with `jekyll serve` running), then let Jekyll
// rebuild: npm run images
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const SITE = '_site';
const OUT = 'assets/img/r';
const WIDTHS = [160, 320, 480, 800, 1200, 1600, 2400, 3200];
const FORMATS = {
  avif: { quality: 55, effort: 4 },
  webp: { quality: 80, effort: 5 },
};

function* walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else if (p.endsWith('.html')) yield p;
  }
}

// Every original JPEG/PNG under /assets/img/ that a built page shows.
const used = new Set();
for (const file of walk(SITE)) {
  const html = fs.readFileSync(file, 'utf8');
  for (const [, url] of html.matchAll(/(?:src|srcset)=["'](\/assets\/img\/[^"'\s]+?\.(?:jpe?g|png))["'\s]/gi)) {
    if (!url.startsWith('/assets/img/r/')) used.add(url.replace(/\/{2,}/g, '/'));
  }
}

const manifest = {};
let made = 0;
for (const url of [...used].sort()) {
  const src = url.slice(1);
  if (!fs.existsSync(src)) continue;
  const meta = await sharp(src).metadata();
  const full = meta.autoOrient?.width ?? meta.width;
  // Widths below the original's, plus the original's own (capped).
  const widths = [...new Set([...WIDTHS.filter((w) => w < full), Math.min(full, WIDTHS.at(-1))])];
  const stem = path.join(OUT, src.replace(/^assets\/img\//, '').replace(/\.[^.]+$/, ''));
  fs.mkdirSync(path.dirname(stem), { recursive: true });
  const srcTime = fs.statSync(src).mtimeMs;

  for (const w of widths) {
    for (const [fmt, opts] of Object.entries(FORMATS)) {
      const out = `${stem}-${w}.${fmt}`;
      if (fs.existsSync(out) && fs.statSync(out).mtimeMs > srcTime) continue;
      await sharp(src).rotate().resize({ width: w, withoutEnlargement: true })[fmt](opts).toFile(out);
      made++;
    }
  }
  manifest[url] = { stem: '/' + stem.split(path.sep).join('/'), w: widths };
}

const lines = Object.entries(manifest).map(([k, v]) => ` ${JSON.stringify(k)}: ${JSON.stringify(v)}`);
fs.writeFileSync('_data/responsive.json', `{\n${lines.join(',\n')}\n}\n`);
console.log(`${Object.keys(manifest).length} images, ${made} files written to ${OUT}/`);
