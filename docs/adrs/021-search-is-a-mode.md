# 021 - Search Is a Mode Opened From the Bar

## Context

[010](010-search-reads-an-index-over-the-notes.md) decided a field above the log that searches the notes, each word a prefix; [013](013-a-date-in-the-search-field-jumps-to-the-day.md) decided a date typed there opens its day; [015](015-keys-and-nothing-to-configure.md) made ⌘F focus the field. Today the field is drawn on every visit, so the log and the search share the screen while the product calls them two flows.

The search is a place the person goes to find an older day, not a permanent row. A hidden field costs a way in; the bar has one after delete leaves it ([020](020-actions-under-the-date.md)).

## Decision

- The log view draws no field. The slot delete left holds one magnifier button.
- A click on it, or ⌘F / Ctrl+F, opens search mode: the log is replaced, today's entry with it; the field takes focus, and the results area reads "Type a word, or a date." until the first character.
- Typing searches as [010](010-search-reads-an-index-over-the-notes.md) decided, with one bound: a text query never returns today.
- The results are the older days that match, newest first, at most fifty; a query that matches none says so.
- A query that is exactly `YYYY-MM-DD` still opens the log at that day before the word rule, today included ([013](013-a-date-in-the-search-field-jumps-to-the-day.md)). The jump closes the mode and empties the field.
- An empty field shows the placeholder and stays open.
- Esc in the field, or the magnifier, which becomes a close button while the mode is open, closes it: the field empties and the log returns at today.

## Consequences

- A text search never finds today's note. A word written only today returns nothing, and the only way to see it is to close the search; the today entry is back at the top when it closes.
- The mode replaces the log rather than scrolling it, so closing returns to the top at today, not to the day being read. That is [015](015-keys-and-nothing-to-configure.md)'s Esc rule, now also the button's.
- ⌘F keeps its meaning and gains a step: with the field gone from the default view, the key opens the mode before it focuses the field.
- The backend call is unchanged; the exclusion is one bound on the same query, so the index still answers it.
- A mistyped but valid date cannot be corrected in place: the jump closes the mode, and the field is empty when it reopens.
- When this lands, [010](010-search-reads-an-index-over-the-notes.md)'s "an empty field returns the log at today" falls.
- [013](013-a-date-in-the-search-field-jumps-to-the-day.md)'s "The text stays in the field after the jump" and "clearing it is the way back to today" fall; [015](015-keys-and-nothing-to-configure.md)'s key list stands.
- The product's "A field above the log" and "An empty field returns to today" fall, and its acceptance clause "an empty field returns to today" with them.
