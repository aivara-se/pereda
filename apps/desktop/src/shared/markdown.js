// The note's five forms, read from its Markdown source. The source is what the
// store holds, so nothing here changes a character: it says which ranges the
// page draws differently — a mark to hide, a text to style — and the page draws
// them.

import { parser, Strikethrough } from "@lezer/markdown";

const markdown = parser.configure([Strikethrough]);

// A form, the node that carries its delimiters, and the style its text takes.
const FORMS = {
  Emphasis: { mark: "EmphasisMark", style: "em" },
  StrongEmphasis: { mark: "EmphasisMark", style: "strong" },
  Strikethrough: { mark: "StrikethroughMark", style: "del" },
  InlineCode: { mark: "CodeMark", style: "code" },
};

// The delimiters the note renders. `_` is not one of them, so `_text_` and a
// tight `_pair_` stay as they were typed, and a mark is hidden only when its
// own first character is one of these.
const DELIMITERS = "*~`";

// Every range the page draws differently: `style` names a style, or is null for
// a mark that hides. `block` marks a hide that takes a whole line, which the
// page draws away as a line and not as text.
export function noteRanges(body, from, to) {
  const ranges = [];
  markdown.parse(body).iterate({
    enter(node) {
      if (node.name === "FencedCode") {
        return fence(ranges, body, node, from, to);
      }
      const form = FORMS[node.name];
      if (form === undefined) return;
      return formAt(ranges, body, node, form, from, to);
    },
  });
  return ranges;
}

// The selection is inside a form when it covers some of the form's own text: a
// caret at either end of it is outside, so a note drawn where it stands stays
// drawn until the person steps into it.
function inside(node, from, to) {
  return from < node.to && to > node.from;
}

// The children of a node that carry its delimiters, in the order they are read.
function marks(node, name) {
  const found = [];
  for (let child = node.node.firstChild; child; child = child.nextSibling) {
    if (child.name === name) found.push({ from: child.from, to: child.to });
  }
  return found;
}

// The start of the line a position is on, and the end of it without its new
// line: the pair a whole line is hidden by.
function lineAt(body, position) {
  const from = body.lastIndexOf("\n", position - 1) + 1;
  const next = body.indexOf("\n", position);
  return { from, to: next === -1 ? body.length : next };
}

// One inline pair: its text is styled whether or not its marks show, and the
// marks hide while the selection is outside it. A pair inside it stays literal,
// because the children are not read.
function formAt(ranges, body, node, form, from, to) {
  const pair = marks(node, form.mark);
  if (pair.length !== 2) return;
  if (!DELIMITERS.includes(body[pair[0].from])) return;

  const [open, close] = pair;
  if (close.from > open.to) {
    ranges.push({ from: open.to, to: close.from, style: form.style });
  }
  if (inside(node, from, to)) return false;
  ranges.push({ from: open.from, to: open.to, style: null });
  ranges.push({ from: close.from, to: close.to, style: null });
  return false;
}

// One fenced block: its code is drawn line by line as the block it is, and the
// two fence lines hide while the selection is outside the block. A fence that
// never closes has one line to hide.
function fence(ranges, body, node, from, to) {
  const fenceMarks = marks(node, "CodeMark");
  const open = lineAt(body, node.from);
  const close =
    fenceMarks.length > 1
      ? lineAt(body, fenceMarks[fenceMarks.length - 1].from)
      : null;
  const code = {
    from: Math.min(open.to + 1, body.length),
    to: close === null ? node.to : close.from,
  };
  for (const line of lines(body, code.from, code.to)) {
    if (line.to > line.from) {
      ranges.push({ from: line.from, to: line.to, style: "block" });
    }
  }
  if (inside(node, from, to)) return false;
  ranges.push(hiddenLine(open, body.length));
  if (close !== null) ranges.push(hiddenLine(close, body.length));
  return false;
}

// The lines of a range, so a block of code is drawn one line at a time: a style
// that began at the block's first character would stop at a blank line inside
// it, and the code after the blank line would be drawn as prose.
function lines(body, from, to) {
  const found = [];
  let start = from;
  while (start < to) {
    const next = body.indexOf("\n", start);
    const end = next === -1 || next > to ? to : next;
    found.push({ from: start, to: end });
    start = end + 1;
  }
  return found;
}

// A hide that takes the line and its new line, so the block closes up where the
// fence was instead of leaving an empty line behind.
function hiddenLine(line, end) {
  return {
    from: line.from,
    to: Math.min(line.to + 1, end),
    style: null,
    block: true,
  };
}
