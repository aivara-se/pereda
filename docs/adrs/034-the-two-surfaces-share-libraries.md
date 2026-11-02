# 034 - The Two Surfaces Share Libraries

## Context

The desktop page is 1,822 lines under `apps/desktop/src`, and most of it is about notes, not about a desktop. The day is 71 lines, the Markdown ranges 139, the midnight line 7, the store 181 and the editor 106: 504 lines that name no window, no menu and no filesystem.

The store already takes its database handle as an argument, so the same SQL runs under bun in the tests and under the app's runtime. A second surface ([`033`](033-the-notes-have-a-second-surface-on-the-web.md)) that copies those 504 lines would keep two answers to one question, and a fix to the search would reach one of them.

## Decision

- The repository is a bun workspace of two apps and three libraries: `apps/desktop`, `apps/website`, `libs/notes`, `libs/note-editor` and `libs/theme`.
- `libs/notes` holds the day, the Markdown ranges, the midnight line and the store: the schema, the migrations, the ordered writes and the FTS5 search, behind five calls and `close`. It holds no DOM, no filesystem and no platform call; the database handle is the caller's.
- `libs/note-editor` holds the CodeMirror editor over one note. It is a DOM widget, so a plain page and a Svelte component mount the same code.
- `libs/theme` holds the tokens, the two faces and the base type. A surface adds its own layout and redefines no token.
- A surface keeps what only it can do. The desktop keeps its window, menu, shortcut, assistant and its SQLite file. The web app keeps its worker, its browser storage and its routing.
- The web app's driver is SQLite compiled to WebAssembly over the origin-private file system, so both surfaces run the same schema, the same SQL and the same search. Measured: the wasm is 879 KB raw and 406 KB gzipped; with one JavaScript wrapper and the OPFS proxy the page carries about 595 KB gzipped more. IndexedDB is rejected: it is free in the bundle, but it needs a second store and a second search, and the two would drift.
- A library is created when a second consumer exists. It is imported by path from the workspace, tested by the repository's one runner, and carries no build step of its own.

## Consequences

- 504 of the 1,822 lines move out of the app, and every import path to them changes, so the move lands as one pull request with no behaviour change and the same tests green.
- A change to the SQL now reaches both surfaces at once. That is the point, and it is the risk: a rewrite that suits the browser and slows the desktop is one review away from shipping to both.
- The theme travels as tokens, not as layout. The web app will look like Pereda only as far as the tokens reach, and its pages are drawn again.
- The desktop's build bundles one more directory and no new dependency.
- The workspace keeps one lockfile, one formatter and one test runner. Vite is a build tool, not a second toolchain.
- A library that only one surface imports is a directory with no reason to exist; the boundary is checked by the imports, not by intent.
