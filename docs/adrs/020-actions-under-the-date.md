# 020 - A Note's Actions Sit Under Its Date

## Context

The bar is the window's chrome: close, minimize and zoom at the left, Today and delete at the right. Delete acts on the entry with the caret, not on the window, but it sits in the bar, away from the note it acts on; on a long note the eye leaves the text to find it. The date column already names the note in 11 px uppercase beside the text.

The product's delete asks once and cannot be undone. Today's note can also be removed by clearing its last character, which asks nothing.

## Decision

- The actions of the entry in focus sit in its date column, under the date: a row of icon buttons aligned with the date's edge, in its muted colour.
- The icons are 13 px in a 24 px button, small enough to read as part of the date and large enough to hit.
- The row appears in the space below the date and changes no entry's height, so focus moves no text.
- Delete is the only action in this version. A later action joins this row rather than the bar.
- The row is drawn only while the entry has focus. Every older day in the log has text by construction; today's note has no row.
- The dialog is unchanged: one question, the day named, no undo.

## Consequences

- The bar's right side no longer holds delete; what occupies that slot is not this record's decision.
- Today's note loses its delete button. Clearing the last character removes it silently, where the bar's dialog used to ask. The product's "Deleting a day asks once" now holds for every day but today, and the clearing rule already covers it.
- Delete is reached where the note is, not where the window is controlled.
- Nothing is stored: the row arrives and leaves with focus, and there is no mode.
- When this lands, the product's "Today and delete at its right" falls, and its acceptance line "deleting asks once and cannot be undone" narrows to every day but today.
