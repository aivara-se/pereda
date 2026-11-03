// The page installs on a phone and opens with no network: the service worker
// caches every file the build wrote, answers a page from the cache first, and
// drops the cache of a build that is gone
// (docs/adrs/040-the-web-app-installs-on-a-phone.md).

import { version } from "$app/env";

// The path the site is served under: empty at a domain root, "/pereda" under a
// project page. The worker sits at that root, so its own directory names it.
const base = new URL(".", self.location).pathname.replace(/\/$/, "");

const CACHE = `pereda-${version}`;

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      // The list is the build's own, written after every file was emitted:
      // the SQLite worker and its wasm are loaded at run time, so no Vite
      // manifest names them. A list that does not arrive fails the install,
      // and the worker already in place keeps serving the build it cached.
      const response = await fetch(`${base}/precache.json`, {
        cache: "reload",
      });
      if (!response.ok) {
        throw new Error(`precache.json answered ${response.status}`);
      }

      const files = await response.json();
      const cache = await caches.open(CACHE);
      await cache.addAll(files.map((path) => `${base}${path}`));
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names
            .filter((name) => name.startsWith("pereda-") && name !== CACHE)
            .map((name) => caches.delete(name)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

// A navigation answers from the cache, and the network only when the page is
// not there: the app is complete on the device, so a launch does not wait for
// a request. A page is cached under its path with a trailing slash, the form
// the build writes and the host answers.
self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    if (!url.pathname.endsWith("/")) url.pathname += "/";
    event.respondWith(
      caches
        .match(url.href, { ignoreSearch: true })
        .then((hit) => hit ?? fetch(request)),
    );
    return;
  }

  event.respondWith(caches.match(request).then((hit) => hit ?? fetch(request)));
});
