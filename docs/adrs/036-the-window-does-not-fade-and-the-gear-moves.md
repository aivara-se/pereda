# 036 - The Window's Dots Do Not Fade, and the Gear Moves to the Corner

## Context

[`022`](022-today-dims-the-window.md) faded the whole bar while a note was written, so the three window dots sat at 0.25 whenever the caret was in today — which is the first frame — and while any older note was edited. They are the window's way out, and they are the one control that is always the same on every page.

[`029`](029-the-bar-carries-only-the-pages-controls.md) put Today and the gear in the bar's right corner. Today reloads the log, which ⌘T and the global shortcut already do, and it sat beside the control the person reaches for while reading. The corner therefore meant two different things.

## Decision

- The three window dots keep full strength in every state. The writing fade covers the page's controls and the entries, not the window.
- The log has no Today control. ⌘T and the global shortcut remain its ways to today.
- The gear stands at the window's bottom-left corner, on the paper, wherever the log is reachable. It leaves while the settings page is open.
- The bar's right corner carries one control: the back button, while the search or the settings page replaces the log.
- The writing fade keeps [`022`](022-today-dims-the-window.md)'s 0.25 and its transition for everything it still covers.

## Consequences

- [`022`](022-today-dims-the-window.md)'s "the bar ... at opacity 0.25" falls for the window's dots, and its "a control wanted while writing has to be looked for" no longer covers the way out: close, minimize and zoom stay legible in the first frame and through every edit.
- [`029`](029-the-bar-carries-only-the-pages-controls.md)'s corner rule falls: the bar carries neither Today nor the gear, and the gear no longer becomes a cross. The cross is the bar's one control while a page is open.
- Today is a key and a shortcut, not a control ([`015`](015-keys-and-nothing-to-configure.md), [`028`](028-the-search-has-no-control.md)); its path does not change.
- The gear sits over the page, so it needs the paper's colour behind it: the log scrolls under the corner.
- Settings still opens over the log and returns to the day, the scroll and the focus it left ([`023`](023-settings-is-a-page-in-the-window.md)).
