# 023 - Settings Is a Page in the Window

## Context

The app has one window, and its bar holds what acts on the whole window: close, minimize and zoom at the left, Today and the search mode at the right ([021](021-search-is-a-mode.md)). A readable export is the first flow that is neither a day nor a search: it has a destination and a result, not a bar action, so it needs a page. A menu is not that page on every platform, because Windows draws no menu bar on a frameless, transparent window ([018](018-the-menu-is-where-the-runtime-draws-one.md)).

A second window or a modal would be another surface to close and explain. A page in the same window keeps the bar, the status line and the log loaded behind it.

## Decision

- Settings is a page in the same window, not a second window or a modal. It replaces the log or the search below the bar; the bar stays.
- The bar's right side reads Today, settings, search, left to right; a gear opens and closes the page. It shows a pressed state while the page is open and does not become a close icon.
- The page is two columns on the log's grid: a fixed 7.5 rem left nav of text links, and a wider content area whose first line sits where a note's text sits.
- The nav is a list of sections; **Export Data** is the first and only one in this version. A later section appends a link and a panel, not another surface.
- Opening the page flushes the note as it loses focus, ends a search, dismisses the assistant panel and leaves the log loaded. Closing returns to the log at the day and scroll it held; a note that had the caret gets it back.
- Esc closes the page; Today and search leave it for their own destinations. Nothing is stored: the app opens on today, never on settings.

## Consequences

- The bar gains one more control and the magnifier moves one place right. [021](021-search-is-a-mode.md)'s "The slot delete left holds one magnifier button" falls; its mode, key and close behaviour stand.
- Esc gains a second context. [015](015-keys-and-nothing-to-configure.md)'s "anywhere else it does nothing" narrows to anywhere but the search field and settings; the key count is unchanged.
- Settings closes where it opened, while search closes to today. Two close rules are two things to learn; the detour keeps a place, a search is a new destination.
- A nav with one item is a surface larger than its content. That is the price of a home for the export and the next setting, and the page promises settings the app may never have.
- The left column is fixed at 7.5 rem, so a long section name wraps; the content column narrows in a small window rather than the layout collapsing.
- The page is reachable on all three platforms without a menu; the File menu's gap for the data folder ([018](018-the-menu-is-where-the-runtime-draws-one.md)) is untouched.
