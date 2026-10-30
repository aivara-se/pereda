# 009 - Continue with tinyjs

## Context

[001](001-a-desktop-app-on-tinyjs.md) chose tinyjs, and the app has shipped on it. Since then the alternatives were measured rather than assumed. A gpuix-svelte port of this app built at 114.8 MB, 109 MB of it a bare Bun runtime, against Pereda's 8.2 MB, and it needed hand-built replacements for what the webview gives free — auto-growing text, font fallback, letter-spacing and the delete dialog. The other candidates are Tauri 2 at roughly 5–12 MB with a Rust backend, Electron at 150–200 MB, Flutter at 35–45 MB and SwiftUI at 1–2.5 MB but macOS only.

Pereda promises a small download on three platforms, and its work is text: a caret, selection, undo and IME that the system webview already provides. On size and effort, tinyjs is at the frontier; the alternatives either cost 4–20× the bytes or a rewrite of the UI for no measured gain.

## Decision

Pereda stays on tinyjs for v1.x. No port to gpuix-svelte, Tauri or another stack is planned, and [001](001-a-desktop-app-on-tinyjs.md) stands.

The gpuix-svelte branch and its pull request remain as the measured record of that alternative, not as a pending migration.

The choice is reopened only if tinyjs stops being maintained, a release needs something it cannot do on a target OS, or a measured problem appears in startup, typing or build size. Tauri 2 is the default alternative then, because it keeps the Svelte page and a comparable size.

## Consequences

- The 8 MB build, the three-platform release and the backend tests stay as they are.
- The test gap stays: the store and the day are covered by `bun test`; the window is still checked by hand on each release, because tinyjs has no packaged E2E harness.
- No Rust, Dart or C# toolchain enters the project, and there is no second UI to keep in step.
- Reopening the decision costs a new ADR measured against a built artifact, not a rewrite now.
