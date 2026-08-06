const CACHE_NAME = 'DI-SMADA'; 
const urlsToCache = [
    '/',
    '/index.html',
    // manifest.json dihapus dari sini agar tidak di-cache saat instalasi
    'https://i.imghippo.com/files/F2741Cc.png'
];

// Event install: cache file-file dasar aplikasi
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Cache dibuka, menambahkan aset ke cache');
                return cache.addAll(urlsToCache);
            })
    );
    self.skipWaiting();
});

// Event activate: bersihkan cache lama
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Menghapus cache lama:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    return self.clients.claim();
});

// Event fetch: strategi caching yang diperbarui
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // PERUBAHAN BARU: Selalu ambil manifest.json dari jaringan, jangan dari cache.
    // Ini memastikan logo dan nama aplikasi selalu yang terbaru.
    if (url.pathname.endsWith('manifest.json')) {
        event.respondWith(fetch(event.request));
        return;
    }

    // Jangan cache permintaan ke Google Apps Script karena dinamis
    if (event.request.url.includes('script.google.com')) {
        event.respondWith(fetch(event.request));
        return;
    }

    // Untuk semua aset lain, gunakan strategi "Cache, falling back to Network"
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});
