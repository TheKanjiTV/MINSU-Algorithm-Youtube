const SW_VERSION = "ytlearn-sw-v2";
const SHELL_CACHE = `${SW_VERSION}-shell`;
const STATIC_CACHE = `${SW_VERSION}-static`;
const MEDIA_CACHE = `${SW_VERSION}-media`;
const OFFLINE_URL = "/offline.html";

const MAX_MEDIA_ITEMS = 60;

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const shell = await caches.open(SHELL_CACHE);
      await shell.addAll([OFFLINE_URL, "/"]);
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => !key.startsWith(SW_VERSION))
          .map((key) => caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

function isApiRequest(url) {
  return url.pathname.startsWith("/api/");
}

function isStaticAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.endsWith(".js") ||
    url.pathname.endsWith(".css")
  );
}

function isImageOrFont(request, url) {
  return (
    request.destination === "image" ||
    request.destination === "font" ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".jpg") ||
    url.pathname.endsWith(".jpeg") ||
    url.pathname.endsWith(".webp") ||
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".woff") ||
    url.pathname.endsWith(".woff2")
  );
}

async function trimCache(cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length <= maxItems) return;
  await Promise.all(keys.slice(0, keys.length - maxItems).map((key) => cache.delete(key)));
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response && response.ok) {
    cache.put(request, response.clone());
  }
  return response;
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (isApiRequest(url)) return;

  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        const cache = await caches.open(SHELL_CACHE);
        try {
          const response = await fetch(request);
          if (response && response.ok) {
            cache.put(request, response.clone());
          }
          return response;
        } catch {
          const cached = await cache.match(request);
          if (cached) return cached;
          const fallback = await cache.match(OFFLINE_URL);
          return fallback || Response.error();
        }
      })()
    );
    return;
  }

  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  if (isImageOrFont(request, url)) {
    event.respondWith(
      (async () => {
        const response = await cacheFirst(request, MEDIA_CACHE);
        trimCache(MEDIA_CACHE, MAX_MEDIA_ITEMS);
        return response;
      })()
    );
  }
});
