import { describe, expect, test } from "bun:test";

import { noteRanges } from "../src/shared/markdown.js";

// The characters a form draws away, and the text it styles, with the selection
// a caret of the given position would make.
function hides(body, caret) {
  return noteRanges(body, caret, caret)
    .filter((range) => range.style === null)
    .map((range) => body.slice(range.from, range.to));
}

function styles(body, caret) {
  return noteRanges(body, caret, caret)
    .filter((range) => range.style !== null)
    .map((range) => [body.slice(range.from, range.to), range.style]);
}

describe("the note's five forms", () => {
  test("hide a tight pair's marks while the caret is outside it", () => {
    const body = "a **bold** b";
    expect(hides(body, 0)).toEqual(["**", "**"]);
    expect(styles(body, 0)).toEqual([["bold", "strong"]]);
  });

  test("show the marks while the caret is inside the pair", () => {
    const body = "a **bold** b";
    expect(hides(body, 5)).toEqual([]);
    expect(hides(body, 3)).toEqual([]);
    expect(styles(body, 5)).toEqual([["bold", "strong"]]);
  });

  test("hide the marks while the caret is at either end of the pair", () => {
    const body = "a **bold** b";
    expect(hides(body, 2)).toEqual(["**", "**"]);
    expect(hides(body, 10)).toEqual(["**", "**"]);
  });

  test("keep a note drawn when its first character opens a pair", () => {
    const body = "**bold** at the start";
    expect(hides(body, 0)).toEqual(["**", "**"]);
  });

  test("render italic, struck and code as their own styles", () => {
    const body = "a *i* ~~s~~ `c`";
    expect(hides(body, 0)).toEqual(["*", "*", "~~", "~~", "`", "`"]);
    expect(styles(body, 0)).toEqual([
      ["i", "em"],
      ["s", "del"],
      ["c", "code"],
    ]);
  });

  test("leave the pairs it does not render literal", () => {
    const body = "_x_ and __y__ and ** z ** and *  w *";
    expect(hides(body, 0)).toEqual([]);
    expect(styles(body, 0)).toEqual([]);
  });

  test("leave a heading, a list, a quote, a link, an image and a table literal", () => {
    const body = [
      "# heading",
      "",
      "- item",
      "",
      "> quote",
      "",
      "[link](./day.md) and ![image](x.png)",
      "",
      "| a | b |",
      "",
      "\\*escaped\\*",
    ].join("\n");
    expect(hides(body, 0)).toEqual([]);
    expect(styles(body, 0)).toEqual([]);
  });

  test("keep a pair inside a pair literal", () => {
    const body = "x **a *b* c**";
    expect(hides(body, 0)).toEqual(["**", "**"]);
    expect(styles(body, 0)).toEqual([["a *b* c", "strong"]]);
  });

  test("render a form inside a pair it does not render", () => {
    const body = "_a *b* c_";
    expect(hides(body, 0)).toEqual(["*", "*"]);
    expect(styles(body, 0)).toEqual([["b", "em"]]);
  });
});

describe("a fenced block", () => {
  const body = "a\n```js\ncode\nmore\n```\nb";

  test("hides its fence lines and styles the code between them", () => {
    expect(hides(body, 0)).toEqual(["```js\n", "```\n"]);
    expect(styles(body, 0)).toEqual([
      ["code", "block"],
      ["more", "block"],
    ]);
  });

  test("shows its fence lines while the caret is inside the block", () => {
    expect(hides(body, 10)).toEqual([]);
    expect(styles(body, 10)).toEqual([
      ["code", "block"],
      ["more", "block"],
    ]);
  });

  test("hides the one line of a fence that never closes", () => {
    const open = "a\n```\ncode";
    expect(hides(open, 0)).toEqual(["```\n"]);
    expect(styles(open, 0)).toEqual([["code", "block"]]);
  });

  test("hides a fence line that ends the note", () => {
    const last = "a\n```\ncode\n```";
    expect(hides(last, 0)).toEqual(["```\n", "```"]);
  });

  test("takes no form from inside it", () => {
    const inner = "a\n```\n**bold**\n```";
    expect(styles(inner, 0)).toEqual([["**bold**", "block"]]);
    expect(hides(inner, 0)).toEqual(["```\n", "```"]);
  });
});
