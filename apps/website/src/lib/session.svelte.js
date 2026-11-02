// What the app knows about its own store, and the line it says when it cannot
// keep notes: a browser without the origin-private file system keeps nothing
// (docs/adrs/033-the-notes-have-a-second-surface-on-the-web.md).

import { call } from "#lib/client.js";

export const session = $state({
  status: "opening",
  error: "",
  today: "",
});

let opening = null;

export function openStore() {
  if (opening === null) opening = start();
  return opening;
}

async function start() {
  try {
    // The browser may still evict what it was not asked to keep; asking is the
    // most a page can do, and eviction stays an unhandled case of its own.
    try {
      await navigator.storage?.persist?.();
    } catch {}
    const answer = await call("open");
    session.today = answer.today;
    session.status = "ready";
  } catch (error) {
    session.error = error.message;
    session.status = "failed";
  }
}
