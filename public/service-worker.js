// Self-destroying service worker to clean up any legacy or stale service worker registrations
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    self.registration
      .unregister()
      .then(() => self.clients.matchAll())
      .then((clients) => {
        // Legacy service worker unregistered; subsequent requests bypass worker
      })
      .catch(() => {})
  );
});

// Do not intercept any fetch events
