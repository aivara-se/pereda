# 009 - Continue with tinyjs

## Context

[001](001-a-desktop-app-on-tinyjs.md) chose tinyjs, and the app has shipped on it. Two builds give the numbers, and each is quoted for its own platform.

| Build | macOS arm64 | Linux x86_64 |
| --- | --- | --- |
| v1.0.0 release, built here | 8,243,461 B (`.app`) | 10,113,118 B (tree) |
| gpuix-svelte port, built for #16 | 86.0 MB (`.app`) | 105.1 MB (binary) |

Both rows were measured on unpacked artifacts. The Linux port figure is its binary alone — its addon ships beside it — so that ratio is a floor. The port costs about ten times the release on either OS, and it needed hand-built replacements for what the webview gives free — auto-growing text, font fallback, letter-spacing and the delete dialog.

No Tauri, Electron, Flutter or SwiftUI build of this app exists, so their sizes are the published ones: Tauri 2 at roughly 5–12 MB with a Rust backend, Electron at 150–200 MB, Flutter at 35–45 MB, SwiftUI at 1–2.5 MB and macOS only.

Pereda promises a small download on three platforms, and its work is text: a caret, selection, undo and IME that the system webview already provides. On size and effort, tinyjs is at the frontier: the alternatives cost 4–20× the bytes, a Rust backend, or a macOS-only toolchain, against no measured gain.

## Decision

Pereda stays on tinyjs for v1.x. No port to gpuix-svelte, Tauri or another stack is planned, and [001](001-a-desktop-app-on-tinyjs.md) stands.

The gpuix-svelte branch and its pull request remain as the measured record of that alternative, not as a pending migration.

The choice is reopened only if tinyjs stops being maintained, a release needs something it cannot do on a target OS, or a measured problem appears in startup, typing or build size. Tauri 2 is the default alternative then: it keeps the page as it is — plain HTML, CSS and JavaScript, no framework and no bundler, as 001 chose — at a published size close to this build's.

## Consequences

- The 8 MB build, the three-platform release and the backend tests stay as they are.
- The test gap stays: the store and the day are covered by `bun test`; the window is still checked by hand on each release, because tinyjs has no packaged E2E harness.
- No Rust, Dart or C# toolchain enters the project, and there is no second UI to keep in step.
- Reopening the decision costs a new ADR measured against a built artifact, not a rewrite now.
