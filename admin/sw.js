const CACHE = 'theridecr-admin-shell-v1';
const SHELL = ['/admin/offline.html', '/icon-192.png', '/icon-512.png'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('theridecr-admin-shell-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || event.request.method !== 'GET') return;
  // API responses, sessions, and customer records are never put in a cache.
  if (event.request.mode === 'navigate' && url.pathname.startsWith('/admin/')) {
    event.respondWith(fetch(event.request).catch(() => caches.match('/admin/offline.html')));
  } else if (SHELL.includes(url.pathname)) {
    event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request)));
  }
});

self.addEventListener('push', event => {
  let payload = {};
  try { payload = event.data?.json() || {}; } catch { /* Use a safe generic message. */ }
  const id = typeof payload.reservationId === 'string' ? payload.reservationId : '';
  event.waitUntil(self.registration.showNotification(payload.test ? 'TheRideCR · Aviso de prueba' : 'TheRideCR · Nueva reserva', {
    body: payload.test ? 'Los avisos están funcionando en este dispositivo.' : 'Hay una nueva solicitud de viaje. Abre Admin para revisarla.',
    icon: '/icon-192.png',
    badge: '/favicon.svg',
    tag: id ? `reservation-${id}` : 'theridecr-admin-notification',
    data: { url: id ? `/admin/?reservation=${encodeURIComponent(id)}` : '/admin/' }
  }));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = new URL(event.notification.data?.url || '/admin/', self.location.origin);
  if (url.origin !== self.location.origin || !url.pathname.startsWith('/admin/')) return;
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(async windows => {
    const existing = windows.find(client => new URL(client.url).pathname.startsWith('/admin/'));
    if (existing) {
      await existing.navigate(url.href);
      return existing.focus();
    }
    return self.clients.openWindow(url.href);
  }));
});
