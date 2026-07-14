const CACHE_NAME = "iron-log-v2";
const ASSETS = ["./", "./index.html", "./manifest.json", "./icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  // Don't wait for old tabs/home-screen instances to close before taking over.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  // Take control of any already-open pages (like the home screen app) right away.
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;

  // For the page itself (navigations), always try the network first so you
  // get the latest version. Only fall back to the cache if you're offline.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          caches.open(CACHE_NAME).then((cache) => cache.put(req, res.clone()));
          return res;
        })
        .catch(() => caches.match(req).then((cached) => cached || caches.match("./index.html")))
    );
    return;
  }

  // For everything else (icons, manifest), cache-first is fine.
  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req))
  );
});
