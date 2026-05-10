// ════════════════════════════════════════════════════════════════════════
//  Work Tracker — Service Worker
// ────────────────────────────────────────────────────────────────────────
//  Strategy:
//    • Bump CACHE_VERSION whenever you ship a new index.html. Old caches
//      are deleted automatically on activate.
//    • HTML (index.html, "/"): NETWORK-FIRST — always try the network so
//      updates land immediately; fall back to cache only when offline.
//    • Icons & manifest: CACHE-FIRST — these change rarely and are small.
//    • Firebase / Google APIs / fonts: PASS-THROUGH — never intercepted,
//      so auth and data sync always use fresh network responses.
//    • Anything else: pass-through to network with a graceful offline
//      cache lookup.
// ════════════════════════════════════════════════════════════════════════

const CACHE_VERSION = 'wt-v2';
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-180.png',
  './icon-192.png',
  './icon-512.png',
  './favicon-32.png'
];

// Domains we should NEVER intercept — pass straight to network
const PASSTHROUGH_HOSTS = [
  'firebaseio.com',
  'firebaseapp.com',
  'googleapis.com',
  'gstatic.com',
  'firestore.googleapis.com',
  'identitytoolkit.googleapis.com',
  'securetoken.googleapis.com',
  'fonts.googleapis.com',
  'fonts.gstatic.com'
];

// ── Install: pre-cache the shell ──────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(cache => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
      .catch(err => console.warn('[SW] install precache failed', err))
  );
});

// ── Activate: drop old caches ─────────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// ── Fetch handler ─────────────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  const req = event.request;

  // Never intercept non-GET (POSTs to Firebase, etc.)
  if (req.method !== 'GET') return;

  let url;
  try { url = new URL(req.url); } catch { return; }

  // Pass-through Firebase, Google APIs, fonts — always go to network
  if (PASSTHROUGH_HOSTS.some(h => url.hostname.endsWith(h))) return;

  // Only handle our own origin
  if (url.origin !== self.location.origin) return;

  // HTML / navigation requests: network-first, fall back to cache
  const isHtml =
    req.mode === 'navigate' ||
    req.headers.get('accept')?.includes('text/html') ||
    url.pathname === '/' ||
    url.pathname.endsWith('/index.html');

  if (isHtml) {
    event.respondWith(
      fetch(req)
        .then(resp => {
          // Update cache in background
          const copy = resp.clone();
          caches.open(CACHE_VERSION).then(c => c.put(req, copy)).catch(()=>{});
          return resp;
        })
        .catch(() => caches.match(req).then(r => r || caches.match('./index.html')))
    );
    return;
  }

  // Other same-origin assets (icons, manifest): cache-first
  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;
      return fetch(req).then(resp => {
        if (resp && resp.status === 200 && resp.type === 'basic') {
          const copy = resp.clone();
          caches.open(CACHE_VERSION).then(c => c.put(req, copy)).catch(()=>{});
        }
        return resp;
      });
    })
  );
});

// ── Allow page to trigger an immediate skip-waiting ──────────────────────
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});
