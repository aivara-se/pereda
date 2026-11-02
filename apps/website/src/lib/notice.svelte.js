// The status line: one sentence at the bottom of the page, said and then
// replaced. A refusal is in the error colour and says why.

export const notice = $state({ text: "", failed: false });

let timer = null;

export function say(text, failed = false) {
  clearTimeout(timer);
  notice.text = text;
  notice.failed = failed;
  // A refusal stays until something replaces it; a report fades.
  if (!failed) timer = setTimeout(hush, 6000);
}

export function hush() {
  clearTimeout(timer);
  notice.text = "";
  notice.failed = false;
}
