# 005 - No Export in v1.0

## Context

PRODUCT promised an export, and [002](002-local-only-in-v1.md) and [003](003-sqlite-is-the-store.md) name the Markdown files as the readable copy. The version carries one flow, the live day; the export was a second one — a folder picker, a file per day, a stop halfway — and every path in it is a way to report an outcome that did not happen.

## Decision

v1.0 has no export: no Markdown files, no folder picker and no export control. The data folder is the whole of the notes, and copying it with the app closed is the backup. This overrides every clause of [002](002-local-only-in-v1.md) and [003](003-sqlite-is-the-store.md) that names an export:

- 002: "or exports", and "The export is the readable copy."
- 003, its Context: "and export it".
- 003: "besides an export", and "The file is not a human-readable log; the Markdown export is the readable copy, and it is one-way."

## Consequences

- A lost disk loses the notes unless the data folder is backed up. The SQLite file opens in any SQLite tool, but it is not a human-readable log.
- The app writes nothing outside its data folder.
- A future export is a new version and a new record; it does not return by restoring this one.
