# 040 - The Web App Installs on a Phone

## Context

The web app is a static page for a desktop browser ([`033`](033-the-notes-have-a-second-surface-on-the-web.md)) and ships as files from a release ([`038`](038-the-web-app-ships-with-the-release.md)). A person who writes on a phone opens a tab, and the tab keeps the page only while the browser chooses to; the notes live in the origin-private file system, but the page that opens them does not.

An installed app adds no server and no account: the browser keeps the same static files on the device, and a manifest names the app, its icons and how it opens.

The build writes 34 files for the page: 1.9 MB raw and 0.88 MB compressed, the 879 KB SQLite wasm included. That is everything a launch reads.

## Decision

- The web app carries a manifest and its icons, and the browser installs it to the home screen in `standalone`.
- A service worker caches every file the build wrote the first time a page loads, from a list the build writes after its last file. A navigation is answered from that cache first and from the network only on a miss.
- The cache is named for the build's version, and the worker deletes the caches of builds that are gone.
- The notes do not move: they stay in the browser's origin-private file system, and an installed app opens the notes the tab wrote. One document opens them at a time: a second document on the same origin, a tab still open beside the installed app included, cannot open the database and says so, and the notes open again once the first document closes.
- The page keeps the layout it has: the single column under 620 px is the phone's layout, and the install adds no route, gesture or control.

## Consequences

- [`033`](033-the-notes-have-a-second-surface-on-the-web.md)'s "A browser in a narrow window is not mobile support: the web app is built for a desktop browser" falls.
- [`035`](035-the-web-app-is-a-static-sveltekit-site.md)'s "the service worker is not part of this decision" falls: the service worker is now how the page opens.
- A first visit caches 1.9 MB, the database included, install or not: the worker registers on the page load, so a browser that never installs holds every file too.
- A release reaches an installed app one launch after it reaches the site: the cache serves the build it holds until the new worker has installed.
- On iOS the app has no export, because the File System Access API is absent; the refusal [`033`](033-the-notes-have-a-second-surface-on-the-web.md) already states is the whole answer.
- Browser storage can still be evicted, and an installed app is no more durable than the tab it replaces.
- The build writes one more file, `precache.json`, and `bun run build:web` writes it after the site.
