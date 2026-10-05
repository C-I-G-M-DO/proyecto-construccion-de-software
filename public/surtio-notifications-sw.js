/* Notification-only worker: it does not cache or intercept application/API requests. */
self.addEventListener('install', event => event.waitUntil(self.skipWaiting()));
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
self.addEventListener('push', event => {
  let message = {};
  try { const value = event.data?.json(); if (value && typeof value === 'object' && !Array.isArray(value)) message = value; } catch { /* Use a safe generic message if the payload is malformed. */ }
  const text = (value, fallback) => typeof value === 'string' && value.trim() ? value.slice(0, 300) : fallback;
  event.waitUntil(self.registration.showNotification(text(message.title, 'Surtío · Alertas de vencimiento'), {
    body: text(message.body, 'Hay alertas en tu inventario. Abre Surtío para revisarlas.'),
    icon: '/surtio-icon.png',
    tag: typeof message.tag === 'string' ? message.tag.slice(0, 128) : 'surtio-expiry',
    data: { scope: 'surtio-expiry' },
  }));
});
self.addEventListener('notificationclick', event => {
  event.notification.close();
  if (event.notification.data?.scope !== 'surtio-expiry') return;
  const target = new URL('/?notification=expiry', self.location.origin).href;
  event.waitUntil((async () => {
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const existing = clients.find(client => new URL(client.url).origin === self.location.origin);
    if (existing) { await existing.navigate(target); await existing.focus(); }
    else await self.clients.openWindow(target);
  })());
});
