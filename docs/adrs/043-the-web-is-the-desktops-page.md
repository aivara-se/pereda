# 043 - The Web Is the Desktop's Page

## Context

[`039`](039-the-web-app-takes-the-bar-and-the-notes-states.md) took the desktop's bar and note states onto the web but kept the web's own frame: the log, the search and the settings page were three routes with three URLs, opened by the name, the Search control and the gear, and left with the browser's Back.

The desktop holds the same three screens as one page: the log is loaded once and never rebuilt, the search and the settings page are surfaces swapped over it, and Esc closes either from anywhere in it. Reading the web app therefore meant a different app: a navigation instead of a swap, a find bar where the search should be, and a scroll and a caret left behind.

The two surfaces share everything under the page already — the store, the calls, the editor, the theme. The page was the one thing still drawn twice.

## Decision

- One page. The log, the search and the settings page are mounted together, swapped with the one 4 px fade and the `hidden` state, and the log is never rebuilt under them.
- No URL names a mode. Opening the search or the settings page changes nothing in the address bar, and neither a history entry nor a page load is added. `/search/` and `/settings/` are gone; a path the app does not name boots the app through the static adapter's fallback, so an old link still lands on the log.
- The keys are the desktop's five, read by one library (`libs/keys`): ⌘F opens the search, ⌘, the settings page, Esc closes either, ⌘↑ and ⌘↓ move between days. Ctrl stands in for ⌘ off a Mac. ⌘T is the browser's and cannot be taken: the mark is its control instead.
- The bar carries the app's name at its left, where the desktop carries the window's three dots — the browser already draws the window's own — and Search at its right at every width, because a phone has no ⌘F. The name is the way home and the way out of either mode, which is the pointer's only way out.
- The gear stands at the window's bottom-left corner on the log only, as it does on the desktop.
- The status line, the empty log and the fatal screen are the desktop's sentences and the desktop's placement.

## Consequences

- [`039`](039-the-web-app-takes-the-bar-and-the-notes-states.md)'s "the web's bar carries Search on every page, because the page has no ⌘F" falls in its reason and stays in its result: the control stays at every width, and the key now exists where there is a keyboard.
- [`039`](039-the-web-app-takes-the-bar-and-the-notes-states.md)'s name as a link home stands, and is now the only pointer's way out of a mode: [`041`](041-the-pages-have-no-close-button.md) removed the desktop's back button, and the web never draws one.
- [`035`](035-the-web-app-is-a-static-sveltekit-site.md)'s "every route is prerendered" reads one route and a fallback; the deploy writes `404.html`, which GitHub Pages serves for a path it does not hold.
- A search can no longer be linked to or reloaded into; nothing is lost, because the notes are the device's and the log opens on today.
- The browser's Back leaves the app rather than a mode. Esc and the name leave a mode, and the page does not learn which was pressed.
- ⌘T still opens a tab, as it does everywhere. The mark is one control away from the same path.
- The two surfaces read one key map and draw one stylesheet's values, so a key or a measurement added to one is the other's.
