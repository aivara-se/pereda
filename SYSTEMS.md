# Pereda: systems

## Where it runs

A tinyjs desktop app: the operating system's webview draws the window and plain JavaScript behind it owns the notes. That shape buys three things the product leans on — a build of about 9.5 MB, native chrome without a native UI layer, and no server to run ([`001`](docs/adrs/001-a-desktop-app-on-tinyjs.md)). macOS 15 or later, Windows 10 and 11, and a Linux desktop with WebKitGTK 4.1.

One window, one OS user, one data folder. There is no account and no server ([`002`](docs/adrs/002-local-only-in-v1.md)), and the only channel the app has is inside the machine, so the network is absent by construction rather than by policy. There is no update channel either: the app checks for nothing and a new version is a fresh download ([`004`](docs/adrs/004-distribution-without-an-update-channel.md)).

## The shape

The page draws and takes input; the backend owns the day and the store. They meet at a small set of named calls, and the page never reaches the database or the filesystem.

The backend is the only authority. A state the page believes and the backend has not confirmed is not a state, which is what lets the app promise it never shows a save it did not make. The page holds nothing that has to survive the window: reopen, and the note is read back from the store.

## The store

The requirement is that a note survives a quit or a crash, and that a day the person cleared stays cleared. One SQLite database in the app's data folder meets both: it is transactional, it is one file, and that file is the backup ([`003`](docs/adrs/003-sqlite-is-the-store.md)). It is portable between the three platforms and it is not synced anywhere.

One row per day, keyed by the machine's local date, holding the whole note; a day with nothing written leaves no row. A cleared day keeps its row, empty, and every read skips it — that tombstone is what stops a save arriving late from resurrecting a day the person cleared.

Each save carries the counter of the page's last write and applies only when it is newer than the stored one; an older save changes nothing. A write is ordered, whole and atomic — never a diff, and the backend never merges text.

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

The log is the index: the first page holds today and the days before it, newest first, thirty at a time. A page is read from the store with the oldest day loaded as its upper bound, so pages never overlap; a day with nothing written is skipped, except today, whose entry is always first. v1.0 has no calendar, no search, no title index and no full-text table, so an older day is reached by scrolling.

## Failure modes

- **The database is unreadable.** Every write is refused and the app shows the file with the reason; it never deletes, recreates or repairs it over the notes.
- **The disk is full or the folder is read-only.** The save fails, the app says so, and the text stays on screen.
- **A save is malformed or stale.** A future day, an impossible date, a non-text body or a counter behind the stored one is refused before anything is written.
- **The app quits or crashes.** Every committed save is on disk; the edit inside the debounce can be lost.
- **The clock moves.** A day can repeat or vanish; notes keep their dates.
- **A second instance.** The running app comes forward, so two windows never write the same file.
- **A book-length note.** The whole body is written on every save and shown unpaginated, so a very long note is slow.
- **An older page fails to load.** The status names the reason, and the entries already loaded stay.
- **No network.** v1.0 makes no request of any kind, and the acceptance run is made with the network off.

## Planned, not built

Every mechanism above is v1.0's. The roadmap's candidates are not designed here: v1.1 search, v1.2 the assistant, v1.3 the global shortcut. Cloud sync is not a v1.x mechanism: v1.0 has no server, no account table, no sync endpoint and no conflict resolution. A v2 sync would reconcile this local store and keep it the source of truth, so the app still works offline.

## Checks

```sh
bun test
tinyjs build
```

`bun test` covers the backend: the day at a fixed clock and around midnight, a valid and an impossible date, a future day, an insert and an update, a save that loses the counter comparison, a cleared day that leaves no note, a save that cannot resurrect a tombstone, a day across the turn of the year, and a page of days newest first that stops at the end.

`tinyjs build` builds the Linux app on CI; macOS and Windows are built on their own runners at release ([`004`](docs/adrs/004-distribution-without-an-update-channel.md)).

What no test reaches — the webview's drawing and input, the real data folder on each OS, the signed and notarized macOS bundle, and the absence of a network request in the built app — is checked by hand on each release, with the network off.
