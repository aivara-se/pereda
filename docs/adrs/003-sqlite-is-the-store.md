# 003 - SQLite Is the Store

## Context

Pereda writes one body of plain text per day, and that body is the note. The app must write it as it is typed, survive a restart, keep a cleared day from coming back, and export it. What needs recording is where the notes live, because that choice decides what a backup is, what a crash can lose and what a future sync would have to reconcile.

The candidates:

- **One Markdown file per day.** Human-readable and easy to back up, but a write can leave a torn file, a directory of files is a second index to keep, and a rename-based save is a second implementation of atomicity.
- **One JSON file.** The whole log is rewritten on every save, and a crash in the write can truncate every note at once.
- **SQLite.** It is built into txiki.js as `tjs:sqlite`, it is transactional, and the whole store is one file ([sqlite](https://tinyjs.app/docs/sqlite)).

The app is single-window and single-writer, and v1.0 keeps no history.

## Decision

One SQLite database, `pereda.db`, in `app.paths().data`, opened with `journal_mode = WAL` and `synchronous = FULL`. One row per day:

```sql
CREATE TABLE notes (
  day  TEXT PRIMARY KEY,
  body TEXT NOT NULL,
  seq  INTEGER NOT NULL
) WITHOUT ROWID;
```

A save writes the whole body with the page's next `seq`, and the upsert applies only when `excluded.seq > notes.seq`. **A row is never deleted.** Clearing a note writes an empty body and leaves the row as a tombstone; every read filters `body <> ''`. That is what stops an out-of-order save from resurrecting a day that was cleared: the tombstone keeps the `seq`, and an older save loses the comparison.

There are no revisions, no history, no full-text table and no per-day files. `PRAGMA user_version` is the schema version; v1.0 is `1`.

## Consequences

- One data folder is the backup, and the app writes nothing outside it besides an export. Copying the folder with the app closed restores everything, on any of the three platforms.
- A save is transactional: a crash leaves the previous note or the new one, never half of each. `synchronous = FULL` is what makes a committed save survive a power loss; it costs a flush per save, which a daily note's write rate makes affordable.
- The whole body is rewritten per save. A very long note pays more per keystroke, and v1.0 accepts that rather than adding a diff protocol.
- There is no history and no undo. Clearing or deleting a note cannot be reversed; that is the product, not a missing feature.
- The file is not a human-readable log; the Markdown export is the readable copy, and it is one-way.
- A corrupt database is the failure domain: the app stops and names the file instead of recreating it over the notes.
- The `day` key and `seq` are a natural shape for a future sync, but no sync, no merge rule and no server are designed here.
- The page's editor must send whole bodies; a diff, an operational transform or a CRDT is not part of v1.0, and adding one would replace this decision rather than sit beside it.
