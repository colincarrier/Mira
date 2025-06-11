// Development vs Production cache strategy
const isDevelopment = location.hostname === 'localhost' || location.hostname.includes('replit');
const CACHE_VERSION = isDevelopment ? `dev-${Date.now()}` : 'v1.0.0';
const CACHE_NAME = `mira-offline-${CACHE_VERSION}`;
const STATIC_CACHE = `mira-static-${CACHE_VERSION}`;
const API_CACHE = `mira-api-${CACHE_VERSION}`;

// Cache duration strategies
const CACHE_STRATEGIES = {
  development: {
    static: 5 * 60 * 1000, // 5 minutes
    api: 2 * 60 * 1000,    // 2 minutes
    images: 10 * 60 * 1000 // 10 minutes
  },
  production: {
    static: 24 * 60 * 60 * 1000, // 24 hours
    api: 30 * 60 * 1000,         // 30 minutes
    images: 7 * 24 * 60 * 60 * 1000 // 7 days
  }
};

const cacheStrategy = isDevelopment ? CACHE_STRATEGIES.development : CACHE_STRATEGIES.production;

// Static assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/mira-icon.svg',
  '/mira-logo.svg'
];

// API endpoints to cache with different strategies
const API_ENDPOINTS = {
  critical: ['/api/notes', '/api/collections', '/api/todos'], // Always cache
  optional: ['/api/stats', '/api/profile'], // Cache only when available
  realtime: ['/api/sync', '/api/notifications'] // Never cache
};

// Helper function to check if cache entry is stale
function isCacheStale(response, maxAge) {
  if (!response.headers.get('sw-cached-at')) return true;
  const cachedAt = parseInt(response.headers.get('sw-cached-at'));
  return Date.now() - cachedAt > maxAge;
}

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log(`SW Install: ${isDevelopment ? 'Development' : 'Production'} mode`);
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then(cache => {
        return cache.addAll(STATIC_ASSETS).catch(err => {
          console.warn('Failed to cache static assets:', err);
        });
      }),
      caches.open(API_CACHE).then(cache => {
        // Pre-cache will be handled by fetch events
        return Promise.resolve();
      })
    ])
  );
  self.skipWaiting();
});

// Activate event - aggressive cache cleanup in development
self.addEventListener('activate', (event) => {
  console.log('SW Activate: Cleaning up old caches');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // In development, clear all old caches aggressively
          if (isDevelopment) {
            if (!cacheName.includes(CACHE_VERSION)) {
              console.log('Deleting old dev cache:', cacheName);
              return caches.delete(cacheName);
            }
          } else {
            // In production, only clear caches not matching current version
            if (cacheName !== STATIC_CACHE && cacheName !== API_CACHE && cacheName !== CACHE_NAME) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Enhanced fetch event handler with intelligent caching
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests and external URLs
  if (request.method !== 'GET' || !url.origin.includes(location.origin)) {
    return;
  }

  // Handle different types of requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request, url));
  } else if (url.pathname.startsWith('/uploads/')) {
    event.respondWith(handleMediaRequest(request, url));
  } else {
    event.respondWith(handleStaticRequest(request, url));
  }
});

// Handle API requests with smart caching
async function handleApiRequest(request, url) {
  const isCriticalApi = API_ENDPOINTS.critical.some(endpoint => url.pathname.startsWith(endpoint));
  const isRealtimeApi = API_ENDPOINTS.realtime.some(endpoint => url.pathname.startsWith(endpoint));
  
  // Never cache realtime APIs
  if (isRealtimeApi) {
    return fetch(request).catch(() => new Response('{"error": "Network unavailable"}', {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    }));
  }

  const cache = await caches.open(API_CACHE);
  const cachedResponse = await cache.match(request);

  // In development, check cache staleness more aggressively
  if (cachedResponse && !isCacheStale(cachedResponse, cacheStrategy.api)) {
    // Return cached data but also fetch fresh data in background for critical APIs
    if (isCriticalApi && !isDevelopment) {
      fetch(request).then(response => {
        if (response.ok) {
          const responseClone = response.clone();
          const headers = new Headers(responseClone.headers);
          headers.set('sw-cached-at', Date.now().toString());
          
          const newResponse = new Response(responseClone.body, {
            status: responseClone.status,
            statusText: responseClone.statusText,
            headers: headers
          });
          
          cache.put(request, newResponse);
        }
      }).catch(() => {}); // Silent background update
    }
    return cachedResponse;
  }

  // Fetch fresh data
  try {
    const response = await fetch(request);
    if (response.ok) {
      const responseClone = response.clone();
      const headers = new Headers(responseClone.headers);
      headers.set('sw-cached-at', Date.now().toString());
      
      const newResponse = new Response(responseClone.body, {
        status: responseClone.status,
        statusText: responseClone.statusText,
        headers: headers
      });
      
      cache.put(request, newResponse);
      return response;
    } else {
      // Return cached response if available, even if stale
      return cachedResponse || response;
    }
  } catch (error) {
    // Network error - return cached response if available
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline response for critical APIs
    if (isCriticalApi) {
      return new Response(JSON.stringify({
        error: 'Offline',
        cached: false,
        message: 'This data will be available when you reconnect'
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    throw error;
  }
}

// Handle media/image requests
async function handleMediaRequest(request, url) {
  const cache = await caches.open(STATIC_CACHE);
  const cachedResponse = await cache.match(request);

  if (cachedResponse && !isCacheStale(cachedResponse, cacheStrategy.images)) {
    return cachedResponse;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      const responseClone = response.clone();
      const headers = new Headers(responseClone.headers);
      headers.set('sw-cached-at', Date.now().toString());
      
      const newResponse = new Response(responseClone.body, {
        status: responseClone.status,
        statusText: responseClone.statusText,
        headers: headers
      });
      
      cache.put(request, newResponse);
      return response;
    }
    return cachedResponse || response;
  } catch (error) {
    if (cachedResponse) {
      return cachedResponse;
    }
    // Return placeholder for missing images
    return new Response('', { status: 404 });
  }
}

// Handle static asset requests
async function handleStaticRequest(request, url) {
  const cache = await caches.open(STATIC_CACHE);
  
  // In development, always check network first for static assets
  if (isDevelopment) {
    try {
      const response = await fetch(request);
      if (response.ok) {
        const responseClone = response.clone();
        const headers = new Headers(responseClone.headers);
        headers.set('sw-cached-at', Date.now().toString());
        
        const newResponse = new Response(responseClone.body, {
          status: responseClone.status,
          statusText: responseClone.statusText,
          headers: headers
        });
        
        cache.put(request, newResponse);
        return response;
      }
    } catch (error) {
      // Fall back to cache in development if network fails
    }
  }

  const cachedResponse = await cache.match(request);
  
  if (cachedResponse && !isCacheStale(cachedResponse, cacheStrategy.static)) {
    return cachedResponse;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      const responseClone = response.clone();
      const headers = new Headers(responseClone.headers);
      headers.set('sw-cached-at', Date.now().toString());
      
      const newResponse = new Response(responseClone.body, {
        status: responseClone.status,
        statusText: responseClone.statusText,
        headers: headers
      });
      
      cache.put(request, newResponse);
      return response;
    }
    return cachedResponse || response;
  } catch (error) {
    return cachedResponse || new Response('Offline', { status: 503 });
  }
}

// Development cache busting utilities
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    console.log('Force clearing all caches for development');
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
    }).then(() => {
      event.ports[0].postMessage({ success: true });
    });
  }
  
  if (event.data && event.data.type === 'GET_CACHE_STATUS') {
    caches.keys().then(cacheNames => {
      event.ports[0].postMessage({ 
        caches: cacheNames,
        isDevelopment: isDevelopment,
        version: CACHE_VERSION
      });
    });
  }
});

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