"use strict";

const CACHE_NAME = "petgame-v1";

// Passe das an, wenn du andere Dateinamen nutzt.
const ASSET_LIST = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./sw.js",

  // Icons
  "./assets/ui/icon-192.png",
  "./assets/ui/icon-512.png",

  // Game Assets (müssen zu deinen echten Pfaden passen!)
  "./assets/background/bg_angry.png",
  "./assets/background/bg_happy.png",
  "./assets/hands/hands.png",
  "./assets/ui/button.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    // "Cache addAll" kann bei fehlenden Dateien abbrechen.
    // Deshalb einzeln cachen und Fehler ignorieren.
    for (const url of ASSET_LIST) {
      try { await cache.add(url); } catch (_) {}
    }
    self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => (k === CACHE_NAME ? null : caches.delete(k))));
    self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(req, { ignoreSearch: true });
    if (cached) return cached;

    try {
      const fresh = await fetch(req);
      // Nur gleiche Herkunft cachen
      const url = new URL(req.url);
      if (url.origin === self.location.origin) {
        cache.put(req, fresh.clone()).catch(() => {});
      }
      return fresh;
    } catch (e) {
      // Offline-Fallback: wenigstens index.html liefern
      const fallback = await cache.match("./index.html");
      return fallback || new Response("Offline", { status: 200, headers: { "Content-Type": "text/plain" } });
    }
  })());
});
