# 033 - The Notes Have a Second Surface on the Web

## Context

Pereda is one person's daily log, written as it is typed and kept on one machine ([`002`](002-local-only-in-v1.md)). It is installed, and it runs on the operating system's webview.

A person who opens a browser on another machine has no log there, and installing a binary is a step some machines do not allow. The same daily habit should not need an install, if it can keep the promise that the notes are the person's.

## Decision

- The product has a second surface: a web page that writes the same daily note, with the same log, the same search, the same actions and the same export.
- The web app keeps its notes in the browser's own storage on that device. There is no account, no upload and no server-side database.
- The two surfaces keep separate note sets. Moving notes between them is the Markdown export, done by hand; there is no sync.
- The web app ships as static files: HTML, JavaScript, CSS and WebAssembly. It runs no server code, holds no secret and calls no API.
- The desktop app's promise does not change: no request of any kind, no account, no server. It is the web page that travels over the network, and only to be loaded.
- The web app asks the browser for persistent storage and states eviction as an unhandled case of its own.

## Consequences

- The product is no longer one local app. The product document's "It is a local app — no account, no server, no network", "Not a service: no hosted version, no self-hosted server, nothing to deploy" and "Never calls the network on its own" narrow to the desktop app. A hosted static page is a deployment.
- Two note sets with no sync is the price of no server: a person who uses both keeps two logs and bridges them with an export.
- Browser storage is not a data folder. The backup is the export, and a browser that evicts its storage loses notes.
- The binary's size does not describe the web app, and the web app's bundle does not describe the binary.
- A browser in a narrow window is not mobile support: the web app is built for a desktop browser.
