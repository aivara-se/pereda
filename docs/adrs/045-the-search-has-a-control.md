# 045 - The Search Has a Control

## Context

[`028`](028-the-search-has-no-control.md) fixed that the search is entered by ⌘F alone and that the bar carries no control for it; [`029`](029-the-bar-carries-only-the-pages-controls.md) and [`036`](036-the-window-does-not-fade-and-the-gear-moves.md) kept that rule while the corner changed hands.

The web page has carried a Search control since [`039`](039-the-web-app-takes-the-bar-and-the-notes-states.md), because a phone has no ⌘F, and [`043`](043-the-web-is-the-desktops-page.md) then made the two surfaces one page. Every other part of the bar matches; the desktop was the only one of the two without the search in it.

The operator asked the desktop to match the web, keeping only the window's three dots where the web draws the app's name.

## Decision

- The bar's right corner carries the search, then the gear, 5 px apart and 5 px from the bar's top and right edge ([`044`](044-the-controls-share-the-bars-corner.md)).
- The control opens the search as ⌘F does: the field takes the caret, selecting what is there, and the log leaves the screen. A press while the mode is open brings the caret back.
- While the mode is open the control is marked; the gear beside it stays and opens the settings page as it does from the log.
- Nothing else about the mode changes: Esc is its way out, the log is never rebuilt under it, and the results, the jump and the empty field are as they were.

## Consequences

- [`028`](028-the-search-has-no-control.md)'s decision that the search has no control falls, and with it that ADR's "The bar's right corner no longer changes while the mode is open"; its "⌘F / Ctrl+F is the search's only control" now reads one of two ways in.
- [`029`](029-the-bar-carries-only-the-pages-controls.md)'s "The log shows Today and the gear" reads the search and the gear, which is the corner [`044`](044-the-controls-share-the-bars-corner.md) draws.
- [`043`](043-the-web-is-the-desktops-page.md)'s "Search at its right at every width, because a phone has no ⌘F" keeps its placement and loses its contrast: both surfaces carry the control, and the phone is now one reason for it rather than the only one.
- The desktop gains a pointer's way into the search and keeps none out of it: [`041`](041-the-pages-have-no-close-button.md) left Esc as the only way out on that surface, and the web's name is the control the desktop does not draw.
- The control dims with the rest of the page while a note is written, as the gear does, and stays at full strength on the settings page, where it opens the search from it.
