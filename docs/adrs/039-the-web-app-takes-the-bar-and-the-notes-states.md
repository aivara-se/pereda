# 039 - The Web App Takes the Bar and the Note's States

## Context

[`034`](034-the-two-surfaces-share-libraries.md) gave the two surfaces one day, one store, one note editor and one theme, and [`035`](035-the-web-app-is-a-static-sveltekit-site.md) made the second a static SvelteKit page. The page drew its own shell: Today, Search and Settings in the bar. Its notes kept the desktop's read-only rule but not the rest of its states — a selected note drew the webview's caret, an edited note never became read-only again, a note cleared to nothing stayed in the log until a reload, the page did not fade while a note was written, and a press on a button could blur the note and take the row away before the press ended.

[`032`](032-an-entrys-actions-belong-to-selection.md), [`036`](036-the-window-does-not-fade-and-the-gear-moves.md) and [`037`](037-a-selected-note-draws-no-caret.md) fixed those states on the desktop. The two surfaces read as two apps.

## Decision

- The web app's bar is the log's bar: the app's name at the left is the way home, Search stands at the right because the page has no ⌘F, the gear stands at the bottom-left corner on the log, and Today has no control.
- The gear is not drawn on the search or the settings page, as it is not on the desktop; the name is the way back.
- An older note is read-only until its edit button is pressed and draws no caret before that. Blur ends the edit: the text is saved first, then the note takes no keystroke and its actions return.
- A note cleared to nothing leaves the log after its save.
- The page's controls and the other entries fade to 0.25 while a note is written; the app's name stays at full strength, as the window's dots do.
- The action row arrives with the selection and keeps the pointer until its fade ends, so a press on one of its buttons lands.
- The web keeps its own routes, its browser store, its export, and no assistant and no window dots ([`033`](033-the-notes-have-a-second-surface-on-the-web.md), [`035`](035-the-web-app-is-a-static-sveltekit-site.md)).

## Consequences

- A change to a note's state is now a change to both surfaces: the library holds the text and the marks, and each page owes the same selected, edited and cleared behaviour.
- The gear is one more fixed surface over the page; the page's 45 vh tail keeps it off the last note.
- The fade is one `:has(.entry.open:focus-within)` rule, so every browser the page supports draws it, and a browser without `:has` draws no fade and nothing else changes.
- The name is a link on the web where the desktop has a back button; on a subpage the wordmark is the whole way home.
- The web's bar carries Search on every page, because the page has no ⌘F to open it; the desktop's bar carries only the back button.
