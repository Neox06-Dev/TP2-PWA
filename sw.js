// Nombre del caché para la aplicación
const CACHE_NAME = 'fittrack-cache-v2';

// Recursos esenciales para el funcionamiento offline de la aplicación
const RECURSOS_PRECACHE = [
    './',
    './index.html',
    './offline.html',
    './css/style.css',
    './js/storage.js',
    './js/app.js',
    './js/api.js',
    './js/sync.js',
    './manifest.json',
    './icons/favicon-192x192.png',
    './icons/favicon-512x512.png',
    // CDNs externos
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css',
    'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css',
    'https://unpkg.com/vue@3/dist/vue.global.js',
    'https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.browser.min.js'
];

// 1. Instalación del Service Worker y precaching de recursos
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('SW: Guardando archivos estáticos en el precaché');
                return cache.addAll(RECURSOS_PRECACHE);
            })
            .then(() => self.skipWaiting())
    );
});

// 2. Activación del Service Worker y limpieza de cachés antiguos
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) {
                        console.log('SW: Eliminando caché antiguo ocupando espacio:', key);
                        return caches.delete(key);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// 3. Interceptación de solicitudes para servir desde caché o red
self.addEventListener('fetch', (event) => {
    // Solo intercepta peticiones HTTP/HTTPS estándar (evita errores con extensiones de Chrome)
    if (!event.request.url.startsWith(self.location.origin) && !event.request.url.startsWith('http')) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                // Si el recurso ya está en el caché, lo devuelve inmediatamente (Cache First)
                if (cachedResponse) {
                    return cachedResponse;
                }

                // Si no está en el caché, intentam ir a buscarlo a la red de internet
                return fetch(event.request).catch(() => {
                    // Si falla la red (usuario offline) y se solicita una navegación (página HTML),
                    // le muestra a la página de error personalizada offline
                    if (event.request.mode === 'navigate') {
                        return caches.match('./offline.html');
                    }
                });
            })
    );
});