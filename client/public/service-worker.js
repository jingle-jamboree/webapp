/* eslint-disable no-restricted-globals */

const CACHE_NAME = 'jiit-tools-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/static/js/main.bundle.js',
    '/static/css/main.bundle.css',
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => response || fetch(event.request))
    );
});
