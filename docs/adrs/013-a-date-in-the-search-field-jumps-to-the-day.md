# 013 - A Date in the Search Field Jumps to the Day

## Context

v1.2 puts one field above the log and answers it with `notes_fts` ([010](010-search-reads-an-index-over-the-notes.md)). That finds a day by what it says. A day is also an address, and the product's own list of what v1.0 leaves out names "no calendar and no jump to a date": scrolling thirty days at a time is the only way back to an old entry.

A second field, a calendar popover or a picker is a surface to explain and a state to keep. The field is already there, it takes text, and a date is text.

## Decision

- The field resolves a date before it searches. What is typed is a date only when it is `YYYY-MM-DD` exactly — ten characters, digits and dashes — and names a real calendar day; anything else is a query.
- The date is answered by the backend, not the page. The page sends what was typed; the backend validates it with the day rules it already owns, refuses one after today, and answers with the page of the log the app already reads, bounded by the day after the target. No new store call and no schema.
- The result is the log scrolled to that day, not a second view. A day with a note is the target; a day with nothing written is not in the log, so the app lands on the newest day at or before it and says so once in the status line.
- A date after today is refused in words, and the log does not move.
- This narrows [010](010-search-reads-an-index-over-the-notes.md)'s "A query is words: every word must match": a date-shaped input is resolved before that rule applies, and only an exact `YYYY-MM-DD` is a date.
- The text stays in the field after the jump, so the person can see what was asked and correct it.

## Consequences

- One field carries two behaviours, and a note whose whole body is a date cannot be found by searching for that date. That is what not adding a picker costs.
- Only the ISO shape is accepted. `31/10/2026` and `October 31` are searched as words and find nothing, which is honest: there is no locale to guess and no format to explain.
- A jump to an empty day lands somewhere else, and the status line is the only thing that says why.
- No state is added: the field's text is the query, and clearing it is the way back to today.
