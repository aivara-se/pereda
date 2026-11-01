# 026 - A Note's Actions Are Edit, Summarise and Delete

## Context

[`020`](020-actions-under-the-date.md) put delete in the focused entry's date
column and said a later action joins that row. The assistant was somewhere else:
[`012`](012-the-assistant-runs-on-this-machine.md) gave it a menu item and an
off-by-default switch, and [`017`](017-the-assistant-is-reread-on-focus.md)
rebuilt that menu when the window regained focus. To summarise the note in front
of you, you left the note for a menu; on Windows and Linux, where the runtime
draws no menu bar, the action was unreachable.

## Decision

- Every entry, today included, carries the same row under its date: edit,
  summarise and delete, in that order, in the date's muted colour.
- Edit puts the caret at the end of the note. It is the row's way back into the
  text.
- Summarise sends that note's text and shows the reply in the panel marked as
  generated on this Mac. The Assistant switch and its menu items are removed.
- Availability is read when the summary is asked for. The button is drawn on
  every platform; a model that is off, downloading or absent refuses in words
  the status line shows.
- Delete asks once on every day. An older day leaves the log; today's note is
  cleared and stays, because today is in the log even when it is empty.
- The row is still out of the flow, so the entry does not change height, and it
  still appears only while the entry has focus.

## Consequences

- [`020`](020-actions-under-the-date.md)'s "delete is the only action" and
  "today's note has no row" stop. Its placement, size and focus rule stand.
- [`012`](012-the-assistant-runs-on-this-machine.md)'s off switch and
  [`017`](017-the-assistant-is-reread-on-focus.md)'s menu rebuild stop. One
  surface remains, and it reads its own state per request, so nothing can go
  stale between the menu and the model.
- A platform without the model now shows the button and explains itself in the
  status line, where it used to show nothing.
- Today's delete is a dialog now; clearing its last character is still silent,
  but the button asks first. The product's "deleting asks once" holds for every
  day.
- The summary is still one request at a time and never enters the note.
