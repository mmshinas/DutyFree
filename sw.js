const APP_CACHE = 'serendib-catalog-v7';
const IMAGE_CACHE = 'serendib-images-v1';
const ASSETS = [
  'index.html', 'manifest.json',
  'icon-192.png', 'icon-512.png',
  'icon-192-maskable.png', 'icon-512-maskable.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    // cache:'reload' skips the browser's HTTP cache so the freshest files are stored, never a stale copy
    caches.open(APP_CACHE).then((cache) => Promise.all(
      ASSETS.map((a) => cache.add(new Request(a, { cache: 'reload' })).catch(() => {}))
    ))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Only clean up old *app-shell* caches. IMAGE_CACHE is intentionally left
  // alone across updates — its whole point is to persist so unchanged
  // photos are never re-downloaded just because the app itself updated.
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== APP_CACHE && k !== IMAGE_CACHE && k.indexOf('serendib-catalog-') === 0)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if(event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  // Item photos: cache-first, and cached indefinitely. Once a photo is
  // fetched once, it's never requested from the network again unless its
  // URL actually changes (e.g. a replaced photo gets a new filename) — so
  // an app update never triggers re-downloading photos that haven't changed.
  if(url.pathname.indexOf('/images/') !== -1){
    event.respondWith(
      caches.open(IMAGE_CACHE).then((cache) =>
        cache.match(event.request).then((cached) => {
          if(cached) return cached;
          return fetch(event.request)
            .then((response) => {
              if(response && response.ok) cache.put(event.request, response.clone());
              return response;
            })
            .catch(() => cached);
        })
      )
    );
    return;
  }

  // OCR engine files (crew-list screenshot reader): cache-first, kept for offline use once fetched.
  if(url.pathname.indexOf('/ocr/') !== -1){
    event.respondWith(
      caches.open(APP_CACHE).then((cache) =>
        cache.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
          if(response && response.ok) cache.put(event.request, response.clone());
          return response;
        }))
      )
    );
    return;
  }

  // App shell (index.html, manifest, icons): network-first with a short timeout, so updates reach the
  // device when online but a missing / very slow connection (typical onboard) falls straight back to
  // the saved copy. Every successful fetch refreshes the saved copy, and page navigations (the app
  // opened from "/", "/?x" or "index.html") always fall back to the saved index.html — so refreshing
  // offline keeps the latest version that was loaded online.
  const isNav = event.request.mode === 'navigate';
  const shellFallback = () =>
    caches.match(event.request, { ignoreSearch: true })
      .then((r) => r || (isNav ? (caches.match('index.html').then((x) => x || caches.match('./'))) : undefined))
      .then((r) => r || new Response('Offline — open the app once with internet so it can be saved on this device.', { status: 503, headers: { 'Content-Type': 'text/plain' } }));

  event.respondWith(
    new Promise((resolve) => {
      let settled = false;
      const timer = setTimeout(() => { if(!settled){ settled = true; shellFallback().then(resolve); } }, 4000);
      fetch(event.request, { cache: 'no-cache' })
        .then((response) => {
          if(response && response.ok){
            const copy = response.clone();
            caches.open(APP_CACHE).then((cache) => {
              cache.put(event.request, copy.clone());
              if(isNav) cache.put('index.html', copy.clone());
            });
          }
          if(!settled){ settled = true; clearTimeout(timer); resolve(response); }
        })
        .catch(() => { if(!settled){ settled = true; clearTimeout(timer); shellFallback().then(resolve); } });
    })
  );
});
