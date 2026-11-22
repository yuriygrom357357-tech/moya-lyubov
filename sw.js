// Офлайн-режим: застосунок відкривається без інтернету
const V = 'ml-v13';
const CORE = ['./', 'index.html', 'css/app.css', 'js/app.js', 'js/db.js', 'js/i18n.js', 'js/scenes.js', 'js/editor.js', 'js/services.js', 'js/i18n2.js', 'js/stickers.js', 'js/effects.js', 'js/worlds.js', 'js/mockups.js', 'js/figures.js', 'js/i18n3.js', 'js/i18n4.js', 'js/license.js', 'js/nacl.min.js', 'manifest.webmanifest',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png',
  'fonts/comfortaa-cyrillic-400-normal.woff2', 'fonts/comfortaa-cyrillic-700-normal.woff2', 'fonts/comfortaa-latin-400-normal.woff2', 'fonts/comfortaa-latin-700-normal.woff2',
  'fonts/marck-script-cyrillic-400-normal.woff2', 'fonts/marck-script-latin-400-normal.woff2', 'fonts/lobster-cyrillic-400-normal.woff2', 'fonts/lobster-latin-400-normal.woff2', 'fonts/neucha-cyrillic-400-normal.woff2', 'fonts/neucha-latin-400-normal.woff2', 'fonts/amatic-sc-cyrillic-700-normal.woff2', 'fonts/amatic-sc-latin-700-normal.woff2', 'fonts/great-vibes-cyrillic-400-normal.woff2', 'fonts/great-vibes-latin-400-normal.woff2', 'fonts/bad-script-cyrillic-400-normal.woff2', 'fonts/bad-script-latin-400-normal.woff2'];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V && k !== 'ml-ext').map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.hostname.includes('googleapis.com')) return;
  if (u.origin === location.origin) {
    // мережа спершу (свіжі оновлення), кеш — коли офлайн
    e.respondWith(fetch(e.request).then(r => { const c = r.clone(); caches.open(V).then(x => x.put(e.request, c)); return r; }).catch(() => caches.match(e.request).then(r => r || caches.match('index.html'))));
  } else if (/jsdelivr|staticimgly/.test(u.hostname)) {
    // модель вирізання фону кешується після першого завантаження
    e.respondWith(caches.open('ml-ext').then(async c => (await c.match(e.request)) || fetch(e.request).then(r => { if (r.ok) c.put(e.request, r.clone()); return r; })));
  }
});
