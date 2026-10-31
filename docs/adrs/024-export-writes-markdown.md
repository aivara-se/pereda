# 024 - Export Writes Markdown, One File a Day

## Context

[005](005-no-export-in-v1.md) refused an export in v1.0 and left a future one to a new version and a new record. Since then the notes have left only as the data folder: one row per day in SQLite ([003](003-sqlite-is-the-store.md)), a database any SQLite tool opens but not a readable log. [023](023-settings-is-a-page-in-the-window.md) gives the flow a page; this record is the flow.

A Markdown file per day is the smallest readable copy: the note has one day and no title, so the filename is the date and the body needs no format. A single archive or a JSON file would need a shape to explain; Markdown needs none.

## Decision

- **Export Data** writes one file per day that has a note, named `YYYY-MM-DD.md`, into a folder the person chooses with the native folder picker.
- The section carries the rule in one sentence, one button — **Export to folder…** — and the result; no destination field, no range and no options.
- The file is the note's body verbatim, UTF-8: no title, front matter, escaping, wrapping or added newline. A day with no text writes no file.
- The page flushes every loaded note first and refuses to start if a save failed. The database is read, never written, and the export is one-way.
- The backend reads every non-empty day in one store call, oldest first, and writes the files in that order. The page never touches the filesystem.
- A file with the same name in the chosen folder is replaced; the section says so before the button.
- The section reports the outcome: how many notes were written and the folder, or the day and reason the first write failed and how many were written before it. Files already written stay.
- One export at a time; the button is disabled while it runs. The folder is chosen each time and not remembered.

## Consequences

- The app writes outside its data folder while an export runs. [005](005-no-export-in-v1.md)'s "The app writes nothing outside its data folder" and the product's "The app writes nothing outside that folder" fall; the exception is the folder the person picks, for the files written.
- A same-named file is replaced without a second question. The section's sentence is the only warning; exporting into a folder of someone else's `YYYY-MM-DD.md` files can lose one.
- A failure stops the export, not the app: the notes are unchanged, the files already written stay, and a retry replaces them. The section's count is the only record; nothing is stored.
- The export is one-way: there is no importer, and Markdown is never read back. The database stays the only authority, and the data folder stays the backup and restore path.
- A very large log makes one long backend call; the page shows a busy state, not progress.
- When this lands, the product's "Not an exporter" and "the notes leave only as the data folder" fall; the data folder remains the backup, and "never locks the notes in" gains an executable meaning.
