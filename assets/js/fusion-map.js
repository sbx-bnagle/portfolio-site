// Interactive map of U.S. fusion research sites (_includes/fusion-map.html),
// ported from the map on usfusionenergy.org. Mapbox GL comes from Mapbox's CDN,
// and only once a map is on the page and about to scroll into view: every map
// start counts as a load on the usfusionenergy Mapbox account. Swup swaps page
// content, so maps start on each page view and are removed before the content
// they live in is replaced (see transitions.js).

const MAPBOX_GL = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl';
const STYLE = 'mapbox://styles/usfusionenergy/ckuspi39r019f14o1loblm1ih';

// Location types, in filter order, with the original point colors.
const TYPES = [
  { name: 'Academic', color: '#feb5e2' },
  { name: 'Industry', color: '#f6cd9c' },
  { name: 'Federal Laboratory', color: '#a8d6c4' },
  { name: 'Advocacy Group', color: '#a9e4ff' },
];

const layerId = (type) => `poi-${type.replace(/\s/g, '')}`;
const POINT_LAYERS = TYPES.map(({ name }) => layerId(name));

// The original map's typeface, for the filters and details popups.
const ARIMO = 'https://fonts.googleapis.com/css2?family=Arimo:wght@400;700&display=swap';

let mapboxLoader;
const running = new Set();

function addStylesheet(href) {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  document.head.append(link);
}

function loadMapbox() {
  mapboxLoader ??= new Promise((resolve, reject) => {
    addStylesheet(`${MAPBOX_GL}.css`);
    addStylesheet(ARIMO);

    const script = document.createElement('script');
    script.src = `${MAPBOX_GL}.js`;
    script.onload = () => resolve(window.mapboxgl);
    script.onerror = () => {
      mapboxLoader = null;
      reject(new Error('Mapbox GL failed to load'));
    };
    document.head.append(script);
  });
  return mapboxLoader;
}

export function initMaps() {
  document.querySelectorAll('.fusion-map').forEach((el) => {
    if (!el.dataset.token) return;          // no token: the fallback image stays

    const record = { map: null };
    record.observer = new IntersectionObserver((entries) => {
      if (!entries[0].isIntersecting) return;
      record.observer.disconnect();
      startMap(el, record).catch((error) => console.warn('Fusion map:', error));
    }, { rootMargin: '400px 0px' });
    record.observer.observe(el);
    running.add(record);
  });
}

export function destroyMaps() {
  running.forEach(({ observer, map, cleanup }) => {
    observer.disconnect();
    cleanup?.();
    map?.remove();
  });
  running.clear();
}

async function startMap(el, record) {
  const [mapboxgl, data] = await Promise.all([
    loadMapbox(),
    fetch(el.dataset.src).then((response) => response.json()),
  ]);
  // The visitor already left the page, or there's no WebGL: keep the fallback.
  if (!el.isConnected || !mapboxgl.supported()) return;

  mapboxgl.accessToken = el.dataset.token;

  // A couple of entries have no location yet; they can't be placed.
  const features = data.features.filter((feature) => feature.geometry);
  const bounds = features.reduce(
    (box, feature) => box.extend(feature.geometry.coordinates),
    new mapboxgl.LngLatBounds(),
  );
  const shown = new Set(TYPES.map(({ name }) => name));
  const visible = () => ({
    type: 'FeatureCollection',
    features: features.filter((feature) => shown.has(feature.properties.type)),
  });

  const filters = el.querySelector('.fusion-map-filters');
  const overlay = window.matchMedia('(min-width: 60rem)');   // md: filters float over the map
  const touch = window.matchMedia('(pointer: coarse)').matches;

  const map = new mapboxgl.Map({
    container: el.querySelector('.fusion-map-canvas'),
    style: STYLE,
    bounds,
    attributionControl: false,
    dragRotate: false,
    pitchWithRotate: false,
    // Touch: two fingers pan the map, so one finger still scrolls the page.
    cooperativeGestures: touch,
  });
  record.map = map;

  if (!touch) map.scrollZoom.disable();     // the mouse wheel scrolls the page
  map.touchZoomRotate.disableRotation();
  map.addControl(new mapboxgl.NavigationControl({ showCompass: false }));
  // Tab order follows the screen: the zoom buttons sit at the top right, so
  // they come before the map and its points rather than after them.
  const container = map.getContainer();
  container.insertBefore(container.querySelector('.mapboxgl-ctrl-top-right'), map.getCanvasContainer());
  map.on('error', (event) => console.warn('Fusion map:', event.error?.message ?? event));

  // Fit every location, leaving room for the filters where they float over the
  // map, then start a little further out than that tight fit. Only when the
  // map's width changes, so phone scrolling (which resizes the window) doesn't
  // undo the visitor's panning and zooming.
  const zoomOut = 0.5;
  let fittedWidth = 0;
  const fit = () => {
    const width = map.getContainer().clientWidth;
    if (width === fittedWidth) return;
    fittedWidth = width;
    const edge = overlay.matches ? 32 : 16;
    const left = overlay.matches ? filters.offsetLeft + filters.offsetWidth + edge : edge;
    map.fitBounds(bounds, { padding: { top: edge, right: edge, bottom: edge, left }, duration: 0 });
    map.setZoom(map.getZoom() - zoomOut);
  };

  map.on('load', () => {
    map.addSource('locations', {
      type: 'geojson',
      data: visible(),
      cluster: true,
      clusterMaxZoom: 8,
      clusterRadius: 30,
    });

    map.addLayer({
      id: 'clusters',
      type: 'circle',
      source: 'locations',
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': '#E87498',
        'circle-radius': ['step', ['get', 'point_count'], 13, 2, 19, 6, 36, 12, 44],
      },
    });

    map.addLayer({
      id: 'cluster-count',
      type: 'symbol',
      source: 'locations',
      filter: ['has', 'point_count'],
      layout: {
        'text-field': '{point_count_abbreviated}',
        'text-font': ['Arimo Bold'],
        'text-size': 12,
        'text-offset': [0, 0.125],
      },
      paint: { 'text-color': '#591952' },
    });

    TYPES.forEach(({ name, color }) => {
      map.addLayer({
        id: layerId(name),
        type: 'circle',
        source: 'locations',
        filter: ['all', ['!', ['has', 'point_count']], ['==', ['get', 'type'], name]],
        paint: { 'circle-color': color, 'circle-radius': 7.5 },
      });
    });

    // From md the filters float over the map's top-left corner, so they come
    // first in the tab order; below md they sit under the map, and come after.
    const placeFilters = () => {
      const view = el.querySelector('.fusion-map-view');
      if (overlay.matches) el.insertBefore(filters, view);
      else view.after(filters);
    };
    placeFilters();
    overlay.addEventListener('change', placeFilters);
    record.cleanup = () => overlay.removeEventListener('change', placeFilters);

    buildFilters(filters, (type, on) => {
      if (on) shown.add(type);
      else shown.delete(type);
      map.getSource('locations').setData(visible());
    });

    // Hovering a point shows its details; they stay open so their links can be
    // used. Taps and clicks: a point opens its details, a cluster zooms in on
    // its locations, anywhere else closes the details.
    const popup = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
      // Opening shouldn't pull focus in: the details open on hover and as a
      // point takes keyboard focus, and Enter is what moves into them.
      focusAfterOpen: false,
      maxWidth: '18rem',
      className: 'fusion-map-popup',
    });
    const detailsId = `${el.id || 'fusion-map'}-details`;
    const openPopup = (feature) => {
      const content = popupContent(feature.properties);
      content.id = detailsId;
      popup
        .setLngLat(feature.geometry.coordinates.slice())
        .setDOMContent(content)
        .addTo(map);
    };
    const pointer = (cursor) => () => { map.getCanvas().style.cursor = cursor; };

    POINT_LAYERS.forEach((id) => {
      map.on('mouseenter', id, (event) => {
        pointer('pointer')();
        openPopup(event.features[0]);
      });
      map.on('mouseleave', id, pointer(''));
    });
    map.on('mouseenter', 'clusters', pointer('pointer'));
    map.on('mouseleave', 'clusters', pointer(''));

    map.on('click', (event) => {
      const [feature] = map.queryRenderedFeatures(event.point, { layers: ['clusters', ...POINT_LAYERS] });
      if (feature && feature.layer.id !== 'clusters') {
        openPopup(feature);
        return;
      }
      popup.remove();
      if (!feature) return;
      map.getSource('locations').getClusterExpansionZoom(feature.properties.cluster_id, (error, zoom) => {
        if (!error) map.easeTo({ center: feature.geometry.coordinates, zoom });
      });
    });

    keyboardPoints(mapboxgl, map, { popup, openPopup, detailsId });

    fit();
    map.on('resize', fit);
    el.classList.add('is-ready');
  });
}

// Keyboard access to the points. The map draws them in WebGL, so there is
// nothing to focus: this lays an invisible button over each point and cluster
// it has drawn, kept in step as the map pans, zooms and filters. Mouse and
// touch never meet them (pointer-events: none). Together they take one Tab
// stop, and the arrow keys move between them left to right. Focusing a
// point opens its details, as hovering does; Enter moves into the details and
// Escape comes back. Enter on a cluster zooms in and lands on the point
// nearest to where it was.
function keyboardPoints(mapboxgl, map, { popup, openPopup, detailsId }) {
  const entries = new Map();          // key -> { button, marker, feature }
  let order = [];                     // keys from left to right on screen
  let current = null;                 // the key that holds the Tab stop
  let refocus = null;                 // where to land after a cluster zooms

  const isCluster = (feature) => !!feature.properties.cluster;
  const keyOf = (feature) => (isCluster(feature)
    ? `c${feature.properties.cluster_id}`
    : `p${feature.properties.name}|${feature.geometry.coordinates.join(',')}`);
  const labelOf = (feature) => (isCluster(feature)
    ? `${feature.properties.point_count} locations close together. Press Enter to zoom in.`
    : `${feature.properties.name}, ${feature.properties.type}`);
  // The same sizes as the drawn circles (see the 'clusters' layer), a little larger.
  const sizeOf = (feature) => {
    if (!isCluster(feature)) return 24;
    const n = feature.properties.point_count;
    return 2 * (n < 2 ? 13 : n < 6 ? 19 : n < 12 ? 36 : 44) + 4;
  };

  function setCurrent(key) {
    current = key;
    order.forEach((k) => { entries.get(k).button.tabIndex = k === current ? 0 : -1; });
  }

  function focusNearest(lngLat) {
    const target = map.project(lngLat);
    let best = null;
    let bestDistance = Infinity;
    entries.forEach(({ feature }, key) => {
      const p = map.project(feature.geometry.coordinates);
      const distance = Math.hypot(p.x - target.x, p.y - target.y);
      if (distance < bestDistance) { best = key; bestDistance = distance; }
    });
    if (best) { setCurrent(best); entries.get(best).button.focus(); }
  }

  function move(step) {
    if (!order.length) return;
    const i = order.indexOf(current);
    const next = order[(i + step + order.length) % order.length];
    setCurrent(next);
    entries.get(next).button.focus();
  }

  function onFocus(key) {
    setCurrent(key);
    const { button, feature } = entries.get(key);
    if (isCluster(feature)) {
      popup.remove();
      button.removeAttribute('aria-describedby');
    } else {
      openPopup(feature);
      button.setAttribute('aria-describedby', detailsId);
      // Escape in the details returns to the point.
      popup.getElement()?.addEventListener('keydown', (event) => {
        if (event.key !== 'Escape') return;
        event.stopPropagation();
        button.focus();
      });
    }
  }

  function onKey(event, key) {
    const { feature } = entries.get(key);
    const handled = {
      ArrowRight: () => move(1), ArrowDown: () => move(1),
      ArrowLeft: () => move(-1), ArrowUp: () => move(-1),
      Home: () => move(-order.indexOf(current)),
      End: () => move(order.length - 1 - order.indexOf(current)),
      Escape: () => popup.remove(),
      Enter: () => activate(feature),
      ' ': () => activate(feature),
    }[event.key];
    if (!handled) return;
    // The map pans on the arrow keys too; these belong to the points.
    event.preventDefault();
    event.stopPropagation();
    handled();
  }

  function activate(feature) {
    if (!isCluster(feature)) {
      popup.getElement()?.querySelector('a')?.focus();
      return;
    }
    refocus = feature.geometry.coordinates;
    map.getSource('locations').getClusterExpansionZoom(feature.properties.cluster_id, (error, zoom) => {
      if (!error) map.easeTo({ center: feature.geometry.coordinates, zoom });
    });
  }

  function sync() {
    const drawn = map.queryRenderedFeatures({ layers: ['clusters', ...POINT_LAYERS] });
    const seen = new Set();
    let lostFocus = null;

    drawn.forEach((feature) => {
      const key = keyOf(feature);
      if (seen.has(key)) return;          // a feature can be drawn in two tiles
      seen.add(key);
      const entry = entries.get(key);
      if (entry) { entry.feature = feature; return; }

      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'fusion-map-point';
      button.tabIndex = -1;
      button.setAttribute('aria-label', labelOf(feature));
      button.style.setProperty('--size', `${sizeOf(feature)}px`);
      button.addEventListener('focus', () => onFocus(key));
      button.addEventListener('keydown', (event) => onKey(event, key));
      const marker = new mapboxgl.Marker({ element: button })
        .setLngLat(feature.geometry.coordinates)
        .addTo(map);
      entries.set(key, { button, marker, feature });
    });

    entries.forEach((entry, key) => {
      if (seen.has(key)) return;
      if (document.activeElement === entry.button) lostFocus = entry.feature.geometry.coordinates;
      entry.marker.remove();
      entries.delete(key);
    });

    // By position on screen: the map can report a longitude from a wrapped copy
    // of the world (Alaska as +212° rather than -148°), which would put it last.
    const screenX = (key) => map.project(entries.get(key).feature.geometry.coordinates).x;
    order = [...entries.keys()].sort((a, b) => screenX(a) - screenX(b));
    // Tabbing in starts from the left, unless a point already has focus.
    const focused = [...entries.keys()].find((key) => entries.get(key).button === document.activeElement);
    setCurrent(focused ?? order[0] ?? null);

    const landing = refocus ?? lostFocus;
    refocus = null;
    if (landing) focusNearest(landing);
  }

  map.on('idle', sync);
}

// One switch per location type. At least one type stays on: the last switch
// left on is locked until another is turned back on.
function buildFilters(container, onChange) {
  TYPES.forEach(({ name, color }) => {
    const label = document.createElement('label');
    label.className = 'fusion-map-filter';
    label.style.setProperty('--type-color', color);

    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = true;
    input.value = name;

    label.append(input, name);
    container.append(label);
  });

  container.addEventListener('change', ({ target }) => {
    onChange(target.value, target.checked);
    const boxes = [...container.querySelectorAll('input')];
    const on = boxes.filter((box) => box.checked);
    boxes.forEach((box) => { box.disabled = on.length === 1 && box.checked; });
  });

  container.hidden = false;
}

// Details for one location. Built as DOM rather than an HTML string, and
// skipping empty fields and the data's "XXX" placeholders.
function popupContent(props) {
  const value = (key) => (props[key] && props[key] !== 'XXX' ? String(props[key]) : '');
  const root = document.createElement('div');

  const line = (className, ...parts) => {
    const kept = parts.filter(Boolean);
    if (!kept.length) return;
    const p = document.createElement('p');
    if (className) p.className = className;
    kept.forEach((part, i) => {
      if (i) p.append(document.createElement('br'));
      p.append(part);
    });
    root.append(p);
  };
  const link = (href, text) => {
    const a = document.createElement('a');
    a.href = href;
    a.textContent = text;
    return a;
  };

  const email = value('contact_email');
  line('fusion-map-popup-type', value('type'));
  line('fusion-map-popup-name', value('url') ? link(value('url'), value('name')) : value('name'));
  line('', value('contact_address1'), value('contact_address2'));
  line('', value('contact_phone'));
  line('', email && link(`mailto:${email}`, email));
  return root;
}
