# 037 - A Selected Note Draws No Caret, and Its Actions Outlive a Press

## Context

[`032`](032-an-entrys-actions-belong-to-selection.md) made focus the selection and a press anywhere on an entry the act that gives it. A read-only note still draws the webview's caret while its content has focus, so a press that only selected an entry looked like an edit already in progress.

The action row took `pointer-events: none` on the first frame of its fade, although its keys were to leave when the fade ended ([`020`](020-actions-under-the-date.md)). A press on a button blurs the note. On a webview that does not focus a pressed button, the row lost the pointer in that same frame, the press ended on the page beneath, and none of the three actions fired.

## Decision

- An older note draws no caret until its edit button is pressed. Selection keeps the focus, the text selection and the mark drawing; only the caret is absent.
- Edit puts the caret at the end and draws it; blur ends the edit and takes it away again.
- The action row keeps the pointer until its fade ends. `visibility` carries both the fade and the hit test; `pointer-events` is not switched at the start.
- The row still arrives only with the selection ([`032`](032-an-entrys-actions-belong-to-selection.md)): a pointer that passes over an entry changes nothing.

## Consequences

- [`031`](031-the-window-moves-in-one-language.md)'s "a page that leaves takes no pointer event ... from the moment its fade starts" does not apply to the action row. Its own rule — it takes its keys back when the fade ends — is the one that holds, and a press in flight lands.
- The selected state looks as it did: the date goes to ink and the row arrives. The absent caret is the only difference, and it is what the read-only promise already said ([`027`](027-older-notes-are-read-only-until-edited.md)).
- All three actions work on a webview that blurs the note on mousedown as well as on one that focuses the button.
- Nothing is stored and the state gains no member: blur still ends the edit and the row.
