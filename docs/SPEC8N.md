# Specification

## Direction

Pereda is a real-time daily note app for one person at a computer: one note per day, kept on the machine and written as it is typed. The desktop app runs on macOS, Windows and Linux; a static web page writes the same log in the browser. It is local: no account, no server, no network, no telemetry.

Scope: the live day, log, search, date jump, settings and export, and one summary. Deferred: sync, import, a hosted desktop, a native mobile app, and an assistant beyond a summary.

## Requirements

- A day is the local date, `YYYY-MM-DD`; a note begins with its first character and a future day cannot be written.
- A keystroke reaches the store after a debounce; a blur, a hidden window and Today flush at once. There is no save button, dirty state or unsaved-changes dialog; a quit loses only the last debounce.
- A note renders five Markdown forms in place: italic, bold, struck, inline code and a fenced block; their markers show while the caret is inside. Nothing else is Markdown.
- The log lists every day with a note, newest first, today at the top even empty, thirty a page. An older note is read-only until its edit action.
- Search finds the days before today holding every word, in any order, each a prefix, case folded and å, ä and ö apart. An exact date opens that day; a future day is refused.
- Export writes one verbatim UTF-8 file per day, `YYYY-MM-DD.md`, into a chosen folder.
- Keys: ⌘F search, ⌘, settings, Esc close, ⌘T today, ⌘↑/⌘↓ move a day; ⌘⇧D summons the window. Nothing is configurable.
- On macOS 26 with Apple Intelligence, an older note can be summarised; the reply is marked as generated and never enters the note.
- The web app installs from the browser, opens without a network, and keeps its notes in browser storage.

Never: an account, a server, a desktop network request, telemetry, sync, rich text beyond the five forms, or unmarked AI text in a note.

## Architecture

A bun workspace. `apps/desktop` is a tinyjs app: a JavaScript backend owns the clock and store; the system webview draws one page. `apps/website` is a static SvelteKit site whose worker opens the same libraries over SQLite's WebAssembly build in the browser's file system. `libs/notes` holds the day, Markdown ranges, store, the calls `openLog`, `saveDay` and `searchNotes`, and the export; `libs/note-editor`, `libs/theme` and `libs/keys` hold the editor, tokens and key map both surfaces share.

The store is one SQLite file: a `notes` table keyed by day holding whole bodies, and a derived `notes_fts` index kept in step by triggers. A save carries the page's counter and applies only when newer, so writes are ordered and atomic; an old save cannot resurrect a cleared day. Schema version 2.

A release is the `apps/desktop/tinyjs.json` version: `publish.yml` builds the three desktops and the web app, tags the commit, publishes the release and deploys the site. Checks are `bun test`, `bun run build`, `bun run build:web` and the `validate` jobs.
