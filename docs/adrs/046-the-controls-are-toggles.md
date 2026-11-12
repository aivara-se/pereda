# 046 - The Controls Are Toggles

## Context

[`041`](041-the-pages-have-no-close-button.md) left Esc as the only way out of the search and the settings page, and [`043`](043-the-web-is-the-desktops-page.md) gave the web's name that job on the surface that has a pointer and often no key. [`044`](044-the-controls-share-the-bars-corner.md) and [`045`](045-the-search-has-a-control.md) then put the search and the gear in the bar, where the gear left the settings page and the search stayed.

That leaves the control of the page you are on doing nothing for it — the gear on the settings page, the search in the search — while the page's way back is a key, and on the web a word at the far end of the bar. The operator asked that each control take the person back to the log, that the gear not leave its page, and that the web stop drawing the name.

## Decision

- Both controls stay drawn on every page. The one whose page is open is marked, and a second press on it closes that page.
- The search's control closes the mode at today, as Esc does, emptying the field. The gear closes the settings page to the day, scroll and caret it left, as Esc does.
- The web draws no name. Its bar carries the two controls and nothing at its left, which is what the desktop's has beside the window's dots.
- The keys are unchanged: ⌘F opens the search, ⌘, the settings page, Esc closes either, ⌘T and ⌘↑/⌘↓ do what they did.

## Consequences

- [`041`](041-the-pages-have-no-close-button.md)'s "Esc is the way out of the search, which it closes at today, and of the settings page, which it closes to the log it left" reads Esc and the control of the page you are on.
- [`043`](043-the-web-is-the-desktops-page.md)'s "The name is the way home and the way out of either mode, which is the pointer's only way out" falls, and the bar has no left-hand control on either surface.
- [`044`](044-the-controls-share-the-bars-corner.md)'s "On the settings page it leaves and keeps its space, so the control beside it does not move" falls: the gear stays, marked, and the search beside it does not move.
- [`045`](045-the-search-has-a-control.md)'s "A press while the mode is open brings the caret back" reads "closes the mode"; the control is a toggle, and the mark is what says so.
- The settings page has a pointer's way out on the desktop for the first time since [`041`](041-the-pages-have-no-close-button.md), which closed that door when it took the cross away.
- A phone reaches the log from either mode by the control that opened it, and the bar is one row of two icons at the right.
- The two surfaces now draw the same bar apart from the window's three dots.
