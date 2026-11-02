# 032 - An Entry's Actions Belong to Selection

## Context

[`020`](020-actions-under-the-date.md) put an entry's actions in its date column, outside the flow, and drew them only while the entry had focus. [`027`](027-older-notes-are-read-only-until-edited.md) widened that to the pointer, so an older note offered its edit button before a click.

The log is a column of notes, and a pointer crosses many of them on its way anywhere. Each crossing makes a row of three icons arrive and leave. The person did not ask for it, and on a still page it is the loudest thing on screen.

## Decision

- An entry is selected when it holds focus, and one entry is selected at a time. Its actions show while it is selected, and at no other time.
- A pointer press anywhere on an entry selects it: its note, its date, or the space the entry holds. On a read-only note the press takes no keystroke ([`027`](027-older-notes-are-read-only-until-edited.md)).
- A pointer that moves over an entry changes nothing. No control appears and no date or text changes.
- Selection ends when another entry is selected, when the search or the settings page opens, or when focus leaves the log.
- The row arrives and leaves in place under the date, on [`031`](031-the-window-moves-in-one-language.md)'s entrance and exit, and it moves no text.
- Selection is the focus the keys already move from. It adds no state, it is not stored, and it is not a mode.
- Today is selected when the app opens and carries no row ([`027`](027-older-notes-are-read-only-until-edited.md)).

## Consequences

- [`027`](027-older-notes-are-read-only-until-edited.md)'s "The row is drawn while the entry has focus or the pointer is over it" falls, and its "so a read-only note shows its edit button before a click" falls with it. [`020`](020-actions-under-the-date.md)'s focus rule stands unchanged.
- A person who does not know the row exists must press a note to find it. The press is the act that makes a note the one the window works on, and the row is its answer.
- The date column becomes part of the entry's hit area, not a label beside it, so a press on a date selects its entry.
- A pointer alone never reveals the row: reaching it costs one press on the note first.
- Edit, summarise and delete keep their order, size and dialogs. Delete still asks once.
- The keyboard order gains weight. Tab reaches an entry before its buttons, and an entry that is not selected offers no button to reach.
