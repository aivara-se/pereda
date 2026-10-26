# 001 - A Desktop App on tinyjs

## Context

Pereda is a daily note app for one person at a computer: it opens on today, writes one note per day and keeps it on the machine. v1.x is local ([002](002-local-only-in-v1.md)), so the first version needs a window, an editor, a local database and a way to ship the result — not a server, an account or a browser tab.

What needs recording is the desktop shell, because it fixes the platform, the language, the size of every build and the dependency the project maintains.

The alternatives are a web app, which would need a server, accounts and a connection; Electron, which bundles Chromium and ships at 150 MB or more; and Tauri, which has the same shape as tinyjs but a Rust backend and a compile step. [tinyjs](https://tinyjs.app) runs a JavaScript backend on txiki.js and the page in the system webview, with no HTTP server and no ports, and builds at about 6 MB.

## Decision

tinyjs 0.66.2 or newer, with its plain template: a JavaScript backend in `src/backend/main.js`, a page of HTML, CSS and JavaScript in `src/frontend/`, no framework and no bundler. The app runs on macOS 15+, Windows 10/11 and Linux with WebKitGTK 4.1, and each release is built on its own OS.

## Consequences

- One codebase for three operating systems, but three webviews to check: WKWebView, WebView2 and WebKitGTK render the page, and a release is checked on each.
- A build is about 6 MB and carries no browser: the app installs and starts like a native app, and the OS patches the webview.
- The backend is JavaScript on txiki.js, not Node: no `node:*` modules and no npm runtime dependency. The code uses `tjs` and Web APIs, and a package that needs Node's built-ins cannot be used.
- There is no mobile app and no browser version; the product is a desktop app.
- tinyjs is an MIT dependency with its own release cadence. `minTinyjsVersion` pins the oldest accepted version, and upgrading tinyjs is a reviewed change, not a `latest` tag.
- The interface is HTML, CSS and JavaScript in a webview; the native parts — window, menu, dialogs, the OS — are tinyjs's calls, so the app gets native chrome without a native UI layer.
- A tinyjs limitation is the app's: a missing capability on one OS is a product gap to handle, not something a framework can fill.
