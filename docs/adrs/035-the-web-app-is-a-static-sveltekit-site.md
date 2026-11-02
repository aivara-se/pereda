# 035 - The Web App Is a Static SvelteKit Site

## Context

The web surface needs pages, components and a build, and it must ship as files because there is no server ([`033`](033-the-notes-have-a-second-surface-on-the-web.md)). The fleet already builds `aivara.se` with SvelteKit, `adapter-static`, Vite and bun, and deploys it by a workflow to GitHub Pages: one static directory, no worker and no runtime secret.

## Decision

- SvelteKit with `adapter-static`. The build writes static files, no route is rendered per request, and the site runs no server code.
- Vite builds the page. bun stays the package manager and the test runner, and the repository keeps one lockfile.
- The browser store runs in a worker over SQLite's WebAssembly build, so the page never blocks on the database ([`034`](034-the-two-surfaces-share-libraries.md)).
- The site deploys from a workflow on a push to `main` that changes it, to GitHub Pages, as `aivara.se` does. The custom domain is a CNAME the operator points.
- The desktop's build is untouched: tinyjs bundles `apps/desktop` with esbuild, and the two builds share no configuration.
- A browser without the origin-private file system is unsupported, and the page says so. It does not keep notes in memory that vanish on a reload.

## Consequences

- A second build command exists, so `validate` gains a job that builds the web app; a broken web build is red on `main`.
- The site is an artefact: no server-side rendering, no form actions, no cookies. Every route is a page, and every state lives in the browser.
- A first load carries the app and the 595 KB of database that [`034`](034-the-two-surfaces-share-libraries.md) measured. Later loads come from the browser's cache, and the service worker is not part of this decision.
- GitHub Pages serves files only. A redirect, a header or a 404 rule is the host's configuration, not the app's.
- The framework adds a compiler to the deploy path: a Svelte or Vite major changes the web app alone, and the desktop's build does not move.
