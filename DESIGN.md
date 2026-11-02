# Pereda: design

One window on the desktop, read at arm's length and written in a hurry. The page draws everything; the system draws the window's shadow. Behaviour belongs to [`PRODUCT.md`](PRODUCT.md) and the calls to [`SYSTEMS.md`](SYSTEMS.md); this document fixes what the person sees and the values that do not change.

## The window

- The bar is 44 px high and holds the window's controls at its left: three 26 px hit areas, each with an 11 px dot, 2 px apart.
- The page's controls sit at the right: 34 px hit areas, 2 px apart, with 19 px icons drawn at 1.6 stroke, except the gear at 14 px.
- One page fills the window under the bar: the log, the search, or the settings page. The page scrolls and the bar does not.
- Two surfaces sit outside the page flow: the status line at the bottom centre, and the assistant panel above it at the right.

## The column

- Every page is one column of `min(100% - 64px, 43rem)`, centred, and ends in 45 vh of empty paper. The log and the settings page start 30 px under the bar; the results 22 px.
- The column has two parts: a date or label column of 7.5 rem, right-aligned, and the text. The gap is 1.5 rem. The search field, the results and the settings page use the same grid, so a page change moves nothing sideways.
- A date sits 7 px down, so its 11 px capitals share a line with the note's first line. A result's date sits at 6 px.
- An entry leaves 48 px below its text; a result 26 px.
- The action row hangs 1 px under the date, against its right edge, outside the flow: three 24 px buttons, 13 px icons, 2 px apart.
- The settings page repeats the grid: a nav where the dates sit, a panel where the notes sit. An export's result line is 34 rem at most.

## The overlays

- The assistant panel is fixed at the right, 24 px from the edge and 56 px from the bottom. It is `min(28rem, 100% - 48px)` wide, 42 vh tall at most, 13 px 16 px 15 px inside, a 10 px radius, a 1 px border and a shadow that lifts it off the paper.
- The status line is fixed at the bottom centre, 20 px up, `min(90vw, 46rem)` wide at most, 12 px of type, in a 7 px rounded box on the paper's colour. It takes no pointer.
- Both use the paper's colour, not the window's translucent one: a surface that carries text does not show the desktop through it.

## Type

- Two faces. A serif, Newsreader, carries the note and everything that reads like one: the search field, a result's snippet, the settings rule, the empty state, the assistant's answer. A sans, Instrument Sans, carries the chrome and the labels: the bar, the dates, buttons, the status line.
- The note is 19 px at weight 450 with 1.65 line height. Reading text beside it is 17 px with 1.6. Chrome is 14 px. The status line and a result's line are 12 px. A label is 11 px, weight 500, uppercase, with 0.1 em tracking. The generated mark is 10 px at weight 600.
- A label is muted until its page or entry has focus, when it goes to ink.
- A mark in the note is styled, never replaced: italic, bold, struck, a code chip at 0.85 em on the hover wash, and a fenced block in the interface's mono face.

## Colour

- Light: paper `#faf9f6`, window `rgba(250, 249, 246, 0.8)`, ink `#26231f`, muted `#7d756a`, icon `#6a6155`, hover wash `rgba(38, 35, 31, 0.06)`, accent `#a9541c`, accent wash `#f0e0cf`, error `#a5342c`.
- Dark: paper `#121110`, window `rgba(18, 17, 16, 0.8)`, ink `#ece7dd`, muted `#958d80`, icon `#a79e90`, hover wash `rgba(236, 231, 221, 0.07)`, accent `#dda36c`, accent wash `#2a231b`, error `#e59a92`.
- Ink is the text, the selected date and every control at its strongest. Muted is a date, a placeholder, a secondary line and a control that waits.
- The accent marks the caret, the text selection and the focus ring. The error red marks a refusal or a failure, never decoration.
- The three window dots keep the traffic-light colours in both themes. They are the only decorative colour in the app.
- Nothing is signalled by colour alone. Selection also brings the row; a refusal is a sentence; a disabled control also refuses the pointer; a busy panel also says so.

## States

- **Selected.** The date goes to ink and, on an older entry, the row arrives. Nothing else changes.
- **Edited.** The note is writable, the caret is in the text, the bar and the other entries fall to 0.25.
- **Disabled.** A bar control at 0.28, a settings button at 0.5, and the default cursor.
- **Busy.** The assistant's text is muted in the place the answer will take.
- **Refused.** The error colour and the words that say why.
- **Focus.** A 2 px accent ring, 2 px to 4 px outside the control, drawn at once and never faded.

## Motion

- Three tokens, declared on `:root`. `--ease` is `cubic-bezier(0.2, 0, 0, 1)`; `--t-quick` is 120 ms for a control's own change; `--t-soft` is 200 ms for a surface that arrives or leaves.
- A surface arrives with opacity 0 to 1 and a 4 px rise. It leaves with opacity only. Nothing scales, slides or bounces.
- What moves: a page swap, the results list, the assistant panel, the status line, the action row, and the bar's page controls.
- What does not move: typing, the note's marks, the caret, the first paint, the scroll position, and the items of a list a query rebuilds.
- A page swap is a cross-fade in place. The bar keeps its height and its place; only its right corner changes, at 120 ms.
- Motion says nothing on its own. Every state it accompanies is also said in words or in a control's presence.
- `prefers-reduced-motion: reduce` sets both durations to zero and removes the rise. The app is then instant and loses nothing.

## The narrow window

- Below 620 px the column is one column of `min(100% - 40px, 43rem)`, 22 px under the bar.
- The date sits above its text and is left-aligned. The action row moves to the top of the date's line.
- An entry leaves 40 px below its text. The assistant panel spans 20 px from each edge.
