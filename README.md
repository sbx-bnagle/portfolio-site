# Portfolio site — Jekyll scaffold

Low-fi wireframe. DM Sans, monochrome, placeholder boxes for all media.

## Run
```
bundle install
bundle exec jekyll serve
```
(If you don't use Bundler: `gem install jekyll` then `jekyll serve`.)

## Structure
- `index.html` — hero, sticky case-study cards (`_includes/case-study-cards.html`), client grid
- `_case_studies/` — one file per project; homepage card order set in `_config.yml` → `case_study_order`
- `about.md`, `notes.html` — the other two pages
- `_layouts/` — `default`, `case_study`, `note`
- `_includes/` — content blocks: `media-full`, `media-duo`, `media-quad`, `quote`, `stats`
- `_data/clients.yml` — logo grid (text chips until you add logo files)
- `assets/css/main.scss` — entry stylesheet; imports the partials below
- `_sass/` — Sass partials (one per component)

## Sass architecture
`sass_dir` is `_sass`. `assets/css/main.scss` is the only file with front
matter; it `@import`s the partials in dependency order and compiles to
`/assets/css/main.css`.

- `_breakpoints.scss` — `$breakpoints` map + `respondto($size)` mixin
  (`@use "sass:map"`, with an `@error` guard that fails the build on an
  unknown breakpoint name). Mobile-first (min-width): `sm` 38rem, `md` 60rem, `wide` 64rem, `lg` 100rem.
  Write responsive rules nested inside each component as upward enhancements:
  `@include respondto('md') { ... }`. Base styles are the small-screen layout.
- `_tokens.scss` — design tokens as CSS custom properties (`:root`).
- `_grid.scss` — the 8-column grid: `@mixin grid` (and a `.grid` class). Used
  as the layout backbone for the hero, about intro, and client grid; place
  children with `grid-column`. Smaller components keep their own local grids.
- `_base.scss` — reset, document, type, shared utilities (`.wrap`, `.media-frame`).
- One partial per component: `nav`, `hero`, `cards`, `clients`, `case-study`,
  `media`, `quote`, `stats`, `about`, `notes`, `footer`.

To add a component: create `_sass/_thing.scss`, then add `@import "thing";`
to `main.scss` after the foundations.

Note: the `respondto` mixin now uses the `sass:map` module, so the `map-get`
deprecation is gone. Partials are still wired with `@import`, which compiles
fine but emits its own deprecation warning on current Dart Sass; moving to
`@use` / `@forward` is a clean later step (the `sass-migrator` tool automates
it).

## Media pipeline
Images and videos get extra copies made from the built site. After adding or
replacing media, with `jekyll serve` running (or after `jekyll build`):

```
npm run media
```

That runs three steps, each of which can also run on its own:
- `npm run media:dims` — reads every image and video's pixel size into
  `_data/media.json`. The includes give each `<img>`/`<video>` its width and
  height from it, so the page holds the right space before the file loads.
- `npm run images` — AVIF and WebP copies of every JPEG/PNG the pages show,
  at widths from 160px up to the original, in `assets/img/r/`
  (`_data/responsive.json`). `_includes/picture.html` serves them.
- `npm run videos` — an AV1 copy of every video, and phone-width copies of
  those wider than 1280px (`_data/video.json`). `_includes/video-sources.html`
  serves them, with the original H.264 as the fallback. Needs ffmpeg with
  SVT-AV1.

Each step skips copies that are already newer than their original. Resized
originals keep their full-size masters in `_originals/` (not published).

## Deploying
The site publishes to GitHub Pages from `.github/workflows/pages.yml`: every
push to `main` builds it with Jekyll 4 (`JEKYLL_ENV=production`) and deploys
`_site/`. GitHub's built-in Pages build can't compile these stylesheets, so the
repository's Pages source must be set to **GitHub Actions** (Settings → Pages).

The workflow only runs Jekyll. Everything generated locally is committed, so
rebuild it before pushing changes to its sources:

| Changed | Run |
|---|---|
| Anything in `assets/js/` | `npm run build:js` |
| Images or videos a page shows | `npm run media` |
| `favicon.svg`, `favicon_512.png`, or a case study card image | `npm run social` |

After building, the workflow runs `scripts/check-media.mjs`, which stops the
deploy if a page shows an image or video that `npm run media` hasn't sized or
made copies of, and lists each file and the page it's on. Run the same check
locally with `npm run check:media` (after `jekyll build` or `jekyll serve`).

GitHub Pages compresses text files, serves video with range requests, and runs
behind a CDN. It doesn't allow custom cache headers: every file gets
`Cache-Control: max-age=600` with an ETag, so after 10 minutes a returning
visitor's browser checks each file and gets a quick `304 Not Modified` rather
than downloading it again. The CSS and JS URLs carry `?v=<build time>`, so a
deploy reaches everyone straight away.

Analytics: set `goatcounter` in `_config.yml` to the GoatCounter site code.
It loads in production builds only.

`jekyll serve` marks everything `no-store`, so locally the preloaded font
downloads twice. That's the dev server only.

## Content-block usage (in any case study or note)
```liquid
{% include media-full.html src="/assets/img/x.jpg" alt="..." caption="..." %}
{% include media-duo.html src_a="..." caption_a="..." src_b="..." caption_b="..." %}
{% include media-duo.html src_a="..." src_b="..." caption="one caption under both" %}
{% include media-quad.html src_a="..." ... src_d="..." %}
{% include quote.html text="..." cite="Name" role="Title, Org" %}
{% include stats.html n1="40%" l1="faster reviews" n2="4" l2="sites merged to one" %}
{% include fusion-map.html fallback="fusion_map.png" alt="..." caption="..." %}
{% include tweet.html author="Zap Energy" handle="@Energy_Zap" date="May 1, 2024" datetime="2024-05-01" url="https://x.com/..." text="..." %}
```

`slider.html` renders a horizontal rail of mixed slides (images, videos, social posts) from front matter, advanced by arrow buttons, a swipe, a trackpad, or the arrow keys: `{% include slider.html items=page.recognition_slides label="Recognition" %}`. Each front-matter item takes `image:` (+ `alt`, `caption`, `border`), `video:` (+ `autoplay`), a `tweet:` block with the same fields as the include below, or an `article:` block (`quote`, `publication`, `author`, `date`, `datetime`, `url`) for a press excerpt.

`tweet.html` renders a social post or article excerpt as real text instead of a screenshot, so it scales with the reader's font size and reads in a screen reader. `url` links the date to the original; `author_url` links the name and `handle_url` the handle (falling back to `author_url`); `avatar` puts an image from `/assets/img/` beside the name; `src` + `alt` add an image the post carried. Wrap two or three in `<div class="tweets"> ... </div>` to sit them side by side. The slider's `tweet:` and `article:` items take the same fields (an article uses `publication`/`publication_url` for the name and `author`/`author_url` for the byline).
Each media slot also takes `video_*` instead of `src_*`; add `autoplay_*=true` (media-duo) or `autoplay=true` (media-full) for a muted, looping video with a pause button. Leave a slot empty to keep the placeholder box.

`fusion-map.html` is the interactive U.S. Fusion map (Mapbox GL, data in `assets/data/fusion-locations.geojson`). It needs `mapbox_token` in `_config.yml`; without one it shows the fallback image.

Images, videos and the map get a hairline border. Add `border=false` to any of these includes to leave it off; in media-duo and media-quad, `border_a=false` (and so on) sets it for a single slot.

## Placeholders to replace
- `_config.yml`: `title` (your name/wordmark), `email`
- `about.md`: portrait, experience, education, recognition, lede if you want to tweak it
- Each `_case_studies/*.md`: the `[00]` stat figures, quote text/attribution, and real media
- `us-fusion.md`: verify the Apple feature before citing it
- `_data/clients.yml`: add logo files if/when you want them over text

## Note on em dashes
The About copy is em-dash-free per your preference. The case-study draft intros still contain a few — swap them when you edit.

## Working files
`_originals/` (ignored by git) holds source files that aren't part of the site:
original media, client working files, the early wireframe previews, and the
retired Fusion case study. Nothing in it is built or published.
