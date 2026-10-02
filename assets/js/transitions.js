import Swup from 'swup';
import SwupBodyClassPlugin from '@swup/body-class-plugin';
import SwupPreloadPlugin from '@swup/preload-plugin';
import SwupA11yPlugin from '@swup/a11y-plugin';
import Lenis from 'lenis'
import { initMaps, destroyMaps } from './fusion-map.js';
import { initSliders, destroySliders } from './slider.js';
import { initMedia, destroyMedia } from './media.js';
import { initProjectDetails } from './project-details.js';

const swup = new Swup({
  // .nav-links sits outside #main, so swap it too: otherwise its active state
  // (is-active, aria-current) stays stuck on whichever page loaded first.
  containers: ['#main', '.nav-links'],
  // Preload fetches a page's HTML as soon as the pointer rests on its link (or
  // a finger lands on it), so it's usually ready by the time of the click.
  // A11y announces each new page to screen readers and moves focus to its
  // main heading, as a full page load would.
  plugins: [new SwupBodyClassPlugin(), new SwupPreloadPlugin(), new SwupA11yPlugin()],
});

// Smooth, eased scrolling (Lenis), except for viewers who ask for less motion:
// they keep the browser's own scrolling.
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const lenis = reduceMotion.matches ? null : new Lenis({
  autoRaf: true,
  lerp: 0.2
});
const scrollToY = (top) =>
  lenis ? lenis.scrollTo(top, { immediate: true, force: true }) : window.scrollTo({ top, behavior: 'instant' });

// Land new pages at the top (or at their #anchor) instantly. Swup's default
// scroll uses behavior "auto", which picks up the CSS smooth scrolling and
// Lenis, so the new page rendered at the old position and then glided up.
// This only replaces scrolling on page visits: same-page anchor links stay
// smooth, and visits that shouldn't reset scroll (back/forward) are left alone.
swup.hooks.replace('content:scroll', (visit) => {
  const { target, reset } = visit.scroll;
  const hash = target ?? visit.to.hash;
  const anchor = hash && swup.getAnchorElement(hash);

  if (anchor) {
    const offset = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
    const top = anchor.getBoundingClientRect().top + window.scrollY - offset;
    scrollToY(top);
  } else if (reset) {
    scrollToY(0);
  }
});

// Lazy media (media.js): images and videos load and play around the screen,
// fading in over a grey block. Started on each page view and stopped before
// Swup swaps the content out.
initMedia();
swup.hooks.on('page:view', initMedia);
swup.hooks.before('content:replace', destroyMedia);

// Interactive maps (fusion-map.js): started on each page view, and removed
// before Swup swaps out the content they're in, which frees their WebGL context.
initMaps();
swup.hooks.on('page:view', initMaps);
swup.hooks.before('content:replace', destroyMaps);

// Horizontal sliders (slider.js): the same lifecycle, so the arrow buttons work
// after every page view and their resize observers don't outlive the content.
initSliders();
swup.hooks.on('page:view', initSliders);
swup.hooks.before('content:replace', destroySliders);

// Project details (project-details.js): collapsed below md, open beside the
// text from md up. Set as soon as the new content is in, before it shows.
swup.hooks.on('content:replace', initProjectDetails);

// Analytics (GoatCounter, loaded in production only; see _includes/footer.html).
// Its script counts the first page itself; a page reached through Swup never
// loads fully, so count it here, and bind its click counters (the resume
// download) on the new content.
swup.hooks.on('page:view', () => {
  const counter = window.goatcounter;
  if (!counter?.count) return;
  counter.count({ path: location.pathname + location.search, title: document.title });
  counter.bind_events?.();
});
