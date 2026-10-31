# Pereda: systems

## Where it runs

A tinyjs desktop app: the operating system's webview draws the window and plain JavaScript behind it owns the notes. That shape buys three things the product leans on — a build of about 9.5 MB, no native UI layer to maintain, and no server to run ([`001`](docs/adrs/001-a-desktop-app-on-tinyjs.md)). macOS 15 or later, Windows 10 and 11, and a Linux desktop with WebKitGTK 4.1.

The window is frameless and the page draws its own chrome: a bar with close, minimize and zoom, the drag region, and a paper at 80% alpha, so the desktop reads through the window. The OS provides the window; the app provides the frame.

The focused entry's actions sit in its date column, outside the flow so the entry does not change height; delete is the only one, and today's note has none because clearing its last character removes it ([`020`](docs/adrs/020-actions-under-the-date.md)). While today's note has the document's focus, the bar and every other entry are painted at 0.25 and the note stays at full strength; the status line and the assistant panel do not fade, and focus alone sets it ([`022`](docs/adrs/022-today-dims-the-window.md)).

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
- A save reply carries the day written and the backend's `today`. While the loaded day is behind, the status line names both — "Writing to 31 October — today is 1 November." — and nothing moves; a failed save replaces the line ([`016`](docs/adrs/016-midnight-is-said-not-taken.md)).
- A sleep or a timezone change can skip or repeat a day; no existing note changes its date.

## Reading

The log is the index: the first page holds today and the days before it, newest first, thirty at a time. A page is read from the store with the oldest day loaded as its upper bound, so pages never overlap; a day with nothing written is skipped, except today, whose entry is always first. An older day is reached by scrolling, or by the search.

The field in search mode asks the backend for the days before today whose text holds every word, in any order, each as a prefix; the bound is how today stays out of a text search, and the SQL never leaves the backend ([`021`](docs/adrs/021-search-is-a-mode.md)). The index folds case and keeps å, ä and ö apart, and a query is words — a quote, an operator and a phrase are not syntax. At most fifty days come back, newest first, each with the text around the match, and a result opens the log at its day. Closing the mode empties the field and loads the log at today; an empty field stays open with nothing under it until the first character.

A query that is exactly `YYYY-MM-DD` is resolved before that rule, in the backend ([`013`](docs/adrs/013-a-date-in-the-search-field-jumps-to-the-day.md)). It must name a real day; one after today is refused in words and the log does not move. Otherwise the same page of the log is read, bounded by the day after the target, so a day with no note lands on the newest day at or before it — today is in the log even when empty — and the status says so once. The jump closes the mode and empties the field.

## The shortcut

One hotkey, id `today`, combination `cmd+shift+d` — ⌘⇧D on macOS, Ctrl+Shift+D elsewhere — registered by the backend in `init` for the life of the process ([`011`](docs/adrs/011-one-shortcut-summons-the-window.md)). The registration is asked for once and its answer kept: a system with no global hotkeys, or one that will not give the combination up, answers `false`, and the page says that once in the status line. Nothing is stored and nothing waits for the shortcut.

A press reaches the backend and every page. The backend shows and focuses the window; the page takes the Today path — flush, ask the backend for today, load — which is the call the button makes. There is no second window, no toggle and no tray.

## The keys

Four fixed keys, handled in the page and read by `src/shared/keys.js` ([`015`](docs/adrs/015-keys-and-nothing-to-configure.md)). ⌘F opens the search mode and puts the caret in its field, selecting what is there; Esc in the field closes the mode, empties it and takes the Today path, and does nothing anywhere else; ⌘T takes the Today path, flush included; ⌘↑ and ⌘↓ move to the day above or below, with focus and the caret at the end of that note. Ctrl stands in for ⌘ on Windows and Linux.

Each key cancels the webview's default before taking the app's path. There is no palette, shortcut sheet, stored combination or rebinding screen: every key has a control that already does the same thing.

## The assistant

The model is the operating system's, reached through `app.macos.ai`; there is no provider, key, endpoint or network fallback ([`012`](docs/adrs/012-the-assistant-runs-on-this-machine.md)). `availability()` is read at launch, when the window regains focus, and again before every request; `unsupported` leaves no assistant, `unavailable` disables the action with the reason.

The menu is the app's: an Assistant switch stored in `app.store` and a Summarise item enabled only when the switch is on and the model is available. A click on Summarise is pushed to the page as `assistant:summarise`; the page sends the focused note's text and one fixed instruction, and shows the reply in a panel marked as generated on this Mac. The reply is never written to `notes`. One request runs at a time, and the editor stays usable while the model answers.

## The menu

The whole menu is built in the backend: the assistant's items on macOS and a File menu with **Show data folder** on macOS and Linux ([`014`](docs/adrs/014-the-data-folder-is-one-menu-item.md)). The item is declared on every platform, but Windows draws no menu bar on a frameless, transparent window, so it never appears there ([`018`](docs/adrs/018-the-menu-is-where-the-runtime-draws-one.md)). The item asks for `app.paths().data` and hands it to `app.shell.open`; the page never builds a path. It copies nothing, exports nothing and stores nothing.

A folder that will not open is pushed back with its path, and the status line shows it as text the person can select. A folder that does open clears the line.

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
- **No network.** v1.9 makes no request of any kind, and the acceptance run is made with the network off.
- **The shortcut is refused.** It is said once in the status line, and Today, the log and the search work without it.
- **The assistant is unavailable.** The action is disabled with the reason; a request that arrives anyway is refused, and the note stays on screen.
- **A date is after today.** It is refused in the status line and the log does not move; the text stays in the field.
- **The data folder will not open.** The status line says so and shows the path as selectable text; nothing is copied or changed.
- **A key does nothing.** The webview or the system kept it; every key has a mouse control that still works, and nothing else is lost.
- **The day is behind.** The status line names the day being written; a failed save replaces it, because a save that did not happen outranks a date notice.

## Not in v1.x

The app above is v1.9. Cloud sync is not a v1.x mechanism: the app has no server, no account table, no sync endpoint and no conflict resolution. A v2 sync would reconcile this local store and keep it the source of truth, so the app still works offline.

## Planned, not built

One version is decided and not built; its ADRs are the design and the code follows them.

- **v1.10 settings and export** ([`023`](docs/adrs/023-settings-is-a-page-in-the-window.md), [`024`](docs/adrs/024-export-writes-markdown.md)): a page view in the same window with a fixed-width text-link nav; the store gains one read of every non-empty day, and the backend writes `YYYY-MM-DD.md` into the folder the page picked with the native picker. No new table and no stored preference.

## Checks

```sh
bun test
tinyjs build
```

`bun test` covers the backend: the day at a fixed clock and around midnight, a valid and an impossible date, a future day, an insert and an update, a save that loses the counter comparison, a cleared day that leaves no note, a save that cannot resurrect a tombstone, a day across the turn of the year, a page of days newest first that stops at the end, a search folded for case in any script, every word as a prefix in any order, a text search that leaves today out, the index kept in step by an update and a clear, a query read as words rather than FTS5 syntax, the fifty-day cap, a version 1 file lifted to version 2 with its notes indexed, the shortcut's refusal named for each platform, the assistant's menu for each availability and switch, a date resolved before the search and refused after today, the File menu's one item, each fixed key on each platform, and the midnight line while the day is behind.

`tinyjs build` builds the Linux app on CI; macOS and Windows are built on their own runners at release ([`004`](docs/adrs/004-distribution-without-an-update-channel.md)).

What no test reaches — the webview's drawing and input, the search mode's swap, the focus fade, the global hotkey on a real desktop, the real data folder on each OS, the signed and notarized macOS bundle, and the absence of a network request in the built app — is checked by hand on each release, with the network off.
