const CACHE = 'flowtalk-reference-v7';
const ASSETS = [
  './',
  './index.html',
  './login.html',
  './activity.html',
  './profile.html',
  './trainers.html',
  './admin.html',
  './css/main.css',
  './js/db.js',
  './js/config.js',
  './js/firebase-config.js',
  './js/auth.js',
  './js/admin-auth.js',
  './js/header-auth.js',
  './js/theme-nav.js',
  './js/main.js',
  './js/login.js',
  './js/activity.js',
  './js/profile.js',
  './js/trainers.js',
  './js/admin.js',
  './assets/flowtalk-logo.jpeg',
  './assets/sonatrach-mark.png',
  './assets/hero-scene.svg',
  './manifest.json',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).catch(() => cached))
  );
});
