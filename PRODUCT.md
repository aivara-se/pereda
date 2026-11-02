# Pereda: product

Pereda is a real-time daily note app for the desktop. It opens on today, one note per day, and everything typed is written to disk as it is typed: there is no save button, no draft state and no sync step. It is a local app — no account, no server, no network. The notes are one database on the computer, and the app works with the network off.

Pereda has two flows — **the live day**, which opens on today's entry at the top of one log and writes it as it is typed, and **the search**, which finds an older day by what it says or jumps to a day typed as a date — a settings page that exports the log, and, under an older date, the note's own actions: edit, summarise and delete. A shortcut brings the window forward on today from whatever app is in front.

**Live is the promise.** The note is not a document that is saved; it is written as it is made. The app never asks whether to keep the work, because it already has. A quit a moment after typing loses nothing, and a crash can lose only the last moment before it.

## The app

- One window, one person, one machine. There is no account and no sign-in: the notes belong to the operating system's user.
- It runs on macOS 15 or later (Apple silicon and Intel), Windows 10 or 11, and a Linux desktop with WebKitGTK 4.1. A build is about 9.5 MB and needs no runtime beyond the OS's webview.
- It is downloaded, not signed up for: anyone can download it, and there is no hosted version and nothing to self-host.
- It opens on today with the cursor in the note.
- While the app runs, ⌘⇧D — Ctrl+Shift+D on Windows and Linux — brings it forward on today from any app. The combination is fixed: no setting, no second window, no tray.
- An older note is read-only until its edit button is pressed. Edit makes it writable, puts the caret in it and fades the bar and the other entries as today's note does; leaving the note ends the edit. Its other actions are summarise and delete, and they show while the note is selected; a press anywhere on the entry selects it, and a pointer that only passes over it changes nothing ([`032`](docs/adrs/032-an-entrys-actions-belong-to-selection.md)). Today is always writable, has no action row, and is selected when the app opens.
- A File menu opens the data folder, so the backup is a copy the person can find without being told a path.
- Four fixed keys: ⌘F — Ctrl+F on Windows and Linux — is the only way into the search, Esc closes the search at today or settings where it opened, ⌘T takes the Today path, and ⌘↑/⌘↓ move between days with the caret at the end. Nothing is configurable.
- The window is frameless and the page draws its bar: close, minimize and zoom at its left on every page, and the page's own controls at its right — Today and the gear on the log, one back button on the search and on the settings page — and a paper translucent enough to read the desktop through ([`029`](docs/adrs/029-the-bar-carries-only-the-pages-controls.md)).
- A page change cross-fades in place, and a surface that comes or goes fades without moving the page. Nothing moves while the person types, and the system's Reduce Motion setting turns every transition off ([`031`](docs/adrs/031-the-window-moves-in-one-language.md)). The fixed values are in [`DESIGN.md`](DESIGN.md).
- Settings is a page in the same window, opened from the bar's gear. It replaces the log, which stays loaded; the bar's back button, or Esc, returns to the same day and scroll with the note's focus back — the caret where it was writable. Nothing is stored: the app always opens on today.

## The day

- One note per day. A day is the computer's local calendar day, and it starts at midnight.
- The app opens on today. A note begins with its first character, so a day with nothing written leaves nothing behind.
- Every day with a note is in the log; an older one is written after its edit button, today without one. Today is there even when it is empty. A future day cannot be written, and a past day with nothing written is not in the log. A note is never closed.
- A window left open across midnight keeps the entry it opened; Today moves the log. While the loaded day is behind, the status line says where the text is going — “Writing to 31 October — today is 1 November.” — and nothing moves on its own.

## The note

- A note is Markdown source with paragraphs. Five forms render where they stand — `*italic*`, `**bold**`, `~~struck~~`, `` `code` `` and a fenced block — and each shows its markers again while the caret is inside it. Everything else is literal: no title, headings, lists, links, images, checkboxes, tags or tables ([`030`](docs/adrs/030-the-note-renders-its-markdown.md)).
- One person writes it. There is no sharing, no second writer and no public link.
- Clearing every character of a note removes it; the day remains empty.
- Delete asks once on an older day and cannot be undone. Today has no delete: clearing its last character removes the text.
- While a note is being written — today always, an older note after its edit button — the bar and every other entry fade to a quarter; the text, the status line and a summary stay legible.

## Reading back

- The log is the index: every day with a note, newest first, with today at the top.
- The note shows its date beside the text; there is no title to remember.
- ⌘F opens a mode: the log and today's entry leave the screen, and a field finds a day by its words — every word must be in the note, in any order, and a word may be only its beginning, so "appl" finds "apple". Case does not matter, and å, ä and ö are their own letters. A text search never returns today.
- The results are the matching days newest first, each with its date and the text around the match, at most fifty. There is no ranking and no summary.
- Scrolling down reaches older days, a page at a time, and a result opens the log at its day. Closing the search returns to today. There is no calendar and no picker; a date is named by typing it.
- A date typed as `YYYY-MM-DD` opens the log at that day. A day after today is refused, and a day with nothing written lands on the newest day at or before it — today included, even when empty — with that said once in the status line.

## Your data

- The notes are one SQLite database in the app's data folder. The app writes nothing outside that folder, except the folder chosen for an export.
- The data folder is the backup: copy it with the app closed, and copy it back to restore. It is portable between the three platforms.
- **Show data folder** in the File menu opens that folder in the system's file manager. It copies nothing, chooses no destination and verifies nothing.
- An export writes one Markdown file per day that has a note, named `YYYY-MM-DD.md`, into a folder chosen each time. The note's text is written verbatim; a file with the same name in that folder is replaced, and the section says so before the button. The app reports how many files it wrote and where, or the first day that failed and why.
- In v1.14 the app makes no network request: no account, no telemetry, no update check. A new version is a download.
- Deleting a note removes its text; there is no trash.

## What it never does

- Never asks for a save: no save button, no dirty state, no "unsaved changes" dialog.
- Never asks for structure: no notebooks, titles, templates, tags or required fields.
- Never calls the network on its own: a request exists only when the person starts a feature that needs one, and v1.14 has none.
- Never sends a note anywhere without the person asking.
- Never shows an ad, sells a note, or trains a model on one.
- Never lets AI write into a note unmarked and unaccepted.
- Never turns a note into a metric: no streak, no count, no score.
- Never locks the notes in: the database file is the person's.

## AI, on this Mac

The assistant has one action: summarise an older note, with Apple's on-device model, from the button under its date. Every word it produces is marked and nothing it produces leaves the computer. It exists only on macOS 26 or later with Apple Intelligence on; where the model is off, still downloading or absent, the panel says why and the note stays as it is. Questions across the log and suggested lines are not in v1.x.

## What it does not do

- Not a cloud app: no account, no sync, no collaboration, no sharing.
- Not a service: no hosted version, no self-hosted server, nothing to deploy.
- Not rich text beyond the five forms above ([`030`](docs/adrs/030-the-note-renders-its-markdown.md)).
- Not mobile: no iOS or Android app.
- Not an importer: notes from other apps, or from the old pereda.app, are not imported.
- Not self-updating: a new version is a download.
- Not an assistant beyond a summary: no questions across the log, no suggested lines, no chat.

## Edge cases left unhandled

Known, and deliberately not handled in this version.

- **A crash inside the save window.** The last edit before the crash, at most a moment, can be lost; nothing older is.
- **The clock or timezone changes.** Existing notes keep their dates; near the change, a day can be skipped or written twice.
- **A window left open past midnight.** It keeps writing to the day it opened until Today is pressed or the app is reopened; the status line names that day while it does.
- **A deleted note.** It is gone; there is no undo and no trash.
- **A note written before the markers.** Its bytes do not change, but a tight marker pair in it renders where it used to read as text.
- **A corrupt database.** The app stops and names the file; it never recreates it over the notes.
- **The assistant.** It exists only on macOS 26 with Apple Intelligence on; when the model is off or still downloading, the note's summarise button says why in the panel.
- **The File menu on Windows.** The runtime draws no menu bar on a frameless, transparent window, so **Show data folder** is not there and the folder stays a path the person has to be told ([`018`](docs/adrs/018-the-menu-is-where-the-runtime-draws-one.md)).
- **A full disk or a read-only data folder.** The save fails, the app says so and keeps the text on screen; it never reports a save that did not happen.
- **A note past a book.** No pagination, so a very long note is slow to open.
- **A restore from another machine.** The data folder can be copied in with the app closed; there is no import screen.
- **An export folder of the same names.** A `YYYY-MM-DD.md` file already there is replaced without a second question; the section is the only warning.
- **Two OS users on one machine.** Each has their own data folder and notes; there is no shared log.

## Acceptance

v1.0 is done when each of these holds, and someone other than its author can check it; v1.14 keeps every one.

- A build for macOS, Windows and Linux opens on today with the cursor in an empty note.
- No account, sign-in, network request or update check exists; the app works with the network off.
- Typing a paragraph, waiting a moment, quitting normally and reopening leaves every character.
- `**bold**` shows bold with its markers hidden, shows them again with the caret inside, and the export writes the same characters either way.
- The app has no save button, no dirty state and no unsaved-changes dialog.
- The log opens on today and scrolling reaches every older day that has a note; a future day cannot be written.
- A window left open across midnight keeps writing to the day it opened, and the status line names that day and today until Today moves the log.
- While the app runs, the shortcut brings the window forward on today; a system that refuses the combination says so once and takes nothing else away.
- ⌘F opens the search and is the only way in; Esc closes it at today or settings where it opened, ⌘T takes the Today path, and ⌘↑/⌘↓ move between days with the caret at the end. The other three keys each have a control that does the same.
- Settings opens from the bar as a page in the window; its back button or Esc closes it to the log it left, with the same day, scroll and focus.
- The bar's right corner shows only the controls the page below it uses — Today and the gear on the log, one back button on the search and on the settings page — while close, minimize and zoom sit at its left on all three.
- An older note is read-only until its edit button is pressed; today is always writable, and no action sits under its date.
- While a note is being written — today always, an older note after its edit — the bar and the other entries fade; blur restores the window.
- On macOS 26 with Apple Intelligence on, pressing an older note's summarise action shows its summary in a panel marked as generated on this Mac, and no word of it enters the note.
- A search finds an older day by a word from its note, folded for case and for å, ä and ö, newest first; a result opens the log at its day, today is never a text result, and closing returns to today.
- A date typed as `YYYY-MM-DD` opens the log at that day; a day after today is refused in words, and a target with no note lands on the newest day at or before it, today included.
- Clearing a note leaves the day empty; deleting an older day asks once and cannot be undone.
- Export writes one Markdown file per day into the chosen folder, verbatim and UTF-8; a same-named file is replaced, and the result names the count and folder or the first day that failed.
- The notes are one SQLite database in the app's data folder; the only other writes are an export's files, into the folder the person chose.
- **Show data folder** opens that folder in the system's file manager on macOS and Linux; when it cannot, the status line shows the path as text.
- A failed save is shown and the text stays on screen; no success is reported.
- A corrupt database stops the app with its path and is not overwritten.
- The macOS build is signed and notarized and opens without a Gatekeeper warning.
- No AI, no account, no sync and no telemetry are present.

## Changelog

- **v1.14** — the note renders its Markdown where it is typed, five forms whose markers show again while the caret is inside, and the bar carries only the page's controls, with one cross out of the search and the settings page.
- **v1.13** — the bar without search: Today and settings are the only controls at its right, ⌘F is the only way into the search, and the gear matches the other bar icons.
- **v1.12** — read-only days: an older note waits for its edit button before it takes a keystroke, writing it fades the rest of the window, and today has no action row.
- **v1.11** — a note's actions: edit, summarise and delete sit under every date, today included; today's delete clears the note, and the assistant's menu switch is gone.
- **v1.10** — settings and export: a page in the window holds Export Data, which writes one Markdown file per day into a folder the person picks.
- **v1.9** — focus: today's note fades the bar and the older log while it has the caret, search is a mode opened from the bar that never returns today, and an older note's delete sits under its date.
- **v1.8** — midnight said: a status line names the day the text is going to when the window is behind, and nothing moves until Today.
- **v1.7** — the keys: ⌘F, Esc, ⌘T and ⌘↑/⌘↓, fixed and with nothing to configure.
- **v1.6** — the data folder: one File menu item opens the folder the notes live in, so the backup is a copy the person can find.
- **v1.5** — jump to a day: a date typed as `YYYY-MM-DD` into the search field opens that day; a day after today is refused, and an empty day lands on the newest day at or before it, today included.
- **v1.4** — the assistant: summarise the note on screen with the model on this Mac, off until turned on, marked, and never written into the note.
- **v1.3** — the shortcut: ⌘⇧D brings the window forward on today from any app while Pereda runs, and a system that will not give it up says so once.
- **v1.2** — search: a field above the log finds a day by its words, newest first, each word matched as a prefix; a result opens the log at its day.
- **v1.1** — the window draws its own frame: a frameless, translucent window with close, minimize and zoom in the page's bar.
- **v1.0** — the live day: one note per day, written as it is typed, on the desktop; no account, server or network.

## Roadmap

Two decisions are recorded and not built: v1.15, the window's motion and the entry's selected state ([`031`](docs/adrs/031-the-window-moves-in-one-language.md), [`032`](docs/adrs/032-an-entrys-actions-belong-to-selection.md)). Everything else decided for v1.x is built; the binary is v1.14. Cloud sync is not a v1.x candidate: if it comes, it is a v2 decision that syncs the local store, and it never turns the app into a cloud app.
