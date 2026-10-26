# Pereda: systems

This document describes v1.0; the behaviour and its acceptance are [PRODUCT](PRODUCT.md).

## Where it runs

One tinyjs app on the person's machine, on macOS 15+, Windows 10/11, or a Linux desktop with WebKitGTK 4.1. A tinyjs app is two processes: the backend, plain JavaScript on txiki.js, and the launcher, a small native program that owns the window and the system webview. They talk over a private socket in a temp folder; the page is a real `file://` document. There is no HTTP server and no port ([`001`](docs/adrs/001-a-desktop-app-on-tinyjs.md)).

The app has one window, `main`, one OS user and one data folder. The notes belong to that user; there is no account, no server and no network request ([`002`](docs/adrs/002-local-only-in-v1.md)).

## The project

The app is a tinyjs project with a JavaScript backend and a plain page. `src/backend/` owns the module, the store, the day and the export; `src/frontend/` owns the editor and the calendar; `tests/` holds the checks.

The page and the backend meet at named calls — `status`, `today`, `note`, `month`, `save`, `exportTo` — and the page never reaches SQLite or the filesystem. `tinyjs.json` carries the app's identity and the pinned tinyjs version; it loads no remote page and has no `url` or `update` block ([`004`](docs/adrs/004-distribution-without-an-update-channel.md)).

## The store

One SQLite database, `pereda.db`, at `(await app.paths()).data + '/pereda.db'`:

- macOS: `~/Library/Application Support/se.aivara.pereda/pereda.db`
- Windows: `%APPDATA%\se.aivara.pereda\pereda.db`
- Linux: `~/.local/share/se.aivara.pereda/pereda.db` (or under `$XDG_DATA_HOME`)

The folder is the app's, named after the `id`; changing the `id` starts every user with an empty folder ([`004`](docs/adrs/004-distribution-without-an-update-channel.md)).

On open the store enables write-ahead logging and full synchronous commits, and creates the schema if it is missing. One row per day: `day` is the local `YYYY-MM-DD` key, `body` is the whole note, and `seq` is the page's write counter for that day ([`003`](docs/adrs/003-sqlite-is-the-store.md)). The schema version is 1.

**A row is never deleted.** Clearing a note stores an empty body and leaves the row as a tombstone; every read skips the tombstones. That is what stops an out-of-order save from resurrecting a day the person cleared: a save applies only when its sequence is greater than the stored one.

The store's calls:

- `check()` — an integrity check; `ok`, or the reason and the file path.
- `load(day)` — `{ body, seq }`, or `null` for a day never written.
- `save(day, body, seq)` — validate, write with the sequence guard, return `{ ok, seq, applied }`. An empty body is a tombstone, not a delete.
- `month(year, month)` — the days in that month that have a note, sorted, for the calendar.
- `rows()` — every non-empty day and body, in day order, for export.

Validation is at the boundary: the day matches `YYYY-MM-DD`, is a real calendar date, and is not after `today()`; `body` is a string; `seq` is a non-negative integer. A value that fails is refused with a reason and no write.

## A keystroke becomes a row

1. The page holds the open day and the textarea. On `input` it restarts a 150 ms timer; on `blur`, on a day switch, and when the window becomes hidden it flushes immediately. The timer is the only delay between a keystroke and the database.
2. A flush sends `api.save({ day, body, seq })` with the whole body and the next `seq`. One call is in flight at a time; a newer body waits for it and is sent next. The page never sends a diff, and the backend never merges text.
3. The backend validates the request and applies it with the sequence guard. A body that arrives late is a no-op. The write is atomic.
4. The backend returns `{ ok: true, seq, applied }` or `{ ok: false, reason }`. On a failure the page shows a banner with the reason and keeps the text; the next flush retries the whole body. The app never shows a save it did not make.
5. A day switch flushes the current day before it loads the next, so text is never moved to the wrong date.

The debounce is 150 ms, a provisional value; the first release's typing session freezes it. A quit or a kill inside that window can lose the last edit; every committed save survives, because SQLite is in `synchronous = FULL` with WAL ([`003`](docs/adrs/003-sqlite-is-the-store.md)).

## The day

`today()` is the backend's `new Date()` read as the machine's local year, month and day, formatted `YYYY-MM-DD`. The page asks for it on load and on `focus` and `wake`, and uses it to enable the calendar's days and to show the Today control. The page never computes the day from its own clock.

- The app opens `today()`.
- The calendar opens any day up to `today()`; a future day is disabled and the backend refuses it.
- A window left open across midnight keeps the day it loaded. `Today` calls `today()` again and loads that day; the old day is flushed first.
- A sleep or a timezone change can move `today()`; nothing rewrites an existing row's `day`.

## Reading

- `api.note({ day })` returns the note and its `seq`, or an empty note with `seq = 0`.
- `api.month({ year, month })` returns the marked days; the page draws the calendar from it.
- Opening a marked day loads its body into the textarea and its date into the header.
- There is no search, no title index and no full-text table in v1.0.

## Export

1. The page calls `tiny.dialog.pickFolder()`; a cancelled dialog ends the export.
2. It calls `api.exportTo({ dir })`. The backend checks the path is absolute and a directory, reads `rows()`, and writes `dir/YYYY-MM-DD.md` for each, with the body verbatim and no heading or front matter.
3. An existing file of the same name is replaced. The backend stops at the first failure and returns `{ ok: false, written, reason }`; the files already written stay.
4. On success it returns `{ ok: true, written }`, and the page says how many files were written.

The export is a copy, not a move: the database is unchanged, and an exported file that is later edited is not imported back ([`002`](docs/adrs/002-local-only-in-v1.md)).

## Failure modes

- **The database cannot be opened, or `quick_check` fails.** `init` records the failure and the path; `api.status` reports it and every write is refused. The file is never deleted, recreated or repaired over. The page shows the path and asks the person to restore a copy.
- **The disk is full or the data folder is read-only.** The save returns `{ ok: false, reason }`; the page shows it and keeps the text. A later save retries.
- **A stale or malformed save.** A day in the future, a malformed date, a non-string body or a negative `seq` is refused before the write; a `seq` at or below the stored one is a no-op.
- **The app quits or crashes.** Every committed save is on disk. The debounce window's last edit can be lost; nothing older is.
- **The clock moves.** `today()` can skip or repeat a day; existing rows keep their `day` strings.
- **A second instance.** tinyjs's single-instance detection, keyed by the app `id`, focuses the running app instead of opening a second window on the same file.
- **Export fails.** The error names the day it failed on; the files already written remain.
- **A very long note.** The whole body is serialised and written per save, and the textarea has no pagination; a book-length note is slow.
- **No network.** There is no `fetch`, `WebSocket`, `XMLHttpRequest`, `EventSource` or `update` block in the app. The page loads only `file://` assets. The acceptance run is made with the network off.

## Planned, not built

Every mechanism above describes v1.0. The roadmap's candidates are not designed here: v1.1 search, v1.2 the assistant, v1.3 the global shortcut ([PRODUCT](PRODUCT.md)).

Cloud sync is not a v1.x mechanism. v1.0 has no server, no account table, no sync endpoint and no conflict resolution. If a v2 adds sync, it syncs the local `notes` table; the local store stays the source of truth and the app still works offline.

## Checks

```sh
bun test
tinyjs build
```

`bun test` covers: `today()` at a fixed clock and around midnight, a valid and a malformed day, a future day, the store's insert and update, a stale `seq` that changes nothing, a cleared note that leaves no calendar mark and no export, a save after a tombstone that cannot resurrect it, `month()` across a year boundary, and export names and contents in a temp folder. The store tests open `bun:sqlite`; the app opens `tjs:sqlite`; both run the same SQL.

`tinyjs build` builds the Linux app on the CI runner. macOS and Windows are built on their own runners at release ([`004`](docs/adrs/004-distribution-without-an-update-channel.md)).

What no test can reach: the system webview's rendering and input, the native folder dialog, the real data folder on each OS, the signed and notarized macOS bundle, and the absence of a network request in the built app. Those are checked by hand on each release, with the network off.
