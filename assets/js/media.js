// Media that loads and plays only around the screen.
//
// Images and videos marked data-reveal start hidden over a flat grey block
// (see _base.scss) and fade in once they've loaded and are on screen. Looping
// videos (data-autoplay) carry preload="none", so nothing downloads until one
// nears the viewport; they play while visible and pause when they leave.
// Playback starts only when the viewer allows motion, and each video's toggle
// can pause its loop (WCAG 2.2.2); a loop the viewer paused stays paused.
// Swup replaces the page content, so this runs on every page view and its
// observers are disconnected before the swap.

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

// How far ahead of the viewport a video starts downloading: enough for its
// first frames to arrive as it scrolls in, not so much that videos below the
// fold download with the page.
const LOAD_AHEAD = '300px 0px';
// How much of an item must be on screen before it fades in and plays.
const ON_SCREEN = 0.15;

let near = null;
let seen = null;
let videoCount = 0;

const isVideo = (el) => el.tagName === 'VIDEO';
const hasLoaded = (el) => (isVideo(el) ? el.readyState >= 2 : el.complete && el.naturalWidth > 0);

// Fade in now if the file is ready, otherwise as soon as it is. An error
// reveals too, so a broken file never leaves the grey block behind.
function reveal(el) {
  if (!el.hasAttribute('data-reveal') || el.classList.contains('is-revealed')) return;
  const show = () => el.classList.add('is-revealed');
  if (hasLoaded(el)) return show();
  el.addEventListener(isVideo(el) ? 'loadeddata' : 'load', show, { once: true });
  el.addEventListener('error', show, { once: true });
}

// Start downloading a video that is about to come on screen. With reduced
// motion it still loads, to show its first frame, but never plays on its own.
function fetchVideo(video) {
  if (video.dataset.fetched) return;
  video.dataset.fetched = '1';
  // Raising preload from "none" is what starts the download. Calling load()
  // here instead would restart any download already under way, and the hero
  // (preload="auto") can report itself idle while its first request runs.
  video.preload = 'auto';
}

function play(video) {
  if (reduceMotion.matches || video.dataset.userPaused) return;
  video.play().catch(() => {});
}

function onNear(entries) {
  for (const { target, isIntersecting } of entries) {
    if (isIntersecting && isVideo(target)) fetchVideo(target);
  }
}

function onSeen(entries) {
  for (const { target, isIntersecting } of entries) {
    if (isIntersecting) {
      reveal(target);
      if (target.matches('video[data-autoplay]')) {
        fetchVideo(target);
        play(target);
      }
    } else if (target.matches('video[data-autoplay]') && !target.paused) {
      target.pause();
    }
  }
}

// The pause/play button under a looping video. The button reflects the
// video's state, and a click records the viewer's choice so scrolling away
// and back doesn't override it.
function wireToggle(video) {
  const toggle = video.parentElement.querySelector('.video-toggle');
  if (!toggle || toggle.dataset.wired) return;
  toggle.dataset.wired = '1';

  // Every button reads 'Pause animation'; its description is the video's own
  // label, so a screen reader can tell which animation it controls.
  if (video.hasAttribute('aria-label')) {
    video.id ||= `video-${++videoCount}`;
    toggle.setAttribute('aria-describedby', video.id);
  }

  const sync = () => {
    toggle.classList.toggle('is-paused', video.paused);
    toggle.setAttribute('aria-label', video.paused ? 'Play animation' : 'Pause animation');
  };
  video.addEventListener('play', sync);
  video.addEventListener('pause', sync);
  toggle.addEventListener('click', () => {
    if (video.paused) {
      delete video.dataset.userPaused;
      fetchVideo(video);
      video.play().catch(sync);
    } else {
      video.dataset.userPaused = '1';
      video.pause();
    }
  });
  toggle.hidden = false;
  sync();
}

export function initMedia() {
  destroyMedia();
  near = new IntersectionObserver(onNear, { rootMargin: LOAD_AHEAD });
  seen = new IntersectionObserver(onSeen, { threshold: ON_SCREEN });

  document.querySelectorAll('[data-reveal], video[data-autoplay]').forEach((el) => {
    if (isVideo(el)) near.observe(el);
    seen.observe(el);
    if (el.matches('video[data-autoplay]')) {
      el.muted = true;
      wireToggle(el);
    }
  });
}

export function destroyMedia() {
  near?.disconnect();
  seen?.disconnect();
  near = seen = null;
}
