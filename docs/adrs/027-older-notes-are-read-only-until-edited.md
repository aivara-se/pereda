# 027 - Older Notes Are Read-Only Until Edited

## Context

[`026`](026-a-notes-actions-are-edit-summarise-and-delete.md) put edit, summarise and delete under every date, today included, and left every note writable. A note is a textarea that took a keystroke wherever the caret happened to be, so an older day could be changed by a stray click; today's row put a delete and a summarise on a note that was empty when it opened, and neither did anything useful there.

[`022`](022-today-dims-the-window.md) tied the fade to today's note having the caret.

## Decision

- An older note is read-only until its edit button is pressed. Edit makes the text writable, puts the caret at the end, and fades the bar and every other entry as today's note does. Blur returns the note to read-only.
- Today is always writable and has no action row: no edit, summarise or delete.
- An older note's actions are edit, summarise and delete, in that order. Delete asks once and cannot be undone; a deleted day leaves the log.
- The row is drawn while the entry has focus or the pointer is over it, so a read-only note shows its edit button before a click.
- ⌘↑ and ⌘↓ open the note they reach for writing, because the key's promise is the caret at the end.
- A summarise refusal is shown in the panel marked as no summary, as well as in the status line, so a press always answers.

## Consequences

- [`026`](026-a-notes-actions-are-edit-summarise-and-delete.md)'s "every entry, today included" and "Delete asks once on every day… today's note is cleared" stop. Its row order and size stand for older notes; the row's focus rule widens to the pointer.
- [`022`](022-today-dims-the-window.md)'s fade no longer names today: it follows the writable note with the caret.
- Today's delete dialog is gone; clearing today's last character is the only way its text goes, and it asks nothing.
- A note that was being written when settings opened gets its caret back on close; an older note that was only being read comes back read-only.
- The summary is reachable only on an older note, which always has text.
