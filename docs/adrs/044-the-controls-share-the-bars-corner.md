# 044 - The Controls Share the Bar's Right Corner

## Context

[`036`](036-the-window-does-not-fade-and-the-gear-moves.md) put the gear at the window's bottom-left corner so the bar kept only the window's three dots, and [`041`](041-the-pages-have-no-close-button.md) then removed the bar's last control: nothing has stood in the right corner since.

That left the page's one control alone on the paper, far from the bar's own controls, and the web's search beside the name instead of beside it. The operator asked for one row: settings at the bar's right, the search at its left, and one margin around both.

## Decision

- The bar's right corner is the page's. The gear stands there on both surfaces; on the web the Search control stands immediately to its left.
- The margin is 5 px above the controls, 5 px between them and 5 px from the bar's right edge: the bar is 44 px and a control is 34, so the vertical gap is 5, and the other two are the same number.
- The gear is drawn on the log and on the search, where it opens the settings page as ⌘, does. On the settings page it leaves and keeps its space, so the control beside it does not move.
- The writing fade covers the bar's controls as it covered the gear at the corner; the app's name on the web, and the window's dots on the desktop, keep full strength.
- Nothing else moves: the status line stays at the bottom centre and the assistant panel above it.

## Consequences

- [`036`](036-the-window-does-not-fade-and-the-gear-moves.md)'s "The gear stands at the window's bottom-left corner, on the paper, wherever the log is reachable" falls, and with it that ADR's "The gear sits over the page, so it needs the paper's colour behind it": the gear draws no chip of its own.
- [`041`](041-the-pages-have-no-close-button.md)'s "The bar's right corner carries nothing: Esc leaves the search and the settings page" falls for the corner and stands for the way out: the gear opens a page, it does not close one.
- [`041`](041-the-pages-have-no-close-button.md)'s "The gear stays off the search page and off the settings page" falls for the search, which draws the gear in its corner, and stands for the settings page, where the gear leaves and keeps its space.
- [`029`](029-the-bar-carries-only-the-pages-controls.md)'s "the bar's right corner belongs to the page below it" is now literal: the page's controls are drawn there.
- [`043`](043-the-web-is-the-desktops-page.md)'s "The gear stands at the window's bottom-left corner on the log only" falls: the gear stands in the bar's corner, on the log and on the search.
- The desktop's bar carries one control and the web's two; both occupy the same corner, at the same 5 px, so the two surfaces match where they can and differ by the search a phone needs.
- The gear leaves the settings page as it did, and the space it held stays, so a press aimed at the search while the page closes lands where it was aimed.
