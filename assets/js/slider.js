// Arrow buttons for the horizontal sliders (_includes/slider.html). The rail
// scrolls natively, so touch, trackpad and keyboard already work; this adds
// the buttons, steps them by one slide, hides them when every slide already
// fits, and lets a mouse drag the rail as a finger would. Swup swaps page content, so sliders are set up on each page
// view and their observers are dropped before the content is replaced.

const running = new Set();

// Width from which the arrows hang beside the slider's introducing paragraph.
const hangQuery = window.matchMedia('(min-width: 60rem)');

function setupSlider(slider) {
  const rail = slider.querySelector('.slider-rail');
  const prev = slider.querySelector('[data-slider-prev]');
  const next = slider.querySelector('[data-slider-next]');
  if (!rail || !prev || !next) return;

  // One slide plus the gap between slides: the distance from one slide's left
  // edge to the next one's.
  const step = () => {
    const slide = rail.querySelector('.slide');
    if (!slide) return rail.clientWidth;
    const gap = parseFloat(getComputedStyle(rail).columnGap) || 0;
    return slide.getBoundingClientRect().width + gap;
  };

  // How far the buttons scroll. They stop once the second to last slide sits on
  // the grid line, since the last slide is already in view alongside it, which
  // saves a click into mostly empty rail. On a window too narrow for that to be
  // true, they go on to the slide that brings the last one fully into view.
  const limit = () => {
    const max = rail.scrollWidth - rail.clientWidth;
    const slides = rail.querySelectorAll('.slide');
    if (slides.length < 2) return max;

    const distance = step();
    const inset = parseFloat(getComputedStyle(rail).paddingLeft) || 0;
    const width = slides[0].getBoundingClientRect().width;
    const secondToLastOnGrid = (slides.length - 2) * distance;
    // Rounded up to a whole slide: the rail snaps to slide edges, so any stop
    // in between would be pulled to one.
    const lastFullyInView = Math.ceil((inset + (slides.length - 1) * distance + width - rail.clientWidth) / distance) * distance;

    return Math.max(0, Math.min(max, Math.max(secondToLastOnGrid, lastFullyInView)));
  };

  const setState = (position, end) => {
    const fits = end <= 1;
    prev.hidden = fits;
    next.hidden = fits;
    slider.classList.toggle('is-draggable', !fits);
    prev.disabled = position <= 1;
    next.disabled = position >= end - 1;
  };

  const update = () => setState(rail.scrollLeft, limit());

  // Set the buttons from where the rail is heading, not where it is: the scroll
  // event lags a frame behind the click, and a button left disabled in between
  // would swallow the next press.
  // Land on a whole slide every time, so the slide arriving from either side
  // sits on the grid line the rail starts from. Counting from the current
  // position in steps also re-aligns the rail after a free swipe or trackpad
  // scroll left it part way between slides.
  const go = (direction) => {
    const end = limit();
    const distance = step();
    const index = Math.round(rail.scrollLeft / distance);
    const target = Math.max(0, Math.min(end, (index + direction) * distance));
    rail.scrollTo({ left: target });
    setState(target, end);
  };

  // Mouse drag. A finger already scrolls the rail natively; this gives the
  // mouse the same grab and throw. Past a few pixels it counts as a drag, and
  // on release the rail settles on a whole slide, a fifth of a slide being
  // enough to move on to the next. The click that ends a drag is swallowed,
  // so letting go over a link doesn't follow it.
  const THRESHOLD = 5;
  let drag = null;

  // Snapping stays off until the glide to the chosen slide ends; switched back
  // on mid-glide, it would jump to the nearest slide instead. scrollend isn't
  // everywhere yet, so a timer backs it up.
  // The scrollend that the drag itself may fire is ignored: only arriving at
  // the target counts.
  const settle = (target) => {
    rail.classList.add('is-settling');
    const done = () => {
      clearTimeout(timer);
      rail.removeEventListener('scrollend', arrived);
      rail.classList.remove('is-settling');
    };
    const arrived = () => { if (Math.abs(rail.scrollLeft - target) < 2) done(); };
    const timer = setTimeout(done, 1000);
    rail.addEventListener('scrollend', arrived);
  };

  const release = () => {
    if (!drag) return;
    const { moved } = drag;
    drag = null;
    if (!moved) {
      rail.classList.remove('is-dragging');
      return;
    }
    const end = limit();
    const distance = step();
    const raw = rail.scrollLeft / distance;
    const index = moved > 0 ? Math.ceil(raw - 0.2) : Math.floor(raw + 0.2);
    const target = Math.max(0, Math.min(end, index * distance));
    settle(target);
    rail.classList.remove('is-dragging');
    rail.scrollTo({ left: target });
    setState(target, end);
  };

  rail.addEventListener('pointerdown', (event) => {
    if (event.pointerType !== 'mouse' || event.button !== 0 || !slider.classList.contains('is-draggable')) return;
    drag = { id: event.pointerId, x: event.clientX, left: rail.scrollLeft, moved: 0, dragging: false };
  });
  rail.addEventListener('pointermove', (event) => {
    if (!drag || event.pointerId !== drag.id) return;
    const dx = event.clientX - drag.x;
    if (!drag.dragging) {
      if (Math.abs(dx) < THRESHOLD) return;
      drag.dragging = true;
      rail.setPointerCapture(drag.id);
      rail.classList.add('is-dragging');     // smooth scrolling off while held
    }
    rail.scrollLeft = drag.left - dx;
    drag.moved = -dx;
  });
  rail.addEventListener('pointerup', release);
  rail.addEventListener('pointercancel', release);
  rail.addEventListener('lostpointercapture', release);
  rail.addEventListener('click', (event) => {
    if (!rail.dataset.justDragged) return;
    event.preventDefault();
    event.stopPropagation();
  }, true);
  // Mark the click that follows a drag; it fires straight after pointerup.
  rail.addEventListener('pointerup', () => {
    if (!rail.classList.contains('is-dragging')) return;
    rail.dataset.justDragged = '1';
    setTimeout(() => delete rail.dataset.justDragged);
  }, { capture: true });
  // Images and links would otherwise start the browser's own drag and drop.
  rail.addEventListener('dragstart', (event) => event.preventDefault());

  prev.addEventListener('click', () => go(-1));
  next.addEventListener('click', () => go(1));
  rail.addEventListener('scroll', update, { passive: true });

  // From md, lift the arrows out of the flow so they hang from the top line of
  // the paragraph introducing the slider, in the column beside it. Below md
  // there's no column beside the text, so they stay under the rail.
  const nav = slider.querySelector('.slider-nav');
  const intro = slider.previousElementSibling;
  const hang = () => {
    if (!nav) return;
    const beside = hangQuery.matches && intro && intro.tagName === 'P';
    slider.classList.toggle('has-hung-nav', Boolean(beside));
    // Keep the document in reading order, so Tab meets the arrows where they
    // appear: before the slides when they hang above them, after otherwise.
    const wanted = beside ? rail : null;
    if (beside ? nav.nextElementSibling !== rail : nav.nextElementSibling !== null) {
      slider.insertBefore(nav, wanted);
    }
    nav.style.top = beside
      ? `${intro.getBoundingClientRect().top - slider.getBoundingClientRect().top}px`
      : '';
  };

  const observer = new ResizeObserver(() => { update(); hang(); });
  observer.observe(rail);
  if (intro) observer.observe(intro);
  hangQuery.addEventListener('change', hang);
  running.add({ observer, cleanup: () => hangQuery.removeEventListener('change', hang) });

  update();
  hang();
  document.fonts?.ready.then(hang);   // the paragraph's height settles once the webfont loads
}

export function initSliders() {
  document.querySelectorAll('[data-slider]').forEach(setupSlider);
}

export function destroySliders() {
  running.forEach(({ observer, cleanup }) => {
    observer.disconnect();
    cleanup?.();
  });
  running.clear();
}
