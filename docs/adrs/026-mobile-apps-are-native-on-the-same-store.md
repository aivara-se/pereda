# 026 - Mobile Is Two Native Apps on the Same Store

## Context

Pereda is a desktop app: a tinyjs workspace in `apps/desktop` ([025](025-the-app-lives-in-apps-desktop.md)), one SQLite file in the operating system user's data folder ([003](003-sqlite-is-the-store.md)), and no network or account ([002](002-local-only-in-v1.md)). Its window is drawn by the page and its search reads an FTS5 index over the notes ([010](010-search-reads-an-index-over-the-notes.md)).

A phone has no window to draw, no menu bar, no global shortcut, no data folder a person can open, and a keyboard that covers half the screen. The store, the day, the live write and the search are platform-neutral; the surface around them is not.

The operator asks for iPhone and Android apps with the same interface and features, optimised for the device.

## Decision

- Two native apps: SwiftUI in `apps/iphone`, Jetpack Compose in `apps/android`. Each has its own project, version file and store listing; the desktop app is unchanged.
- The store contract is shared, not re-invented: schema version 2, `notes` and `notes_fts`, `unicode61 remove_diacritics 0`, tombstones, sequence counters, whole-body atomic saves, WAL and `synchronous = FULL`.
- iOS uses the system SQLite. Android bundles SQLite (`androidx.sqlite:sqlite-bundled`) because the platform build has no FTS5, and uses no Room, so the schema stays the desktop's exactly.
- Each app is local-only: one database in its own sandbox, no account, no network, no sync between devices. A database file is the only way a whole log moves, and the app never merges two.
- The interface is the desktop's composition at phone size: one column, the date above the note, Newsreader for the note, Instrument Sans for the chrome, the same paper, accent and focus fade.
- Today is written in the log. An older day opens as a day screen, which is the one surface the desktop does not have; the log cannot edit and read at once on a phone.
- Search stays a mode, settings a page, export Markdown. Restore from a file joins export, because the phone's sandbox has no data folder to copy back into.
- What a phone cannot carry is dropped, not imitated: no window controls, no shortcut, no menu bar, no Show data folder. Today is the bar's left control.
- The assistant is iOS 26 with Apple Intelligence only, off until switched on in settings, and reached from a bar action. Android has none, as Windows and Linux have none.
- Minimums are iOS 18 and Android 10 (API 29).

## Consequences

- Two codebases must agree. The defence is one database fixture and one set of search cases, run by both test suites with identical output as the gate.
- A phone user has no data folder: export writes Markdown out, and restore replaces the notes from a file. Without restore the phone store is a one-way door.
- Two devices are two logs until a sync version reconciles stores. That is the cost of [002](002-local-only-in-v1.md) holding on a phone; sync never adds an account.
- The assistant is a real platform split: iPhone has it, Android does not, and the product says so.
- Stores add a review, a privacy label and signing keys that the desktop release does not have.

When mobile 1.0 ships, these product sentences fall: "Not mobile: no iOS or Android app"; the platform list in **The app**; "one person, one machine" becomes one person per device; "the data folder is the backup" becomes export and restore on a phone. No account, no sync and no server still hold.
