# 030 - The Note Renders Its Markdown

## Context

[`024`](024-export-writes-markdown.md) writes the note's body verbatim as a Markdown file, so every other program reads the note as Markdown today. The screen is the one place that shows the markers instead.

The note has been a textarea: one string, saved whole, with the caret, selection, undo and IME that the system webview gives free ([`001`](001-a-desktop-app-on-tinyjs.md)). [`027`](027-older-notes-are-read-only-until-edited.md) decides which notes take a keystroke.

A note that renders where it is typed is the ask. A preview pane and a second mode are not.

A prototype put a text editor over the string — CodeMirror 6 with `@lezer/markdown`, bundled to 104 KB gzipped — and held in Chromium and WebKit. A document model with a serializer was rejected: it puts a lossy step in the one path the app promises, where a whole body is written as it is typed.

## Decision

- The body stays the source: the store, the save path, the export and the full-text index keep the same characters, and the page parses them for display only. There is no document model and no serializer.
- Five forms render: `*italic*`, `**bold**`, `~~struck~~`, `` `code` `` and a fenced block opened by three backticks or tildes, with an optional info string and a closing fence. An inline marker must touch its text.
- Everything else stays literal: `_italic_`, headings, list markers, quotes, links, images, tables, HTML, escapes and nesting. A fence takes no syntax highlight.
- A marker is hidden while the selection is outside its element and shown while the selection is inside it, so the person can always change it by hand. The lines of a fence are hidden while the caret is outside the block.
- Every loaded note is one editor over its string, and a read-only note takes no keystroke. The caret, the selection, undo and IME are a text field's, and the markers stay in the string so they act on the stored text.
- The page is bundled before packaging, so the release keeps its one command and no built file is committed.

## Consequences

- [`001`](001-a-desktop-app-on-tinyjs.md) and [`009`](009-continue-with-tinyjs.md)'s "no framework and no bundler" fall. A bundler is a build dependency of the page; the source stays plain HTML, CSS and JavaScript.
- [`024`](024-export-writes-markdown.md)'s "Markdown is never read back" narrows to what it protects: no text enters from a file, and the store stays the only authority. The display now parses the body.
- The product's "plain text with paragraphs: no title, formatting" and "Not rich text" fall.
- A note written before this renders where a marker pair is already tight. Its bytes do not change, and there is no migration and no flag.
- The build gains 104 KB gzipped on the 8.24 MB `.app` that [`009`](009-continue-with-tinyjs.md) measured.
- Caret, selection, undo and IME are the editor's now. The release's hand check gains the note's rendering on three webviews.
- The search index keeps reading the raw body, and a result still shows the text around the match with its markers.
