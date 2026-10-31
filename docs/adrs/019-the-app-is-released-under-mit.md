# 019 - The App Is Released Under MIT

## Context

The repository is public and every version ships as a GitHub release built from it ([`008`](008-releases-are-built-here.md)). No file stated a licence, so the default held: the copyright holder reserves every right, whatever a public repository suggests. The operator chose MIT for the organisation's projects.

## Decision

- **MIT, in `LICENSE` at the repository root**, with the copyright line `Copyright (c) 2026 AIvara`. It covers the code and the documents this repository authors.
- **`package.json` states it too** — `"license": "MIT"` — for a tool that reads the manifest rather than the file. `"private": true` stays: it stops an npm publish, and it is not a licence.
- **The bundled fonts are not covered.** Instrument Sans and Newsreader ship under the SIL Open Font License, whose text is already in `src/frontend/fonts/`.

## Consequences

- Anyone may use, modify and redistribute the app, commercially included, if the copyright notice and the permission text travel with it. MIT grants no patent licence.
- **It cannot be withdrawn from what is already out.** Tags released before this commit hold no licence file and are left as they are, so the grant runs from this commit onward.
- **The archives the release publishes hold the built app**, not the repository's files. The notice travels with the source a build came from and the release page names that repository; putting it inside the bundle is a packaging decision this record does not make.
