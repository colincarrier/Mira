const CACHE_NAME = 'mira-offline-v1';
const STATIC_CACHE = 'mira-static-v1';
const API_CACHE = 'mira-api-v1';

// Static assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/src/main.tsx',
  '/src/index.css'
];

// API endpoints to cache
const API_ENDPOINTS = [
  '/api/notes',
  '/api/collections',
  '/api/todos'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then(cache => {
        return cache.addAll(STATIC_ASSETS);
      }),
      caches.open(API_CACHE).then(cache => {
        // Pre-cache will be handled by fetch events
        return Promise.resolve();
      })
    ])
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== STATIC_CACHE && cacheName !== API_CACHE && cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - handle requests with caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleAPIRequest(request));
  }
  // Handle static assets
  else if (request.destination === 'document' || 
           request.destination === 'script' || 
           request.destination === 'style' ||
           request.destination === 'image') {
    event.respondWith(handleStaticRequest(request));
  }
});

// API request handler - Network first, then cache
async function handleAPIRequest(request) {
  const cache = await caches.open(API_CACHE);
  
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    // Cache successful GET requests
    if (request.method === 'GET' && networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Network failed, try cache for GET requests
    if (request.method === 'GET') {
      const cachedResponse = await cache.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
    }
    
    // Return offline response for failed requests
    return createOfflineResponse(request);
  }
}

// Static request handler - Cache first, then network
async function handleStaticRequest(request) {
  const cache = await caches.open(STATIC_CACHE);
  
  // Try cache first
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    // Try network if not in cache
    const networkResponse = await fetch(request);
    
    // Cache the response for future use
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Return offline page for navigation requests
    if (request.destination === 'document') {
      const offlineResponse = await cache.match('/');
      if (offlineResponse) {
        return offlineResponse;
      }
    }
    
    throw error;
  }
}

// Create offline response for failed API requests
function createOfflineResponse(request) {
  const url = new URL(request.url);
  
  // Handle different API endpoints
  if (url.pathname === '/api/notes') {
    return new Response(JSON.stringify([]), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  if (url.pathname === '/api/collections') {
    return new Response(JSON.stringify([]), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  if (url.pathname === '/api/todos') {
    return new Response(JSON.stringify([]), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // Default offline response
  return new Response(JSON.stringify({ 
    error: 'Offline', 
    message: 'This feature requires an internet connection' 
  }), {
    status: 503,
    headers: { 'Content-Type': 'application/json' }
  });
}

// Handle background sync for pending data
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(syncPendingData());
  }
});

// Sync pending data when connection is restored
async function syncPendingData() {
  try {
    // This would trigger the sync service to upload pending changes
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({ type: 'BACKGROUND_SYNC' });
    });
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Handle push notifications (future feature)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'Mira', {
        body: data.body || 'New update available',
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        tag: 'mira-notification',
        data: data.url || '/'
      })
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    self.clients.openWindow(event.notification.data || '/')
  );
});

// Message handling for communication with main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_API_RESPONSE') {
    const { url, response } = event.data;
    cacheAPIResponse(url, response);
  }
});

// Cache API response from main thread
async function cacheAPIResponse(url, responseData) {
  try {
    const cache = await caches.open(API_CACHE);
    const response = new Response(JSON.stringify(responseData), {
      headers: { 'Content-Type': 'application/json' }
    });
    await cache.put(url, response);
  } catch (error) {
    console.error('Failed to cache API response:', error);
  }
}