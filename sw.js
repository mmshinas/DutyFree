const APP_CACHE = 'serendib-catalog-v6';
const IMAGE_CACHE = 'serendib-images-v1';
const ASSETS = [
  'index.html', 'manifest.json',
  'icon-192.png', 'icon-512.png',
  'icon-192-maskable.png', 'icon-512-maskable.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(APP_CACHE).then((cache) => cache.addAll(ASSETS))
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

  // App shell (index.html, manifest, icons): network-first, so genuine
  // updates (new features, price changes, etc.) always reach the device
  // the next time it's opened online. Falls back to the cached copy when
  // offline, which is what matters most for actual inflight use.
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if(response && response.ok){
          caches.open(APP_CACHE).then((cache) => cache.put(event.request, response.clone()));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
