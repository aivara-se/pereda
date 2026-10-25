# Pereda: product

Pereda is a daily note app for people who think in days. It opens on today, one page per day, and everything typed is saved and live on every device the account is open on. There is no notebook to file, no title to invent and no save button to press: the day is the page, and writing it is the whole job. It runs two ways — hosted by Aivara, or self-hosted from one binary — and the product is the same in both.

v1.0 carries one flow: **the live day**. An account opens today's note, writes, and finds the day again by its date.

**Live is the promise.** A change is saved as it is typed, not when a button is pressed, and it reaches every other open device of the account within a second. A connection that drops does not lose what was typed: the note keeps the text in the browser and sends it when the connection returns.

## The day

- One note per account per day. A day is the account's local calendar day, in the timezone the account sets, and it starts at midnight.
- The app opens on today. A note begins with its first character, so a day with nothing written leaves nothing behind.
- Any day up to today can be opened and written to. A note is never closed, and there is no final state.
- The calendar is the archive: every day up to today can be opened by its date, and a day with a note is marked.

## The note

- A note is plain text with paragraphs: no title, formatting, checkboxes, tags, attachments, images or structured links.
- One account writes a note; no other account can read or write it through the app in v1.0.
- There is no save, no draft and no sync control. The note on the page is the note.

## Reading back

- The calendar opens any day up to today, and the note shows its date above the text.
- The same account sees the same day and the same text on every device.
- A day is found by its date, not by a title or a search.

## Two ways to run it

- **Hosted by Aivara.** The service we run; anyone can create an account and write.
- **Self-hosted.** One binary and one data directory, with no external database, object store or service of ours. The operator runs it and decides who has an account; self-hosting is free.
- No note feature is withheld from a self-hosted instance. The hosted service adds only signup and the running of it.
- The source is public, and an instance's data stays on that instance.

## Your data

- Notes are private to their account. They are not public, shared, advertised or sold, and they are not used to train models.
- Deleting a note removes it from the account and the calendar. Deleting an account removes its notes. The hosted service's backups expire within 30 days (provisional).
- Every account can export all its notes as Markdown, one file per day.
- The operator of a self-hosted instance can reach its data; that is what running the instance means. No one at Aivara reads a hosted note except to operate the service.

## AI, later

AI is not in v1.0. When it comes it is an assistant to the writer, never the author: it may summarize a day, answer a question about the notes, or suggest a next line, and every word it produces is marked until the writer accepts it. It is off until the account turns it on, reads only the notes the account points it at, and never trains on them. A self-hosted instance uses the operator's own model key; the hosted service names the model it uses.

## What it never does

- Never asks for a save: no save button, no draft state, no sync control.
- Never asks for structure: no notebooks, titles, templates or required fields.
- Never loses a keystroke that reached the page: a dropped connection keeps the text and sends it on return.
- Never publishes a note, and never shares one except by the account's explicit act; v1.0 has no such act.
- Never shows an ad, sells a note, or trains a model on one.
- Never lets one account read or write another's note through the app.
- Never lets AI put text into a note unmarked and unaccepted.

## What v1.0 does not do

- Not a search. A day is found by its date.
- Not rich text: no formatting, images, attachments, checkboxes, tables or backlinks.
- Not shared: one account per note; no collaboration, comments or public links.
- Not native: no iOS or Android app; the web app works in a phone browser.
- Not offline from a cold start: an open note survives a dropped connection, but the app needs a connection to open.
- Not a migration: notes from other apps, or from the old pereda.app, are not imported.
- Not AI: no summaries, suggestions, questions or chat.
- Not federated: instances do not sync with each other.

## Edge cases v1.0 leaves unhandled

Known, and deliberately not handled in this version.

- **A tab left open past midnight.** It keeps writing to the day it opened until it is reloaded; the new day starts on the next open.
- **A note deleted on one device while it is open on another.** The other device keeps its copy until it reloads, and an edit there brings the note back.
- **The account changes timezone.** Existing notes keep their dates; near the change, a day can be skipped or written twice.
- **Two devices type into one note at once, then want to undo one side.** The text converges and no character is lost, but the merge has no history and there is no undo across devices.
- **The hosted service is down.** Hosted notes are unavailable until it returns; self-hosted instances are unaffected.
- **A note grows past a book.** v1.0 has no pagination, so a very long note is slow to open.

## Acceptance

v1.0 is done when each of these holds, and someone other than its author can check it.

- A new account on the hosted service reaches its first note in under a minute.
- The app opens on today, and no notebook, title, save or sync control exists.
- A character typed on one device appears on another open device of the same account within one second (provisional; the first month of hosted use freezes it).
- A connection dropped mid-sentence and restored leaves every character in the note.
- Two devices typing into one note at once converge to the same text, with no character lost.
- Every day with a note is reachable from the calendar by its date.
- A past day's note can be written to, and no note is ever closed.
- A deleted note leaves the calendar, and a deleted account's notes leave the service.
- Export produces one Markdown file per day, with that day's text.
- A self-hosted instance runs from one binary and one data directory, with no external service, and passes every item above.
- The hosted service and a self-hosted instance run the same release.
- No account can read or write another account's note through the app.
- No ad, sale or model training touches a note, and the v1.0 client makes no AI call.

## Changelog

- **v1.0** — the live day: one note per day, saved as it is typed and live on every device, hosted or self-hosted.

## Roadmap

Candidates, not commitments: each is decided when the version before it is live, and each lands with its own ADR and an edit to this document.

- **v1.1** — search: find every note that says a thing, instead of remembering the date.
- **v1.2** — the assistant: AI summaries, questions and suggestions, on the terms above.
- **v1.3** — a shared day: another account writes the same day with you, live.
