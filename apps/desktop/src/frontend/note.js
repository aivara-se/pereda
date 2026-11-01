// One note on screen: the Markdown source the store holds, with its five forms
// drawn where they stand. The text is never rewritten — a mark is drawn away and
// drawn back, so the caret, the selection and undo act on the stored characters.

import { Compartment, EditorState, StateField } from "@codemirror/state";
import { Decoration, EditorView, keymap, placeholder } from "@codemirror/view";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";

import { noteRanges } from "../shared/markdown.js";

// Which marks hide is the selection's answer, not the text's, so the set is
// rebuilt when the text changes and when the selection moves — and at no other
// time, which is what keeps a log of thirty notes cheap to hold.
const markers = StateField.define({
  create: (state) => marks(state),
  update: (value, change) =>
    change.docChanged || change.selection ? marks(change.state) : value,
  provide: (field) => EditorView.decorations.from(field),
});

// The ranges the page draws differently, read from the note and the selection.
function marks(state) {
  const body = state.doc.toString();
  const { from, to } = state.selection.main;
  return Decoration.set(noteRanges(body, from, to).map(draw), true);
}

// A form's text takes its style; a mark is replaced by nothing, and a whole
// line by a block, so the text below closes up where the fence was.
function draw(range) {
  if (range.style !== null) {
    return Decoration.mark({ class: `md-${range.style}` }).range(
      range.from,
      range.to,
    );
  }
  return Decoration.replace({ block: range.block === true }).range(
    range.from,
    range.to,
  );
}

// One editor over one note. `readOnly` keeps the caret and the selection but
// takes the keystrokes; the page flips it when an older note's edit is pressed.
// A text the page writes itself is not an edit, so it is not reported as one.
export function noteEditor(
  parent,
  { body, readOnly, label, onEdit, onFocus, onBlur },
) {
  const writable = new Compartment();
  let quiet = false;

  const view = new EditorView({
    parent,
    state: EditorState.create({
      doc: body,
      extensions: [
        history(),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        EditorView.lineWrapping,
        placeholder("What happened?"),
        writable.of(EditorState.readOnly.of(readOnly)),
        EditorView.contentAttributes.of({
          "aria-label": label,
          spellcheck: "true",
        }),
        markers,
        EditorView.updateListener.of((change) => {
          if (change.docChanged && !quiet) onEdit();
        }),
      ],
    }),
  });

  view.contentDOM.addEventListener("focus", onFocus);
  view.contentDOM.addEventListener("blur", onBlur);

  return {
    body: () => view.state.doc.toString(),
    hasFocus: () => view.hasFocus,
    focus: () => view.focus(),
    // The caret at the end of the note, which is where an edit starts.
    focusEnd() {
      view.focus();
      view.dispatch({
        selection: { anchor: view.state.doc.length },
        scrollIntoView: true,
      });
    },
    setEditable(editable) {
      view.dispatch({
        effects: writable.reconfigure(EditorState.readOnly.of(!editable)),
      });
    },
    setBody(text) {
      quiet = true;
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: text },
      });
      quiet = false;
    },
  };
}
