/// <reference lib="webworker" />
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst, CacheFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { BackgroundSyncPlugin } from 'workbox-background-sync';

declare let self: ServiceWorkerGlobalScope;

// Precache app shell
cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

// Helper: does the request target our API? (same origin on Vercel)
const isApiRequest = ({ url }: { url: URL }) =>
  url.pathname.startsWith('/api/');

// Cache API calls with NetworkFirst (try network, fall back to cache)
registerRoute(
  ({ url }) => isApiRequest({ url }) && !['POST', 'PUT', 'PATCH', 'DELETE'].includes(''),
  new NetworkFirst({
    cacheName: 'api-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 200,
        maxAgeSeconds: 24 * 60 * 60, // 24 hours
      }),
    ],
    networkTimeoutSeconds: 10,
  })
);

// Cache static assets
registerRoute(
  ({ request }) =>
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'font',
  new StaleWhileRevalidate({
    cacheName: 'static-assets',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
      }),
    ],
  })
);

// Cache images
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 30 * 24 * 60 * 60,
      }),
    ],
  })
);

// Background sync for POST/PUT/DELETE requests that fail offline
const bgSyncPlugin = new BackgroundSyncPlugin('offline-sync-queue', {
  maxRetentionTime: 7 * 24 * 60, // retry for 7 days (in minutes)
  onSync: async ({ queue }) => {
    let entry;
    while ((entry = await queue.shiftRequest())) {
      try {
        await fetch(entry.request.clone());
        // Notify the app that sync happened
        const clients = await self.clients.matchAll();
        for (const client of clients) {
          client.postMessage({ type: 'SYNC_COMPLETE', url: entry.request.url });
        }
      } catch (error) {
        // Put failed request back in queue
        await queue.unshiftRequest(entry);
        throw error;
      }
    }
  },
});

// Queue failed mutation requests for background sync
registerRoute(
  ({ url, request }) =>
    isApiRequest({ url }) &&
    ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method),
  new NetworkFirst({
    cacheName: 'api-mutations',
    plugins: [bgSyncPlugin],
  }),
  'POST'
);

registerRoute(
  ({ url, request }) =>
    isApiRequest({ url }) &&
    ['PUT', 'PATCH'].includes(request.method),
  new NetworkFirst({
    cacheName: 'api-mutations',
    plugins: [bgSyncPlugin],
  }),
  'PUT'
);

// Listen for skip waiting message
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Notify clients on activation
self.addEventListener('activate', (event) => {
  event.waitUntil(
    self.clients.claim().then(() => {
      return self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'SW_ACTIVATED' });
        });
      });
    })
  );
});
