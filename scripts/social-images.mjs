// Makes the site icons and the case studies' sharing (Open Graph) images.
//
// Icons, from assets/img/favicon.svg and assets/img/favicon_512.png:
//   favicon.ico              16, 32 and 48px, for browsers that skip the SVG
//   apple-touch-icon.png     180px on #1a1a1a (iOS won't show transparency, and
//                            rounds the corners itself, so the mark is inset)
//   assets/img/icon-192.png  and icon-512.png, for site.webmanifest
//
// Sharing images, 1200 × 630, from each case study's home page card image:
//   assets/img/og/<case study>.jpg
// A card that's a video uses its first frame, fitted to the height, with a
// blurred copy of the frame filling the sides so nothing on it is cut off.
// _includes/head.html picks these up by the case study's file name.
//
// Needs ffmpeg for video cards. Run after replacing any of the sources:
// npm run social
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import sharp from 'sharp';

const SVG = 'assets/img/favicon.svg';
const PNG = 'assets/img/favicon_512.png';
const OG = { width: 1200, height: 630 };
// Where to crop each card to the wider sharing shape (sharp's `position`).
// The ALCF cover keeps its top line; the rest crop from the middle.
const CROP = { alcf: 'top' };

// --- Icons -----------------------------------------------------------------

// An .ico holding PNGs, which every current browser reads.
function ico(pngs) {
  const header = Buffer.alloc(6 + 16 * pngs.length);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(pngs.length, 4);
  let offset = header.length;
  pngs.forEach(({ size, data }, i) => {
    const at = 6 + 16 * i;
    header.writeUInt8(size >= 256 ? 0 : size, at);
    header.writeUInt8(size >= 256 ? 0 : size, at + 1);
    header.writeUInt16LE(1, at + 4);             // colour planes
    header.writeUInt16LE(32, at + 6);            // bits per pixel
    header.writeUInt32LE(data.length, at + 8);
    header.writeUInt32LE(offset, at + 12);
    offset += data.length;
  });
  return Buffer.concat([header, ...pngs.map((p) => p.data)]);
}

const small = await Promise.all([16, 32, 48].map(async (size) => ({
  size,
  data: await sharp(SVG, { density: 384 }).resize(size, size).png().toBuffer(),
})));
fs.writeFileSync('favicon.ico', ico(small));

const inset = await sharp(PNG).resize(144, 144).toBuffer();
await sharp({ create: { width: 180, height: 180, channels: 4, background: '#1a1a1a' } })
  .composite([{ input: inset, gravity: 'centre' }])
  .flatten({ background: '#1a1a1a' })
  .png()
  .toFile('apple-touch-icon.png');

for (const size of [192, 512]) {
  await sharp(PNG).resize(size, size).png().toFile(`assets/img/icon-${size}.png`);
}
console.log('icons: favicon.ico, apple-touch-icon.png, assets/img/icon-192.png, icon-512.png');

// --- Sharing images ----------------------------------------------------------

fs.mkdirSync('assets/img/og', { recursive: true });
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'og-'));

for (const file of fs.readdirSync('_case_studies').filter((f) => f.endsWith('.md'))) {
  const slug = file.replace(/\.md$/, '');
  const text = fs.readFileSync(path.join('_case_studies', file), 'utf8');
  const media = text.match(/^card_media:\s*"(.*)"\s*$/m)?.[1] ?? '';
  const src = media.match(/src='([^']+)'/)?.[1];
  if (!src) continue;
  const out = `assets/img/og/${slug}.jpg`;

  if (media.includes('<video')) {
    const frame = path.join(tmp, `${slug}.png`);
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', src.slice(1), '-frames:v', '1', frame]);
    const fitted = await sharp(frame).resize({ height: OG.height }).toBuffer();
    await sharp(frame)
      .resize(OG.width, OG.height, { fit: 'cover' })
      .blur(30)
      .composite([{ input: fitted, gravity: 'centre' }])
      .jpeg({ quality: 82, mozjpeg: true })
      .toFile(out);
  } else {
    await sharp(src.slice(1))
      .resize(OG.width, OG.height, { fit: 'cover', position: CROP[slug] ?? 'centre' })
      .jpeg({ quality: 82, mozjpeg: true })
      .toFile(out);
  }
  console.log('wrote', out);
}
fs.rmSync(tmp, { recursive: true, force: true });
