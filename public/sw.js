const CACHE_NAME = "property-pulse-v2";
const APP_SHELL = ["/offline", "/manifest.webmanifest", "/globe.svg"];

self.addEventListener("install", (event) => { event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))); self.skipWaiting(); });
self.addEventListener("activate", (event) => { event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))); self.clients.claim(); });
self.addEventListener("fetch", (event) => {
  const request = event.request; const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin || url.pathname.startsWith("/api/") || url.pathname.startsWith("/_next")) return;
  if (request.mode === "navigate") { event.respondWith(fetch(request).catch(() => caches.match("/offline"))); return; }
  if (url.pathname.startsWith("/_next/static/") || url.pathname.match(/\.(?:png|jpg|jpeg|webp|svg|woff2?)$/)) { event.respondWith(caches.match(request).then((cached) => cached || fetch(request).then((response) => { const copy = response.clone(); caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)); return response; }))); }
});
self.addEventListener("push", (event) => { let data = {}; try { data = event.data ? event.data.json() : {}; } catch { data = { body: event.data?.text() }; } event.waitUntil(self.registration.showNotification(data.title || "PropertyPulse", { body: data.body || "You have a new update.", icon: data.icon || "/globe.svg", badge: "/globe.svg", tag: data.tag || "property-pulse", data: { url: data.url || "/notifications" } })); });
self.addEventListener("notificationclick", (event) => { event.notification.close(); const target = new URL(event.notification.data?.url || "/", self.location.origin).href; event.waitUntil(clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => { const current = windows.find((client) => client.url === target); return current ? current.focus() : clients.openWindow(target); })); });
