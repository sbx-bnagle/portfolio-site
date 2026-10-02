// Writes _data/media.json: the pixel size of every image and video under
// assets/, keyed by its URL path ("/assets/img/ALCF/ar.jpg": [3200, 1786]).
// The media includes read it to give each <img> and <video> its width and
// height, so the page reserves the right space before anything loads.
// Run after adding or replacing media: npm run media:dims
// Videos are measured with ffprobe (part of ffmpeg), which must be installed.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { imageSize } from 'image-size';

const ROOTS = ['assets/img', 'assets/video'];
const IMAGE = /\.(jpe?g|png|gif|webp|avif|svg)$/i;
const VIDEO = /\.(mp4|webm)$/i;

function* walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    // assets/img/r holds generated copies (npm run images); only originals count.
    if (e.isDirectory()) { if (p !== path.join('assets', 'img', 'r')) yield* walk(p); }
    else yield p;
  }
}

function imageDims(file) {
  const d = imageSize(fs.readFileSync(file));
  // EXIF orientations 5-8 turn the picture on its side: the browser shows it
  // rotated, so its displayed width is the stored height.
  return d.orientation >= 5 ? [d.height, d.width] : [d.width, d.height];
}

function videoDims(file) {
  const out = execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0',
    '-show_entries', 'stream=width,height:stream_side_data=rotation',
    '-of', 'json', file]).toString();
  const s = JSON.parse(out).streams?.[0];
  if (!s) return null;
  const rot = Math.abs(s.side_data_list?.find((d) => 'rotation' in d)?.rotation ?? 0);
  return rot === 90 || rot === 270 ? [s.height, s.width] : [s.width, s.height];
}

const dims = {};
for (const root of ROOTS) {
  for (const file of walk(root)) {
    try {
      const d = IMAGE.test(file) ? imageDims(file) : VIDEO.test(file) ? videoDims(file) : null;
      if (d && d[0] && d[1]) dims['/' + file.split(path.sep).join('/')] = d;
    } catch (err) {
      console.warn(`skipped ${file}: ${err.message}`);
    }
  }
}

// One file per line, sorted, so a change shows up as a readable diff.
const lines = Object.entries(dims)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([k, [w, h]]) => ` ${JSON.stringify(k)}: [${w}, ${h}]`);
fs.writeFileSync('_data/media.json', `{\n${lines.join(',\n')}\n}\n`);
console.log(`_data/media.json: ${lines.length} files`);
