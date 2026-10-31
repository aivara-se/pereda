# 015 - Keys, and Nothing to Configure

## Context

The app has one window, a log and, from v1.2, a search field. Every action is the mouse: Today is a button, an older day is a scroll, search is a click into a field. The global hotkey ([011](011-one-shortcut-summons-the-window.md)) puts the window in front; nothing puts the caret where the person wants it.

A palette, a shortcut sheet or a rebinding screen is a surface with state behind it, and the app has no preferences ([011](011-one-shortcut-summons-the-window.md), [012](012-the-assistant-runs-on-this-machine.md)). This record adds none.

## Decision

Four fixed keys, handled in the page, with no surface and no setting:

- **⌘F** / **Ctrl+F** focuses the search field and selects what is in it.
- **Esc** in the field clears it and returns the log to today; anywhere else it does nothing.
- **⌘↑** / **Ctrl+↑** moves to the day above in the log, **⌘↓** / **Ctrl+↓** to the day below; focus and the caret go to the end of that note. Scrolling is unchanged.
- **⌘T** / **Ctrl+T** takes the Today path — the same call as the button, including the flush before it.

The page cancels each key's default so the webview does not also act on it. The combinations are fixed in this version; a different one is a new record, not a preference.

## Consequences

- On macOS the webview maps ⌘↑ and ⌘↓ to the start and end of the note, and this takes them: from here the day is the unit, not the document. A person who used those to jump inside a long note loses that and keeps Home and End where the keyboard has them.
- Nothing is discoverable. The keys are learned from the changelog and from the Today button's tooltip; someone who never learns them loses nothing, because every key has a control already.
- ⌘↑/⌘↓ move focus between notes and never edit one; there is no key that changes a note's text.
- No state, no validation, no collision handling: a key the system will not give up is a key that does nothing, and the mouse still works.
