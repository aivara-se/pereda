// A surface arrives from `enter` and leaves from `leave`, and `hidden` is the
// state it takes when its fade ends — so every show and hide goes through these
// two. The duration is the stylesheet's, which is what makes Reduce Motion
// instant on the same code path. This is the desktop's page model
// (docs/adrs/043-the-web-is-the-desktops-page.md).

const leaving = new Map(); // a surface on its way out -> its frame and its landing
let painted = false; // the first paint has no entrance

// The first frame draws everything as it is; only a change after it fades.
export function startPainting() {
  painted = true;
}

export function show(node) {
  const out = leaving.get(node);
  if (out !== undefined) {
    clearTimeout(out.frame);
    leaving.delete(node);
  }
  node.classList.remove("leave");
  if (!node.hidden) return;
  node.hidden = false;
  if (!painted) return;
  node.classList.add("enter");
  void node.offsetWidth; // the frame the surface arrives from
  node.classList.remove("enter");
}

export function hide(node, after) {
  if (node.hidden || leaving.has(node)) return;
  // A surface that leaves takes no pointer and holds no focus from its first
  // frame, so a press or a Tab during a swap reaches the page that arrives.
  if (node.contains(document.activeElement)) document.activeElement.blur();
  node.classList.remove("enter");
  const ms = painted ? fade(node) : 0;
  if (ms === 0) {
    node.hidden = true;
    node.classList.remove("leave");
    if (after !== undefined) after();
    return;
  }
  node.classList.add("leave");
  leaving.set(node, {
    after,
    frame: setTimeout(() => {
      node.hidden = true;
      node.classList.remove("leave");
      leaving.delete(node);
      if (after !== undefined) after();
    }, ms),
  });
}

// How long this surface's own fade runs, read from the one declaration in the
// stylesheet: a node with no transition answers zero and changes at once.
function fade(node) {
  return parseFloat(getComputedStyle(node).transitionDuration) * 1000;
}
