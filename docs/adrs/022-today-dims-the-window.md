# 022 - The Today Note Dims the Window

## Context

The window draws its bar, the search row, the log and the status at one strength; the note being written is one element among them. The app opens on today with the caret in the note, and writing today is its main act. The chrome around it — the bar's controls, search ([021](021-search-is-a-mode.md)), older entries and their dates — sits at the same contrast as the words.

Hiding them would remove reach and move the note as the layout changed; the app has one window and no full-screen mode.

## Decision

- While today's note has focus, the bar and everything else in the log — today's date, every older entry — are drawn at opacity 0.25. The note's text is the only thing at full strength.
- The status line and the assistant panel do not fade. One carries the app's report — a failed save, the midnight notice — and the other an answer the person asked for; both are read, not navigated.
- Blur restores the window at once. Nothing is hidden, moved or disabled, and nothing is stored: the fade follows focus.
- 0.25 is fixed, with a 150 ms transition so the change does not blink. No setting and no toggle.

## Consequences

- A dimmed control still takes a click: opacity is paint, not input. The click blurs the note, the window returns to full strength, and the control acts once.
- The app opens with the caret in today's note, so the first frame is already faded; the bar sits at a quarter strength until the person clicks elsewhere.
- At a quarter strength the bar and older entries are hard to read, which is the point. The cost is that a control wanted while writing has to be looked for, or the note left first.
- Only today fades. An older note keeps the full window, so the app has two focus states: writing today is immersive, editing the log is not.
- The status line stays readable, because the product promises a failed save is shown; the fade must not hide the one message that outranks it.
