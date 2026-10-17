const CACHE = "josh-public-v1";
const PUBLIC_FILES = ["/offline.html", "/icon.svg", "/icon-192.png", "/icon-512.png"];
self.addEventListener("install", (event) =>
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(PUBLIC_FILES))),
);
self.addEventListener("activate", (event) =>
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("josh-public-") && key !== CACHE)
            .map((key) => caches.delete(key)),
        ),
      ),
  ),
);
// Never cache accounts, bookings, authentication, server-function responses or private content.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (PUBLIC_FILES.includes(url.pathname)) {
    event.respondWith(caches.match(url.pathname).then((cached) => cached || fetch(event.request)));
    return;
  }
  if (event.request.mode === "navigate")
    event.respondWith(fetch(event.request).catch(() => caches.match("/offline.html")));
});
