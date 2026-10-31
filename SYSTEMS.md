# Pereda: systems

## Where it runs

A tinyjs desktop app: the operating system's webview draws the window and plain JavaScript behind it owns the notes. That shape buys three things the product leans on — a build of about 9.5 MB, no native UI layer to maintain, and no server to run ([`001`](docs/adrs/001-a-desktop-app-on-tinyjs.md)). macOS 15 or later, Windows 10 and 11, and a Linux desktop with WebKitGTK 4.1.

The window is frameless and the page draws its own chrome: a bar with close, minimize and zoom, the drag region, and a paper at 80% alpha, so the desktop reads through the window. The OS provides the window; the app provides the frame.

One window, one OS user, one data folder. There is no account and no server ([`002`](docs/adrs/002-local-only-in-v1.md)), and the only channel the app has is inside the machine, so the network is absent by construction rather than by policy. There is no update channel either: the app checks for nothing and a new version is a fresh download ([`004`](docs/adrs/004-distribution-without-an-update-channel.md)).

## The shape

The page draws and takes input; the backend owns the day and the store. They meet at a small set of named calls, and the page never reaches the database or the filesystem.

The backend is the only authority. A state the page believes and the backend has not confirmed is not a state, which is what lets the app promise it never shows a save it did not make. The page holds nothing that has to survive the window: reopen, and the note is read back from the store.

## The store

The requirement is that a note survives a quit or a crash, and that a day the person cleared stays cleared. One SQLite database in the app's data folder meets both: it is transactional, it is one file, and that file is the backup ([`003`](docs/adrs/003-sqlite-is-the-store.md)). It is portable between the three platforms and it is not synced anywhere.

One row per day, keyed by the machine's local date, holding the whole note; a day with nothing written leaves no row. A cleared day keeps its row, empty, and every read skips it — that tombstone is what stops a save arriving late from resurrecting a day the person cleared.

Each save carries the counter of the page's last write and applies only when it is newer than the stored one; an older save changes nothing. A write is ordered, whole and atomic — never a diff, and the backend never merges text.

A second table, `notes_fts`, indexes the bodies with SQLite's FTS5 and the `unicode61` tokenizer, so case folds in every script while å, ä and ö stay their own letters ([`010`](docs/adrs/010-search-reads-an-index-over-the-notes.md)). Three triggers keep it in step inside the same transaction as the note; it is derived and rebuildable from `notes`, a match is joined back to the row, and `notes` remains the only authority. The schema version is 2, and a version 1 file is lifted to it in one transaction when it opens.

The store never deletes, recreates or repairs the database over the notes. If it cannot be opened or fails its own integrity check, every write is refused and the app names the file.

## A keystroke becomes a row

- The only delay between a keystroke and the database is a short debounce; a blur, a hidden window and Today flush at once.
- One save is in flight per entry: a newer body waits and replaces it, and is sent whole.
- A failed save is shown with its reason and the text stays on screen; the next flush sends the whole body again.
- Today flushes every entry before it reloads, so no text is lost to the move.
- The debounce is the one window a quit or a kill can lose. Every committed save is on disk; the moment before an abrupt end may not be.

## The day

The day is the machine's local calendar day, read by the backend; the page never computes it from its own clock.

- The app opens on today's entry, and scrolling asks for the days before the oldest one loaded. A future day is refused at the backend; a past day with nothing written is not in the log.
- A window left open across midnight keeps the day it loaded; Today asks the backend again and loads the new day.
- A sleep or a timezone change can skip or repeat a day; no existing note changes its date.

## Reading

The log is the index: the first page holds today and the days before it, newest first, thirty at a time. A page is read from the store with the oldest day loaded as its upper bound, so pages never overlap; a day with nothing written is skipped, except today, whose entry is always first. An older day is reached by scrolling, or by the search.

The field above the log asks the backend for the days whose text holds every word, in any order, each as a prefix; the SQL never leaves the backend. The index folds case and keeps å, ä and ö apart, and a query is words — a quote, an operator and a phrase are not syntax. At most fifty days come back, newest first, each with the text around the match, and a result opens the log at its day.

## The shortcut

One hotkey, id `today`, combination `cmd+shift+d` — ⌘⇧D on macOS, Ctrl+Shift+D elsewhere — registered by the backend in `init` for the life of the process ([`011`](docs/adrs/011-one-shortcut-summons-the-window.md)). The registration is asked for once and its answer kept: a system with no global hotkeys, or one that will not give the combination up, answers `false`, and the page says that once in the status line. Nothing is stored and nothing waits for the shortcut.

A press reaches the backend and every page. The backend shows and focuses the window; the page takes the Today path — flush, ask the backend for today, load — which is the call the button makes. There is no second window, no toggle and no tray.

## Failure modes

- **The database is unreadable.** Every write is refused and the app shows the file with the reason; it never deletes, recreates or repairs it over the notes.
- **The disk is full or the folder is read-only.** The save fails, the app says so, and the text stays on screen.
- **A save is malformed or stale.** A future day, an impossible date, a non-text body or a counter behind the stored one is refused before anything is written.
- **The app quits or crashes.** Every committed save is on disk; the edit inside the debounce can be lost.
- **The clock moves.** A day can repeat or vanish; notes keep their dates.
- **A second instance.** The running app comes forward, so two windows never write the same file.
- **A book-length note.** The whole body is written on every save and shown unpaginated, so a very long note is slow.
- **An older page fails to load.** The status names the reason, and the entries already loaded stay.
- **A search fails.** The status names the reason, and the words stay in the field.
- **No network.** v1.3 makes no request of any kind, and the acceptance run is made with the network off.
- **The shortcut is refused.** It is said once in the status line, and Today, the log and the search work without it.

## Planned, not built

Every mechanism above is v1.3's. Five versions are decided and none is built; each ADR is the design and the code follows it.

- **v1.4 the assistant** ([`012`](docs/adrs/012-the-assistant-runs-on-this-machine.md)): `availability()` then `generate()` in the backend, the note on screen as the whole request, the reply marked in a panel and never written to `notes`; the on/off preference is the app's, not the database's. Absent on Windows and Linux.
- **v1.5 jump to a day** ([`013`](docs/adrs/013-a-date-in-the-search-field-jumps-to-the-day.md)): the search field resolves an exact `YYYY-MM-DD` in the backend, which refuses a day after today and answers with the page of the log bounded by the day after the target; no picker and no second field.
- **v1.6 the data folder** ([`014`](docs/adrs/014-the-data-folder-is-one-menu-item.md)): one menu item opens `app.paths().data` in the OS file manager. It copies nothing and stores nothing.
- **v1.7 the keys** ([`015`](docs/adrs/015-keys-and-nothing-to-configure.md)): four fixed keys handled in the page — ⌘F, Esc, ⌘T and ⌘↑/⌘↓ — with no stored combination; ⌘T reuses the Today path.
- **v1.8 midnight said** ([`016`](docs/adrs/016-midnight-is-said-not-taken.md)): the save reply also carries the backend's `today`, and the status line names the day being written while it is behind; no timer, no auto-switch.

Cloud sync is not a v1.x mechanism: the app has no server, no account table, no sync endpoint and no conflict resolution. A v2 sync would reconcile this local store and keep it the source of truth, so the app still works offline.

## Checks

```sh
bun test
tinyjs build
```

`bun test` covers the backend: the day at a fixed clock and around midnight, a valid and an impossible date, a future day, an insert and an update, a save that loses the counter comparison, a cleared day that leaves no note, a save that cannot resurrect a tombstone, a day across the turn of the year, a page of days newest first that stops at the end, a search folded for case in any script, every word as a prefix in any order, the index kept in step by an update and a clear, a query read as words rather than FTS5 syntax, the fifty-day cap, a version 1 file lifted to version 2 with its notes indexed, and the shortcut's refusal named for each platform.

`tinyjs build` builds the Linux app on CI; macOS and Windows are built on their own runners at release ([`004`](docs/adrs/004-distribution-without-an-update-channel.md)).

What no test reaches — the webview's drawing and input, the global hotkey on a real desktop, the real data folder on each OS, the signed and notarized macOS bundle, and the absence of a network request in the built app — is checked by hand on each release, with the network off.
