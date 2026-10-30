# 010 - Search Reads an Index Over the Notes

## Context

The log is the index: a day is reached by scrolling to it. The product decides a search — find a note by what it says — and the notes are one row per day in SQLite ([003](003-sqlite-is-the-store.md)), whose bodies are the only text there is.

Scanning every body for the words needs no second structure, but it cannot fold case outside ASCII: SQLite's `LIKE` and `lower()` know `A`–`Z`, so a note that opens "Äpple" is not found by "äpple". For a language with three extra vowels that is half a search. The runtime ships SQLite 3.51.2 with FTS5, whose `unicode61` tokenizer folds case in every script.

Measured on the shipped runtime (tinyjs 0.68.0): with `remove_diacritics 0`, "äpp\*" and "ÄPP\*" both find "Äpple", while "hjart\*" does not find "hjärta"; the triggers below keep the index in step through insert, update and delete; and the index costs about a third more file — 4.7 MB without it and 6.4 MB with, for 1,000 notes of about 1.2 KB.

## Decision

- An FTS5 table `notes_fts(day UNINDEXED, body)` in the same database, at schema version 2, populated from `notes` in the migration and rebuildable from it at any time.
- Three triggers on `notes` — after insert, update and delete — keep it in step inside the same transaction. The index is derived: `notes` remains the only authority, and a result is never read from the index alone.
- Tokenizer `unicode61` with `remove_diacritics 0`, so case folds while å, ä and ö stay their own letters.
- A query is words: every word must match, in any order, each as a prefix, so "appl" finds "apple". No quotes, operators, regex or phrases.
- One backend call returns the matching days newest first, each with its day and a snippet, capped at 50. The page never sees SQL.
- A field above the log runs the query on a debounce; an empty field returns the log at today.

## Consequences

- Every save writes a second structure; a trigger that fails fails the save, which is the right failure — a note is never written without being searchable.
- The file grows by about a third, because the index is a second copy of the text: `notes` is `WITHOUT ROWID`, so FTS5's external-content mode, which maps rows by rowid, would need the table rebuilt.
- Schema version 2 is forward-only: a build that reads version 1 refuses this file, as the store already refuses a version it does not know. There is no downgrade.
- Matching is by word, not substring, and a prefix matches more than the person typed; there is no stop list, so a common word returns many days.
- There is no relevance ranking: newest first is the log's order, and a snippet is the text around the first match, not a summary.
- When this lands, [003](003-sqlite-is-the-store.md)'s "no full-text table" and its "v1.0 is `1`" fall. The one row per day, the tombstone and the ordered write stand.
