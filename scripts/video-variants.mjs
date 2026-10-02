// Makes the lighter copies behind the site's looping videos.
//
// For every MP4 the built pages in _site play, it writes, beside the original:
//   name.av1.mp4     AV1, for browsers that can play it (about half the size)
//   name-m.mp4       H.264 at phone width, for originals wider than 1280px
//   name-m.av1.mp4   the same in AV1
// A video that already has a hand-made phone crop (name-mobile.mp4, as the
// heroes do) gets no -m copies. _data/video.json lists what exists, with the
// AV1 codec string for each; _includes/video-sources.html turns it into
// <source>s. Existing copies newer than their original are kept.
//
// The laptop and phone composites and the photographic heroes carry grain:
// for those, AV1 strips the grain and re-synthesises it on playback, which is
// where most of the saving comes from. Clean graphics are encoded without it,
// so no noise appears on flat colour.
//
// Needs ffmpeg with libsvtav1. Run after `jekyll build` (or with `jekyll serve`
// running): npm run videos
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const SITE = '_site';
const GRAINY = /(laptop|program|phones|allocations|ar24|lcrc|scroll|reports|us-fusion-hero)/;
const PHONE_MAX = 1280;          // originals wider than this get a phone copy
const PHONE_W = (w) => (w >= 2400 ? 1200 : 960);
// Small, clean clips can come out no smaller in AV1. Offer a copy only when
// it saves at least this much over the H.264 it would replace.
const WORTH_IT = 0.9;
const smaller = (a, b) => fs.statSync(a).size <= WORTH_IT * fs.statSync(b).size;

function* walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else if (p.endsWith('.html')) yield p;
  }
}

const probe = (file, entries) =>
  JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0',
    '-show_entries', entries, '-of', 'json', file]).toString()).streams[0];

const fresh = (out, src) => fs.existsSync(out) && fs.statSync(out).mtimeMs > fs.statSync(src).mtimeMs;

function av1(src, out, { grainy, width }) {
  if (fresh(out, src)) return;
  const params = grainy ? 'fast-decode=1:film-grain=8:film-grain-denoise=1' : 'fast-decode=1';
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', src, '-an',
    ...(width ? ['-vf', `scale=${width}:-2:flags=lanczos`] : []),
    '-c:v', 'libsvtav1', '-preset', '6', '-crf', grainy ? '42' : '38', '-g', '240',
    '-svtav1-params', params, '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out]);
  console.log('  wrote', out);
}

function h264(src, out, width) {
  if (fresh(out, src)) return;
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', src, '-an',
    '-vf', `scale=${width}:-2:flags=lanczos`, '-c:v', 'libx264', '-preset', 'slow', '-crf', '24',
    '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out]);
  console.log('  wrote', out);
}

// The codecs string browsers use to decide whether they can play the AV1 copy.
function codecs(file) {
  const level = String(probe(file, 'stream=level').level ?? 8).padStart(2, '0');
  return `video/mp4; codecs="av01.0.${level}M.08"`;
}

const used = new Set();
for (const file of walk(SITE)) {
  const html = fs.readFileSync(file, 'utf8');
  for (const [, url] of html.matchAll(/src=["'](\/assets\/[^"']+?\.mp4)["']/g)) {
    if (!/(\.av1|-m)\.mp4$/.test(url)) used.add(url.replace(/\/{2,}/g, '/'));
  }
}

const manifest = {};
for (const url of [...used].sort()) {
  const src = url.slice(1);
  if (!fs.existsSync(src)) continue;
  console.log(url);
  const { width } = probe(src, 'stream=width');
  const base = src.replace(/\.mp4$/, '');
  const grainy = GRAINY.test(path.basename(src));
  const entry = {};

  av1(src, `${base}.av1.mp4`, { grainy });
  if (smaller(`${base}.av1.mp4`, src)) {
    entry.av1 = `/${base}.av1.mp4`;
    entry.av1_type = codecs(`${base}.av1.mp4`);
  }

  if (width > PHONE_MAX && !fs.existsSync(`${base}-mobile.mp4`)) {
    const w = PHONE_W(width);
    h264(src, `${base}-m.mp4`, w);
    av1(src, `${base}-m.av1.mp4`, { grainy, width: w });
    entry.m = `/${base}-m.mp4`;
    if (smaller(`${base}-m.av1.mp4`, `${base}-m.mp4`)) {
      entry.m_av1 = `/${base}-m.av1.mp4`;
      entry.m_av1_type = codecs(`${base}-m.av1.mp4`);
    }
  }
  manifest[url] = entry;
}

const lines = Object.entries(manifest).map(([k, v]) => ` ${JSON.stringify(k)}: ${JSON.stringify(v)}`);
fs.writeFileSync('_data/video.json', `{\n${lines.join(',\n')}\n}\n`);
console.log(`${lines.length} videos listed in _data/video.json`);
