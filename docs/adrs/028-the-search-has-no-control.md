# 028 - The Search Has No Control

## Context

[`021`](021-search-is-a-mode.md) put the search behind one magnifier button in
the slot delete left, so the bar's right side read Today, settings, search
([`023`](023-settings-is-a-page-in-the-window.md)). [`015`](015-keys-and-nothing-to-configure.md)
kept the keys undiscoverable on the grounds that every one of them had a
control that did the same, and the magnifier was ⌘F's.

The mode is a place the person goes to read an older day, and the key already
opens it with the caret in the field. A button in the corner is a second way in
that the bar pays for in width on every day, on a bar that otherwise carries the
day and the settings.

## Decision

- The bar carries two controls at its right: Today and settings. No search
  button, and no second way into the mode.
- ⌘F / Ctrl+F is the search's only control: it opens the mode, puts the caret in
  the field and selects what is there.
- Esc in the field closes the mode: it empties the field and returns the log to
  today, as [`021`](021-search-is-a-mode.md) decided. Today, the gear and a
  result leave the mode too, each going where it already went.
- The field, the results, the date jump and the bound that keeps today out of a
  text search are unchanged.

## Consequences

- [`021`](021-search-is-a-mode.md)'s "The slot delete left holds one magnifier
  button" and its magnifier clause fall; its Esc rule and the mode's behaviour
  stand.
- [`015`](015-keys-and-nothing-to-configure.md)'s "every key has a control
  already" falls for ⌘F alone. Search is learned from these documents, and
  someone who never learns it keeps the log and loses nothing else.
- Esc closes the mode only from the field, and the mode opens with the caret
  there, so the way out is always the one keystroke away.
- The bar's right corner no longer changes while the mode is open: Today takes
  the mode's place back the way it always could, by loading the log at today.
- With no button to press, a person who does not read the documents has no
  affordance for search at all; that is the cost this record accepts.
