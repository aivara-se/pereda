# Pereda: product

Pereda is a real-time daily note app for the desktop. It opens on today, one note per day, and everything typed is written to disk as it is typed: there is no save button, no draft state and no sync step. It is a local app — no account, no server, no network. The notes are one database on the computer, and the app works with the network off.

v1.0 carries one flow: **the live day**. The app opens on today's entry at the top of one log, writes it, and older entries follow as you scroll.

**Live is the promise.** The note is not a document that is saved; it is written as it is made. The app never asks whether to keep the work, because it already has. A quit a moment after typing loses nothing, and a crash can lose only the last moment before it.

## The app

- One window, one person, one machine. There is no account and no sign-in: the notes belong to the operating system's user.
- It runs on macOS 15 or later (Apple silicon and Intel), Windows 10 or 11, and a Linux desktop with WebKitGTK 4.1. A build is about 9.5 MB and needs no runtime beyond the OS's webview.
- It is downloaded, not signed up for: anyone can download it, and there is no hosted version and nothing to self-host.
- It opens on today with the cursor in the note.

## The day

- One note per day. A day is the computer's local calendar day, and it starts at midnight.
- The app opens on today. A note begins with its first character, so a day with nothing written leaves nothing behind.
- Every day with a note is in the log and can be written to; today is there even when it is empty. A future day cannot be written, and a past day with nothing written is not in the log. A note is never closed.
- A window left open across midnight keeps the entry it opened; Today moves the log to the new day.

## The note

- A note is plain text with paragraphs: no title, formatting, checkboxes, tags, attachments, images or structured links.
- One person writes it. There is no sharing, no second writer and no public link.
- Clearing every character of a note removes it; the day remains empty.
- Deleting a day asks once and cannot be undone.

## Reading back

- The log is the index: every day with a note, newest first, with today at the top.
- The note shows its date beside the text; there is no title to remember.
- Scrolling down reaches older days, a page at a time. v1.0 has no search, no calendar and no jump to a date.

## Your data

- The notes are one SQLite database in the app's data folder. The app writes nothing outside that folder.
- The data folder is the backup: copy it with the app closed, and copy it back to restore. It is portable between the three platforms.
- In v1.0 the app makes no network request: no account, no telemetry, no update check. A new version is a download.
- Deleting a note removes it; there is no trash.

## What it never does

- Never asks for a save: no save button, no dirty state, no "unsaved changes" dialog.
- Never asks for structure: no notebooks, titles, templates, tags or required fields.
- Never calls the network on its own: a request exists only when the person starts a feature that needs one, and v1.0 has none.
- Never sends a note anywhere without the person asking.
- Never shows an ad, sells a note, or trains a model on one.
- Never lets AI write into a note unmarked and unaccepted.
- Never turns a note into a metric: no streak, no count, no score.
- Never locks the notes in: the database file is the person's.

## AI, later

AI is not in v1.0. When it comes it is an assistant to the writer, never the author: it may summarize a day, answer a question about the notes, or suggest a next line, and every word it produces is marked until the writer accepts it. It is off until the person turns it on. If it uses a model over the network, the app names the model and sends only the note the person asked about — never the whole log — and a local model is preferred where the machine can run one.

## What v1.0 does not do

- Not a cloud app: no account, no sync, no collaboration, no sharing.
- Not a service: no hosted version, no self-hosted server, nothing to deploy.
- Not a search: a day is found by its date.
- Not rich text: no formatting, images, attachments, checkboxes, tables or backlinks.
- Not mobile: no iOS or Android app.
- Not an importer: notes from other apps, or from the old pereda.app, are not imported.
- Not an exporter: the notes leave only as the data folder; v1.0 writes no Markdown files.
- Not self-updating: a new version is a download.
- Not AI: no summaries, suggestions, questions or chat.

## Edge cases v1.0 leaves unhandled

Known, and deliberately not handled in this version.

- **A crash inside the save window.** The last edit before the crash, at most a moment, can be lost; nothing older is.
- **The clock or timezone changes.** Existing notes keep their dates; near the change, a day can be skipped or written twice.
- **A window left open past midnight.** It keeps writing to the day it opened until Today is pressed or the app is reopened.
- **A deleted note.** It is gone; there is no undo and no trash.
- **A corrupt database.** The app stops and names the file; it never recreates it over the notes.
- **A full disk or a read-only data folder.** The save fails, the app says so and keeps the text on screen; it never reports a save that did not happen.
- **A note past a book.** No pagination, so a very long note is slow to open.
- **A restore from another machine.** The data folder can be copied in with the app closed; there is no import screen.
- **Two OS users on one machine.** Each has their own data folder and notes; there is no shared log.

## Acceptance

v1.0 is done when each of these holds, and someone other than its author can check it.

- A build for macOS, Windows and Linux opens on today with the cursor in an empty note.
- No account, sign-in, network request or update check exists; the app works with the network off.
- Typing a paragraph, waiting a moment, quitting normally and reopening leaves every character.
- The app has no save button, no dirty state and no unsaved-changes dialog.
- The log opens on today and scrolling reaches every older day that has a note; a future day cannot be written.
- Clearing a note leaves the day empty; deleting asks once and cannot be undone.
- The notes are one SQLite database in the app's data folder; the app writes nothing outside that folder.
- A failed save is shown and the text stays on screen; no success is reported.
- A corrupt database stops the app with its path and is not overwritten.
- The macOS build is signed and notarized and opens without a Gatekeeper warning.
- No AI, no account, no sync and no telemetry are present.

## Changelog

- **v1.0** — the live day: one note per day, written as it is typed, on the desktop; no account, server or network.

## Roadmap

Candidates, not commitments: each is decided when the version before it is live, and each lands with its own ADR and an edit to this document.

- **v1.1** — search: find a note by what it says, instead of remembering the date.
- **v1.2** — the assistant: AI summaries, questions and suggestions, on the terms above.
- **v1.3** — the shortcut: a global hotkey opens today's note from anywhere.

Cloud sync is not a v1.x candidate. If it comes, it is a v2 decision that syncs the local store; it never turns the app into a cloud app.
