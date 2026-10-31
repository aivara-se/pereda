# 017 - An Accepted Line Becomes the Note's Text

## Context

[012](012-the-assistant-runs-on-this-machine.md) gives the assistant one action — summarise the note on screen — and decides that the reply is marked, read-only and never written into `notes`. The product's promise is narrower and has two halves: "every word it produces is marked until the writer accepts it". Only the first half has a mechanism, so the assistant can be read and not used.

The product also names the second request — "or suggest a next line" — and that is the one a person would want to keep. The risk sits in the opposite direction: a model writing into a note without an act, or a mark that survives acceptance and leaves the note with two authors. [012](012-the-assistant-runs-on-this-machine.md) leaves suggested lines out because an insertion design was missing; this record is that design.

## Decision

- The assistant gains a second request, **Suggest a line**: the note on screen and nothing else, asking for one or two sentences that continue it.
- A summary has no accept action; it is about the note. A suggestion has one: **Add to the note**.
- Acceptance appends the candidate to the end of the note as a new paragraph of plain text, through the same ordered, whole-body save as typing ([003](003-sqlite-is-the-store.md)), with the page's counter and the same failure path.
- Before the click the text exists only in the panel. There is no streaming into the editor, no auto-insert and no accept-on-close.
- The mark is panel state, not a note field: once accepted, the paragraph is the note's own text and nothing records where it came from.
- One paragraph, the whole text, at the end: no insertion at the caret, no replacement of a selection, no diff.
- Where there is no assistant there is no panel and no action ([012](012-the-assistant-runs-on-this-machine.md)).

## Consequences

- The app writes model text into a note for the first time, and only through an action the person took. "Never unmarked and unaccepted" holds by construction, because unaccepted text is never in the note.
- After acceptance a reader cannot tell which paragraph came from a model. That is the product's rule rather than an oversight, and it means a screenshot of a note says nothing about authorship; the ADR records that rather than pretending a mark survives.
- There is no undo beyond editing: a paragraph accepted by mistake is deleted like any other text, because inventing an undo stack here would be a second write path.
- The assistant stays macOS-only, so this version widens the gap between the platforms instead of closing it.
- Questions across the log, and insertion where the caret is, still need a retrieval and an insertion design that this record does not make.
