# 029 - The Bar Carries Only the Page's Controls

## Context

[`021`](021-search-is-a-mode.md) made the search a mode that replaces the log,
[`023`](023-settings-is-a-page-in-the-window.md) made settings a page in the
same window, and [`028`](028-the-search-has-no-control.md) left the bar's right
corner reading Today and settings on every one of them.

Both of those are places the person leaves, and the corner offered no way out:
it offered Today, which reloads the log behind a page that is still open, and
the gear, which on the settings page reopens the page it is already on. Leaving
took Esc — with the caret in the search field, or anywhere on the settings page
— while the corner said nothing about it.

A control that does nothing for the page it sits on is a control to find, learn
and then ignore, on a bar that carries nothing else.

## Decision

- The bar's left corner is the window's: close, minimize and zoom on all three
  pages.
- The bar's right corner belongs to the page below it. The log shows Today and
  the gear; the search and the settings page each show one back button, a cross,
  and nothing else.
- The cross and Esc do the same thing: the search closes to the log at today,
  the settings page closes to the log it left — the same day, scroll and focus.
- Esc leaves the search from anywhere in the mode, not only from its field,
  because a result takes the focus. On the log it does nothing.
- The keys are unchanged and are not controls: ⌘F still opens the search from
  the settings page, and ⌘T still takes the Today path from either mode.
- Everything else about the two pages is [`021`](021-search-is-a-mode.md)'s,
  [`023`](023-settings-is-a-page-in-the-window.md)'s and
  [`028`](028-the-search-has-no-control.md)'s.

## Consequences

- [`028`](028-the-search-has-no-control.md)'s "The bar's right corner no longer
  changes while the mode is open" and "Today takes the mode's place back" fall:
  the corner changes with the page, and Today is reached by leaving first.
- [`023`](023-settings-is-a-page-in-the-window.md)'s "It shows a pressed state
  while the page is open and does not become a close icon" falls. The gear is
  not drawn while the page is open, so it has no state to draw; the cross is the
  page's control, and the page itself says where the person is.
- [`023`](023-settings-is-a-page-in-the-window.md)'s "Today and search leave it
  for their own destinations" keeps only the search: ⌘F leaves the settings page
  for the search, and the cross and Esc leave it for the log.
- [`028`](028-the-search-has-no-control.md)'s "Esc closes the mode only from the
  field" falls; its reason — the way out is one keystroke away — now holds for
  the whole mode, and the cross is a second way out beside it.
- From the search this costs nothing: the cross lands on today, which is what
  Today did there. From the settings page it costs a second click, because the
  cross returns to the day the page left and not to today; ⌘T is the one step.
- The cross is a bar icon in the slot the gear held, at the other icons' size,
  so the log's two controls and a page's one occupy the same corner and the page
  below them does not move.
- Esc is still one key with two destinations, and still does nothing on the log
  ([`015`](015-keys-and-nothing-to-configure.md)).
