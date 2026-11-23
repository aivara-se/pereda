/**
 * A surface arrives from `enter` and leaves from `leave`, and `hidden` is the
 * state it takes when its fade ends — so every show and hide goes through these
 * two. The duration is the stylesheet's, which is what makes Reduce Motion
 * instant on the same code path. This is the desktop's page model
 * (docs/adrs/043-the-web-is-the-desktops-page.md).
 */

const leaving = new Map();
let painted = false;

/** The first frame draws everything as it is; only a change after it fades. */
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
  void node.offsetWidth;
  node.classList.remove("enter");
}

export function hide(node, after) {
  if (node.hidden || leaving.has(node)) return;
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

/** How long a surface's own fade runs, read from the stylesheet. */
function fade(node) {
  return parseFloat(getComputedStyle(node).transitionDuration) * 1000;
}
