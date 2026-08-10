// Nama cache DINAIKKAN VERSINYA (v3) supaya browser otomatis membuang cache lama
// milik SEMUA pengguna yang sudah pernah install aplikasi ini sebelumnya.
const CACHE_NAME = 'DI-SMADA-v3';

// [PERBAIKAN] '/' dan '/index.html' DIHAPUS dari daftar pre-cache.
// Halaman loader ini kecil dan isinya bisa berubah (mis. redirect ke Apps Script),
// jadi HARUS selalu diambil dari jaringan, bukan dari cache lama.
const urlsToCache = [
    'https://i.imghippo.com/files/F2741Cc.png'
];

// Event install: cache aset dasar yang aman untuk disimpan lama (ikon, dsb).
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

// Event activate: bersihkan SEMUA cache lama (termasuk cache versi lama index.html yang nyangkut).
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

// Event fetch: strategi caching per jenis konten.
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Selalu ambil manifest.json langsung dari jaringan (logo & nama app selalu terbaru).
    if (url.pathname.endsWith('manifest.json')) {
        event.respondWith(fetch(event.request));
        return;
    }

    // Jangan cache permintaan ke Google Apps Script karena dinamis.
    if (event.request.url.includes('script.google.com')) {
        event.respondWith(fetch(event.request));
        return;
    }

    // [PERBAIKAN UTAMA] Halaman HTML (loader / index.html / root "/") SELALU dicoba ambil dari
    // JARINGAN dulu. Cache hanya dipakai sebagai cadangan kalau benar-benar sedang offline.
    // Ini mencegah loader tersangkut menampilkan versi lama setelah ada pembaruan kode.
    const isHtmlRequest =
        event.request.mode === 'navigate' ||
        url.pathname === '/' ||
        url.pathname.endsWith('/index.html') ||
        url.pathname.endsWith('.html');

    if (isHtmlRequest) {
        event.respondWith(
            fetch(event.request).catch(() => caches.match(event.request))
        );
        return;
    }

    // Untuk aset statis lain (ikon, dsb), tetap gunakan strategi "Cache, falling back to Network".
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});
