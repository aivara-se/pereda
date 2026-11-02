# 031 - The Window Moves in One Language

## Context

The page changes without a transition: a page is swapped by the `hidden` attribute, and the action row, the assistant panel and the status line appear and leave in one frame.

The two movements that exist disagree. The window dots scale over 120 ms; the writing fade takes 150 ms ([`022`](022-today-dims-the-window.md)). The bar's corner changes its controls with no transition, and the controls are [`029`](029-the-bar-carries-only-the-pages-controls.md)'s.

A reading app with two speeds reads as two apps, and each new surface would otherwise bring its own timing.

## Decision

- One curve and two durations, declared once on `:root`: `--ease: cubic-bezier(0.2, 0, 0, 1)`, `--t-quick: 120ms` for a control's own change, `--t-soft: 200ms` for a surface that arrives or leaves.
- One entrance and one exit. A surface arrives by opacity 0 to 1 and a 4 px rise; it leaves by opacity 1 to 0 with no travel. Nothing scales, slides or bounces.
- The surfaces that use them: the search page, the settings page, the results list, the assistant panel, the status line, the action row, and the bar's page controls.
- A page change is a cross-fade in place. Both pages are mounted, the column does not move, and the page that leaves takes no pointer event and no focus from the moment its fade starts.
- A list that a query rebuilds is one surface. The results do not animate item by item, because every keystroke replaces them.
- The chrome does not move. The bar keeps its height, its position and its drag area across every swap; only its right corner cross-fades, at `--t-quick`.
- Text never animates. Typing, the note's marks and the caret change in one frame, and the first paint has no entrance.
- Motion carries no meaning. Every state is also said in words, in a control's presence, or in its colour.
- `prefers-reduced-motion: reduce` sets both durations to zero and removes the rise. Nothing is lost, because nothing is told by motion.
- The transitions are CSS on opacity and transform only: no animation library, no `@keyframes`, and no JavaScript timing beyond removing a surface when its fade ends.

## Consequences

- [`022`](022-today-dims-the-window.md)'s "150 ms transition" falls. The fade runs at `--t-soft` on `--ease`, and its reason — "so the change does not blink" — holds.
- [`020`](020-actions-under-the-date.md)'s "changes no entry's height" stands, and now also covers the row's arrival: a transform moves pixels, not layout.
- A surface that leaves stays in the document for one duration, so `hidden` alone no longer ends one. Each arriving surface owns a lifecycle: enter, leave, then `hidden`.
- The bar's corner changes with a fade, where the bar currently swaps it in one frame ([`029`](029-the-bar-carries-only-the-pages-controls.md)).
- Two pages are laid out at once for the length of a swap, and every surface that can leave needs its pointer and focus handled at the start of the fade, not at its end.
- The three webviews composite differently. A fade and a 4 px rise are checked by hand on each, because no test draws a frame.
