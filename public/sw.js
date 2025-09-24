const CACHE_NAME = 'luxury-rental-v1';
const CRITICAL_CACHE = 'luxury-rental-critical-v1';
const IMAGE_CACHE = 'luxury-rental-images-v1';
const API_CACHE = 'luxury-rental-api-v1';

// Critical resources that should be cached immediately
const CRITICAL_RESOURCES = [
  '/',
  '/src/main.tsx',
  '/src/index.css',
];

// Resources to cache on first request
const RUNTIME_CACHE = [
  '/src/components/',
  '/src/pages/',
  '/src/lib/',
];

// Install event - cache critical resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      // Cache critical resources
      caches.open(CRITICAL_CACHE).then((cache) => {
        return cache.addAll(CRITICAL_RESOURCES.filter(url => url !== '/'));
      }),
      // Skip waiting to activate immediately
      self.skipWaiting()
    ])
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              return !cacheName.startsWith('luxury-rental-') || 
                     cacheName.endsWith('-v0'); // Remove old versions
            })
            .map((cacheName) => caches.delete(cacheName))
        );
      }),
      // Take control immediately
      self.clients.claim()
    ])
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Handle different types of requests with different strategies
  if (url.pathname.startsWith('/api/')) {
    // API requests - Network first with cache fallback
    event.respondWith(networkFirstStrategy(request, API_CACHE));
  } else if (isImageRequest(request)) {
    // Images - Cache first with network fallback
    event.respondWith(cacheFirstStrategy(request, IMAGE_CACHE));
  } else if (isCriticalResource(request)) {
    // Critical resources - Cache first
    event.respondWith(cacheFirstStrategy(request, CRITICAL_CACHE));
  } else if (isStaticAsset(request)) {
    // Other static assets - Cache first
    event.respondWith(cacheFirstStrategy(request, CACHE_NAME));
  } else {
    // HTML/pages - Network first with cache fallback
    event.respondWith(networkFirstStrategy(request, CACHE_NAME));
  }
});

// Network first strategy (for dynamic content)
async function networkFirstStrategy(request, cacheName) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    // If successful, cache the response
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      
      // Only cache successful responses
      if (networkResponse.status === 200) {
        // Clone the response before caching
        cache.put(request, networkResponse.clone());
      }
    }
    
    return networkResponse;
  } catch (error) {
    // Network failed, try cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // If no cache, return offline page or error
    return new Response('Offline - Content not available', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// Cache first strategy (for static assets)
async function cacheFirstStrategy(request, cacheName) {
  // Try cache first
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    // Return cached version immediately
    backgroundFetch(request, cacheName); // Update cache in background
    return cachedResponse;
  }
  
  // Not in cache, fetch from network
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    return new Response('Offline - Content not available', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// Background fetch to update cache
async function backgroundFetch(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
  } catch (error) {
    // Background fetch failed, keep existing cache
  }
}

// Helper functions to identify request types
function isImageRequest(request) {
  return request.destination === 'image' || 
         /\.(jpg|jpeg|png|gif|webp|svg|ico)$/i.test(new URL(request.url).pathname);
}

function isCriticalResource(request) {
  const url = new URL(request.url);
  return CRITICAL_RESOURCES.some(resource => url.pathname.includes(resource));
}

function isStaticAsset(request) {
  const url = new URL(request.url);
  return /\.(js|css|woff|woff2|ttf|eot)$/i.test(url.pathname);
}

// Handle background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(handleBackgroundSync());
  }
});

async function handleBackgroundSync() {
  // Handle any pending offline actions
  // This could include form submissions, bookings, etc.
  console.log('Background sync triggered');
}

// Handle push notifications (if needed)
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  const options = {
    body: event.data.text(),
    icon: '/icon-192x192.png',
    badge: '/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };
  
  event.waitUntil(
    self.registration.showNotification('Luxury Rental Update', options)
  );
});