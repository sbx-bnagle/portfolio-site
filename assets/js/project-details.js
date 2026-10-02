// The case study's scope and team (_includes/scope.html) sit in a <details>.
// From md up it's a sidebar, always open with its summary hidden; below md
// it's collapsed until the reader opens it. Run on each page view, since the
// include's inline script only runs on a full page load, and whenever the
// viewport crosses md.

const wide = window.matchMedia('(min-width: 60rem)');

const sync = () => {
  document.querySelectorAll('.scope-details').forEach((el) => { el.open = wide.matches; });
};

wide.addEventListener('change', sync);

export const initProjectDetails = sync;
