# Pereda: product

Pereda is a real-time daily note app for the desktop. It opens on today, one note per day, and everything typed is written to disk as it is typed: there is no save button, no draft state and no sync step. It is a local app — no account, no server, no network. The notes are one database on the computer, and the app works with the network off.

Pereda has two flows — **the live day**, which opens on today's entry at the top of one log and writes it as it is typed, and **the search**, which finds an older day by what it says or jumps to a day typed as a date — and one action beside them: a summary of the note on screen from the model on this Mac. A shortcut brings the window forward on today from whatever app is in front.

**Live is the promise.** The note is not a document that is saved; it is written as it is made. The app never asks whether to keep the work, because it already has. A quit a moment after typing loses nothing, and a crash can lose only the last moment before it.

## The app

- One window, one person, one machine. There is no account and no sign-in: the notes belong to the operating system's user.
- It runs on macOS 15 or later (Apple silicon and Intel), Windows 10 or 11, and a Linux desktop with WebKitGTK 4.1. A build is about 9.5 MB and needs no runtime beyond the OS's webview.
- It is downloaded, not signed up for: anyone can download it, and there is no hosted version and nothing to self-host.
- It opens on today with the cursor in the note.
- While the app runs, ⌘⇧D — Ctrl+Shift+D on Windows and Linux — brings it forward on today from any app. The combination is fixed: no setting, no second window, no tray.
- A menu carries the assistant. It is off until the person turns it on; the summary appears in a panel marked as generated on this Mac, and never enters the note.
- A File menu opens the data folder, so the backup is a copy the person can find without being told a path.
- The window is frameless and the page draws its bar: close, minimize and zoom at its left, Today and delete at its right, and a paper translucent enough to read the desktop through.

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
- A field above the log finds a day by its words: every word must be in the note, in any order, and a word may be only its beginning, so "appl" finds "apple". Case does not matter, and å, ä and ö are their own letters.
- The results are the matching days newest first, each with its date and the text around the match, at most fifty. There is no ranking and no summary.
- Scrolling down reaches older days, a page at a time, and a result opens the log at its day. An empty field returns to today. There is no calendar and no picker; a date is named by typing it.
- A date typed as `YYYY-MM-DD` opens the log at that day. A day after today is refused, and a day with nothing written lands on the newest day at or before it — today included, even when empty — with that said once in the status line.

## Your data

- The notes are one SQLite database in the app's data folder. The app writes nothing outside that folder.
- The data folder is the backup: copy it with the app closed, and copy it back to restore. It is portable between the three platforms.
- **Show data folder** in the File menu opens that folder in the system's file manager. It copies nothing, chooses no destination and verifies nothing.
- In v1.6 the app makes no network request: no account, no telemetry, no update check. A new version is a download.
- Deleting a note removes it; there is no trash.

## What it never does

- Never asks for a save: no save button, no dirty state, no "unsaved changes" dialog.
- Never asks for structure: no notebooks, titles, templates, tags or required fields.
- Never calls the network on its own: a request exists only when the person starts a feature that needs one, and v1.6 has none.
- Never sends a note anywhere without the person asking.
- Never shows an ad, sells a note, or trains a model on one.
- Never lets AI write into a note unmarked and unaccepted.
- Never turns a note into a metric: no streak, no count, no score.
- Never locks the notes in: the database file is the person's.

## AI, on this Mac

The assistant has one action: summarise the note on screen with Apple's on-device model. It is off until the person turns it on from the app's menu, every word it produces is marked, and nothing it produces leaves the computer. It exists only on macOS 26 or later with Apple Intelligence on; Windows and Linux have no assistant, because a model over the network is not a v1.x decision. Questions across the log and suggested lines are not in v1.x.

## What it does not do

- Not a cloud app: no account, no sync, no collaboration, no sharing.
- Not a service: no hosted version, no self-hosted server, nothing to deploy.
- Not rich text: no formatting, images, attachments, checkboxes, tables or backlinks.
- Not mobile: no iOS or Android app.
- Not an importer: notes from other apps, or from the old pereda.app, are not imported.
- Not an exporter: the notes leave only as the data folder; it writes no Markdown files.
- Not self-updating: a new version is a download.
- Not an assistant beyond a summary: no questions across the log, no suggested lines, no chat.

## Edge cases left unhandled

Known, and deliberately not handled in this version.

- **A crash inside the save window.** The last edit before the crash, at most a moment, can be lost; nothing older is.
- **The clock or timezone changes.** Existing notes keep their dates; near the change, a day can be skipped or written twice.
- **A window left open past midnight.** It keeps writing to the day it opened until Today is pressed or the app is reopened.
- **A deleted note.** It is gone; there is no undo and no trash.
- **A corrupt database.** The app stops and names the file; it never recreates it over the notes.
- **The assistant.** It exists only on macOS 26 with Apple Intelligence on; when the model is off or still downloading, the action is disabled with the reason.
- **A full disk or a read-only data folder.** The save fails, the app says so and keeps the text on screen; it never reports a save that did not happen.
- **A note past a book.** No pagination, so a very long note is slow to open.
- **A restore from another machine.** The data folder can be copied in with the app closed; there is no import screen.
- **Two OS users on one machine.** Each has their own data folder and notes; there is no shared log.

## Acceptance

v1.0 is done when each of these holds, and someone other than its author can check it; v1.6 keeps every one.

- A build for macOS, Windows and Linux opens on today with the cursor in an empty note.
- No account, sign-in, network request or update check exists; the app works with the network off.
- Typing a paragraph, waiting a moment, quitting normally and reopening leaves every character.
- The app has no save button, no dirty state and no unsaved-changes dialog.
- The log opens on today and scrolling reaches every older day that has a note; a future day cannot be written.
- While the app runs, the shortcut brings the window forward on today; a system that refuses the combination says so once and takes nothing else away.
- On macOS 26 with Apple Intelligence on, a summary of the note on screen appears in a panel marked as generated on this Mac; it is off until turned on, and no word of it enters the note.
- A search finds a day by a word from its note, folded for case and for å, ä and ö, newest first; a result opens the log at its day, and an empty field returns to today.
- A date typed as `YYYY-MM-DD` opens the log at that day; a day after today is refused in words, and a target with no note lands on the newest day at or before it, today included.
- Clearing a note leaves the day empty; deleting asks once and cannot be undone.
- The notes are one SQLite database in the app's data folder; the app writes nothing outside that folder.
- **Show data folder** opens that folder in the system's file manager; when it cannot, the status line shows the path as text.
- A failed save is shown and the text stays on screen; no success is reported.
- A corrupt database stops the app with its path and is not overwritten.
- The macOS build is signed and notarized and opens without a Gatekeeper warning.
- No AI, no account, no sync and no telemetry are present.

## Changelog

- **v1.6** — the data folder: one File menu item opens the folder the notes live in, so the backup is a copy the person can find.
- **v1.5** — jump to a day: a date typed as `YYYY-MM-DD` into the search field opens that day; a day after today is refused, and an empty day lands on the newest day at or before it, today included.
- **v1.4** — the assistant: summarise the note on screen with the model on this Mac, off until turned on, marked, and never written into the note.
- **v1.3** — the shortcut: ⌘⇧D brings the window forward on today from any app while Pereda runs, and a system that will not give it up says so once.
- **v1.2** — search: a field above the log finds a day by its words, newest first, each word matched as a prefix; a result opens the log at its day.
- **v1.1** — the window draws its own frame: a frameless, translucent window with close, minimize and zoom in the page's bar.
- **v1.0** — the live day: one note per day, written as it is typed, on the desktop; no account, server or network.

## Roadmap

Decided, not built: the binary is v1.6, and each of these lands with the ADR beside it. No dates.

- **v1.7** — the keys: ⌘F, Esc, ⌘T and ⌘↑/⌘↓, with nothing to configure ([`015`](docs/adrs/015-keys-and-nothing-to-configure.md)).
- **v1.8** — midnight said: the status line names the day the text is going to, and nothing moves ([`016`](docs/adrs/016-midnight-is-said-not-taken.md)).

Cloud sync is not a v1.x candidate. If it comes, it is a v2 decision that syncs the local store; it never turns the app into a cloud app.
