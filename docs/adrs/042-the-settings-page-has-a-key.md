# 042 - The Settings Page Has a Key

## Context

[`015`](015-keys-and-nothing-to-configure.md) fixed four keys and made them the whole of the app's keyboard: ⌘F into the search, Esc out of it and out of settings, ⌘T to today, ⌘↑ and ⌘↓ between days. The settings page was opened by the gear alone, which is the pointer's control, and [`041`](041-the-pages-have-no-close-button.md) left it closed by Esc alone.

That makes settings the one place the hands have to leave the keyboard to reach and come back from: ⌘, is what macOS apps put their preferences on, and the hand is already on the modifier for the other keys.

## Decision

- ⌘, opens the settings page, and Ctrl+, does on Windows and Linux, as Ctrl stands in for ⌘ in the other four keys.
- It works from the log, from the search and from the assistant's panel, and it takes the same path the gear takes: the search ends, the assistant is dismissed, the log stays loaded and the page opens where it opened.
- It does nothing while the settings page is open. There is no toggle.
- It is fixed like the rest: no menu item, no setting, no rebinding screen.

## Consequences

- [`015`](015-keys-and-nothing-to-configure.md)'s "Four fixed keys" reads five; its list stands for the other four, and its "nothing to configure" holds for this one too.
- The gear stays the pointer's way in and the key is the keyboard's: neither replaces the other, and the page does not learn which one opened it.
- The page still leaves by Esc alone ([`041`](041-the-pages-have-no-close-button.md)), so the key opens a page that a key closes.
- The app declares no menu of its own beyond File, so nothing on macOS claims ⌘, before the page sees it.
