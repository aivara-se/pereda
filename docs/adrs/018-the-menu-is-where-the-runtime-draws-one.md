# 018 - The Menu Is Where the Runtime Draws One

## Context

[014](014-the-data-folder-is-one-menu-item.md) decided one File menu item, **Show data folder**, so the backup is a copy the person can find instead of a path they have to be told. The menu is the app's and is built in the backend ([012](012-the-assistant-runs-on-this-machine.md)).

The window is frameless and transparent. The runtime does not draw a menu bar on such a window on Windows: "Windows never draws a menu bar on a frameless or transparent window" (`tinyjs`, `docs/window`, read 2026-10-31), and "On Windows, frameless and transparent windows can't show a menu bar" (`tinyjs`, `docs/menus`, read 2026-10-31). macOS draws one bar at the top of the screen, and Linux draws a copy inside the window, so the item is reachable on those two.

014 was written as though the item replaced the path on all three platforms, and v1.6 shipped with the item declared everywhere and the gap only in the pull request's body. Nothing in the repository said it, so a reader of the product and system documents still expects the folder to be one click away on Windows, where it is not.

## Decision

- One item, **Show data folder**, on the platforms that draw a menu bar for this window: macOS and Linux.
- Windows keeps what it had: the path the documentation gives. No item exists there and none is faked.
- The window stays frameless and transparent. A menu bar the person cannot see is not a reason to draw a title bar over the page's own bar.
- This narrows 014's first clause. Everything else in 014 stands: one item, the path from `app.paths()`, no copy, no export, no preference.

## Consequences

- The backup is executable on two of three platforms, and on Windows the data folder is still a path someone is told — what 014 set out to remove.
- A Windows person has no way to the folder from the app. Reaching it there needs a control in the page's own bar, beside close, minimize and zoom, which is a new surface: the next record decides it, not this one.
- The gap lives with the other edge cases in `PRODUCT.md`, so the product document stops promising a menu that Windows never draws; `SYSTEMS.md` says which platforms draw the bar.
- Nothing changes about what the app writes, and no platform gains or loses the item it had in v1.6.
