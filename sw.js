// ========================================
// SERVICE WORKER - JIRAMA CHARGE MANAGER
// ========================================

const CACHE_NAME = 'jirama-v2';

const FILES_TO_CACHE = [
    './',
    './index.html',
    './style.css',
    './script.js',
    './database.js',
    './cloud-storage.js',
    './worker.js',
    './offline.html'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(FILES_TO_CACHE))
            .catch(err => console.error('[SW] Cache error:', err))
    );
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(names =>
            Promise.all(names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n)))
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    if (url.origin !== location.origin) {
        event.respondWith(
            caches.match(event.request)
                .then(r => r || fetch(event.request))
                .catch(() => caches.match('./offline.html'))
        );
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) return response;
                return fetch(event.request).then(networkResponse => {
                    const clone = networkResponse.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                    return networkResponse;
                });
            })
            .catch(() => caches.match('./offline.html'))
    );
});

self.addEventListener('message', event => {
    if (event.data === 'skipWaiting') self.skipWaiting();
});
