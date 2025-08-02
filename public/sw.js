// Service Worker pour NBBC Immo
// Version 1.0.0

const CACHE_NAME = 'nbbc-immo-v1.0.0';
const STATIC_CACHE = 'nbbc-static-v1.0.0';
const DYNAMIC_CACHE = 'nbbc-dynamic-v1.0.0';

// Ressources à mettre en cache lors de l'installation
const STATIC_ASSETS = [
  '/',
  '/search',
  '/chap-chap',
  '/about',
  '/faq',
  '/manifest.json',
  '/AppImages/favicon.svg',
  '/AppImages/favicon.png',
  '/AppImages/logo.png'
];

// URLs à exclure du cache
const EXCLUDED_URLS = [
  '/api/',
  '/dashboard',
  '/messages',
  '/admin',
  'chrome-extension://',
  'moz-extension://',
  'safari-extension://'
];

// Installation du Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');

  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Skip waiting');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Installation failed:', error);
      })
  );
});

// Activation du Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Claiming clients');
        return self.clients.claim();
      })
  );
});

// Intercepter les requêtes réseau
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // Exclure certaines URLs du cache
  if (EXCLUDED_URLS.some(url => requestUrl.pathname.startsWith(url))) {
    return;
  }

  // Stratégie Cache First pour les ressources statiques
  if (isStaticAsset(event.request)) {
    event.respondWith(cacheFirst(event.request));
    return;
  }

  // Stratégie Network First pour les pages
  if (isPageRequest(event.request)) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  // Stratégie Stale While Revalidate pour les images
  if (isImageRequest(event.request)) {
    event.respondWith(staleWhileRevalidate(event.request));
    return;
  }

  // Stratégie Network First par défaut
  event.respondWith(networkFirst(event.request));
});

// Vérifier si c'est un asset statique
function isStaticAsset(request) {
  const url = new URL(request.url);
  return url.pathname.includes('/AppImages/') ||
         url.pathname.includes('.css') ||
         url.pathname.includes('.js') ||
         url.pathname.includes('/manifest.json');
}

// Vérifier si c'est une requête de page
function isPageRequest(request) {
  return request.method === 'GET' &&
         request.headers.get('accept').includes('text/html');
}

// Vérifier si c'est une requête d'image
function isImageRequest(request) {
  return request.headers.get('accept').includes('image/');
}

// Stratégie Cache First
async function cacheFirst(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    const networkResponse = await fetch(request);
    if (networkResponse.status === 200) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('[SW] Cache first failed:', error);
    return new Response('Offline content not available', { status: 503 });
  }
}

// Stratégie Network First
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);

    if (networkResponse.status === 200) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', error);

    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Page offline de fallback
    if (isPageRequest(request)) {
      const fallbackResponse = await caches.match('/');
      if (fallbackResponse) {
        return fallbackResponse;
      }
    }

    return new Response('Offline', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// Stratégie Stale While Revalidate
async function staleWhileRevalidate(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const cachedResponse = await cache.match(request);

  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.status === 200) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(() => {
    return cachedResponse || new Response('Image not available offline');
  });

  return cachedResponse || fetchPromise;
}

// Gestion des notifications push (pour les futures fonctionnalités)
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/AppImages/icon-192x192.png',
    badge: '/AppImages/badge-72x72.png',
    tag: 'nbbc-notification',
    data: data.url,
    actions: [
      {
        action: 'view',
        title: 'Voir'
      },
      {
        action: 'close',
        title: 'Fermer'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Gestion des clics sur les notifications
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow(event.notification.data || '/')
    );
  }
});

// Synchronisation en arrière-plan
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  try {
    // Synchroniser les données en attente
    console.log('[SW] Background sync completed');
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

// Gestion des erreurs
self.addEventListener('error', (event) => {
  console.error('[SW] Service Worker error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('[SW] Unhandled promise rejection:', event.reason);
});

console.log('[SW] Service Worker loaded successfully');
