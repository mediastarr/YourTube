const CACHE = 'yt-m-v1';
const SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://www.youtube.com/s/desktop/12d6b690/img/favicon_192x192.png',
  'https://www.youtube.com/s/desktop/12d6b690/img/favicon_512x512.png',
  'https://www.youtube.com/s/desktop/12d6b690/img/favicon_144x144.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => 
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  // API calls — network first, fallback to cache
  if (e.request.url.includes('googleapis.com')) {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Everything else — cache first
  e.respondWith(
    caches.match(e.request).then(cached => 
      cached || fetch(e.request).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return res;
      })
    )
  );
});
