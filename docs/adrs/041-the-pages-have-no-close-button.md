# 041 - The Pages Have No Close Button

## Context

[`029`](029-the-bar-carries-only-the-pages-controls.md) put one cross in the bar's right corner for each of the two pages that replace the log, so the search and the settings page each had a pointer's way out beside Esc.

That corner is the bar's only right-hand control, and it changed the bar as the page changed: a page was the log with one more thing in it, and the thing said what the key already said. The search is entered by ⌘F and by nothing else ([`028`](028-the-search-has-no-control.md)), so the person in it has the keyboard in hand; the settings page is entered by the gear, and Esc, ⌘F and ⌘T all leave it.

What the corner cost was a second rule to learn: two pages, one cross each, doing what one key does on both.

## Decision

- Neither page carries a control of its own. Esc is the way out of the search, which it closes at today, and of the settings page, which it closes to the log it left.
- The bar carries only the window's three dots, which are always there, and it does not change as the page does.
- The gear stays off the search page and off the settings page, as it was.
- The keys do not change: ⌘F still opens the search from the log or the settings page, ⌘T still takes the Today path from either page, and Esc still does nothing on the log ([`015`](015-keys-and-nothing-to-configure.md)).

## Consequences

- [`029`](029-the-bar-carries-only-the-pages-controls.md)'s "the search and the settings page each show one back button, a cross, and nothing else" and "the cross and Esc do the same thing" fall together.
- [`036`](036-the-window-does-not-fade-and-the-gear-moves.md)'s "the bar's right corner carries one control: the back button, while the search or the settings page replaces the log" falls.
- The settings page loses its pointer-only way out: a person who opened it from the gear leaves it with Esc, ⌘F or ⌘T. The page a pointer opens is the page a key closes.
- The bar keeps its height, its drag area and its three dots in every state, and nothing in it arrives or leaves when the page changes.
- [`021`](021-search-is-a-mode.md)'s search mode and [`023`](023-settings-is-a-page-in-the-window.md)'s settings page do not change; only the control that closed them does.
