/**
 * The page: one log of days, newest first, every entry saved as it is typed.
 */

import { SHORTCUT_ID, shortcutNotice } from "../shared/shortcut.js";
import { DATA_FOLDER_EVENT } from "../shared/menu.js";
import { keyAction } from "@pereda/keys/keys.js";
import { writingNotice } from "@pereda/notes/midnight.js";
import { noteEditor } from "@pereda/note-editor";

const DEBOUNCE = 300;
const SEARCH_DEBOUNCE = 200;
const LOAD_AT = 700;
const OS = tiny.system.os();

const EDIT_ICON =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4Z"/><path d="m13.5 6.5 4 4"/></svg>';
const SUMMARISE_ICON =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4l1.6 4.4L18 10l-4.4 1.6L12 16l-1.6-4.4L6 10l4.4-1.6Z"/><path d="M18.5 15.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7Z"/></svg>';
const DELETE_ICON =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14"/><path d="M10 7V5h4v2"/><path d="M7 7l1 12h8l1-12"/></svg>';

const $ = (id) => document.getElementById(id);
const logEl = $("log");
const resultsEl = $("results");
const pageEl = $("page");
const searchPage = $("searchpage");
const queryEl = $("query");
const settingsEl = $("settingspage");
const settingsButton = $("settings");
const searchButton = $("search");
const exportButton = $("export");
const exportResult = $("export-result");
const statusLine = $("status");
const assistantPanel = $("assistant");
const assistantMark = $("assistant-mark");
const assistantText = $("assistant-text");

/**
 * The page's state: the day the backend last gave, the entries on screen, and
 * the mode, the saves and the notices that decide what is shown.
 */
let todayKey = null;
let entries = [];
let more = false;
let loading = false;
let loadToken = 0;
let focused = null;
let logError = "";
let searchError = "";
let shortcutMissing = "";
let searchOpen = false;
let searchToken = 0;
let searchTimer = 0;
let settingsOpen = false;
let settingsScroll = 0;
let settingsEditing = false;
let exporting = false;
let assistantBusy = false;
let commandError = "";
let commandSelectable = false;
let jumpNotice = "";
let midnight = null;
const saveFailures = new Map();

/**
 * A surface arrives from `enter` and leaves from `leave`, and `hidden` is the
 * state it takes when its fade ends — so every show and hide goes through these
 * two. The duration is the stylesheet's, which is what makes Reduce Motion
 * instant on the same code path.
 */
const leaving = new Map();
let painted = false;

function show(node) {
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

function hide(node, after) {
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

/** How long this surface's own fade runs, read from the stylesheet. */
function fade(node) {
  return parseFloat(getComputedStyle(node).transitionDuration) * 1000;
}

function dayDate(day) {
  const [year, month, date] = day.split("-").map(Number);
  return new Date(year, month - 1, date);
}

function shortDate(day) {
  return dayDate(day).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function longDate(day) {
  return dayDate(day).toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * A day and a month for the midnight line; the year appears only when the two
 * days are in different years.
 */
function noticeDate(day, today) {
  return dayDate(day).toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    ...(day.slice(0, 4) === today.slice(0, 4) ? {} : { year: "numeric" }),
  });
}

/**
 * The bar's right corner carries the page's two controls, both always drawn.
 * The one whose page is open is marked, and pressing it closes that page.
 */
function renderBar() {
  if (searchOpen) searchButton.setAttribute("aria-current", "page");
  else searchButton.removeAttribute("aria-current");
  if (settingsOpen) settingsButton.setAttribute("aria-current", "page");
  else settingsButton.removeAttribute("aria-current");
}

function renderStatus() {
  renderBar();
  const failure = saveFailures.values().next().value;
  const problem = failure
    ? `Not saved — ${failure}`
    : commandError || logError || searchError;
  const behind =
    midnight === null
      ? ""
      : writingNotice(midnight.day, midnight.today, (day) =>
          noticeDate(day, midnight.today),
        );
  if (problem !== "") shortcutMissing = "";
  const said = problem || behind || jumpNotice || shortcutMissing;
  statusLine.textContent = said;
  if (said === "") hide(statusLine);
  else show(statusLine);
  statusLine.classList.toggle(
    "info",
    problem === "" &&
      (behind !== "" || jumpNotice !== "" || shortcutMissing !== ""),
  );
  statusLine.classList.toggle(
    "selectable",
    commandSelectable && problem !== "" && problem === commandError,
  );
}

/**
 * An older note is read-only until its edit button asks for the caret: the text
 * becomes writable and the rest of the window fades as today's does. Today
 * starts in this state and never leaves it.
 */
function beginEditing(entry) {
  if (!entry.editing) {
    entry.editing = true;
    entry.note.setEditable(true);
    entry.article.classList.add("editing");
  }
  focused = entry;
  entry.note.focus();
  updateFade();
}

function startEditing(entry) {
  beginEditing(entry);
  entry.note.focusEnd();
}

/** Leaving the caret ends an older note's edit; today stays writable. */
function stopEditing(entry) {
  if (entry.day === todayKey) return;
  entry.editing = false;
  entry.note.setEditable(false);
  entry.article.classList.remove("editing");
}

/**
 * ⌘↑ and ⌘↓ make the day the unit: the day above is newer, the day below is
 * older, and the caret lands at the end of the note reached, which opens it for
 * writing.
 */
function moveDay(delta) {
  if (searchOpen || settingsOpen || entries.length === 0) return;
  const index = focused === null ? 0 : entries.indexOf(focused);
  const from = index === -1 ? 0 : index;
  const target =
    entries[Math.min(entries.length - 1, Math.max(0, from + delta))];
  if (target === undefined) return;
  startEditing(target);
}

function hideAssistant() {
  hide(assistantPanel);
  assistantPanel.classList.remove("busy", "error");
  assistantMark.textContent = "Generated on this Mac";
  assistantText.textContent = "";
}

/** A reply is marked as generated; a refusal is not a reply, so it says so. */
function showAssistant(text, { busy = false, error = false } = {}) {
  assistantMark.textContent = error ? "No summary" : "Generated on this Mac";
  assistantText.textContent = text;
  assistantPanel.classList.toggle("busy", busy);
  assistantPanel.classList.toggle("error", error);
  show(assistantPanel);
}

/**
 * The note whose button was pressed is the one read: its text is sent, and the
 * reply is marked in the panel and never touches the textarea.
 */
async function summarise(entry) {
  if (assistantBusy) {
    commandError = "The assistant is still answering the last note.";
    commandSelectable = false;
    showAssistant(commandError, { error: true });
    renderStatus();
    return;
  }
  if (entry.note.body().trim() === "") {
    commandError = "There is nothing to summarise.";
    commandSelectable = false;
    showAssistant(commandError, { error: true });
    renderStatus();
    return;
  }
  assistantBusy = true;
  commandError = "";
  commandSelectable = false;
  showAssistant("Summarising…", { busy: true });
  renderStatus();
  try {
    const { text } = await tiny.api.call("summariseNote", {
      body: entry.note.body(),
    });
    commandError = "";
    showAssistant(text);
  } catch (message) {
    const reason = message instanceof Error ? message.message : String(message);
    commandError = reason;
    commandSelectable = false;
    showAssistant(reason, { error: true });
  } finally {
    assistantBusy = false;
    renderStatus();
  }
}

/**
 * The only state the fade has is the caret in a writable note: today, or an
 * older note the edit button opened. A summary or a status message never fades
 * with it.
 */
function updateFade() {
  const writing =
    !searchOpen &&
    !settingsOpen &&
    document.hasFocus() &&
    focused !== null &&
    focused.editing &&
    focused.note.hasFocus();
  document.body.classList.toggle("writing", writing);
}

async function run(entry) {
  while (entry.pending !== null && entry.pending !== entry.savedBody) {
    const body = entry.pending;
    const stamp = entry.seq + 1;
    entry.pending = null;
    let saved;
    try {
      saved = await tiny.api.call("saveDay", {
        day: entry.day,
        body,
        seq: stamp,
      });
    } catch (message) {
      saveFailures.set(entry.day, message);
      renderStatus();
      return false;
    }
    entry.seq = stamp;
    entry.savedBody = body;
    saveFailures.delete(entry.day);
    midnight =
      saved.today > saved.day ? { day: saved.day, today: saved.today } : null;
    renderStatus();
  }
  return true;
}

/**
 * One save in flight per entry; a newer body replaces the one waiting. The
 * promise clears the runner in a microtask, so a run that ends before it is
 * assigned still releases the next save.
 */
function flushEntry(entry) {
  clearTimeout(entry.timer);
  entry.pending = entry.note.body();
  if (entry.runner === null) {
    entry.runner = run(entry).then(
      (ok) => {
        entry.runner = null;
        return ok;
      },
      (error) => {
        entry.runner = null;
        throw error;
      },
    );
  }
  return entry.runner;
}

function flushAll() {
  return Promise.all(entries.map(flushEntry)).then((results) =>
    results.every(Boolean),
  );
}

function maybeDrop(entry) {
  if (entry.day === todayKey) return;
  if (entry.note.body() !== "") return;
  dropEntry(entry);
}

function dropEntry(entry) {
  const index = entries.indexOf(entry);
  if (index === -1) return;
  entries.splice(index, 1);
  entry.article.remove();
  entry.note.destroy();
  if (focused === entry) {
    focused = entries[index] ?? entries[index - 1] ?? null;
    if (focused !== null) focused.note.focus();
    updateFade();
  }
}

function makeEntry(day, body, seq) {
  const article = document.createElement("article");
  article.className = "entry";
  const editable = day === todayKey;
  article.classList.toggle("today", editable);
  article.classList.toggle("editing", editable);
  const meta = document.createElement("div");
  meta.className = "meta";
  const label = document.createElement("p");
  label.className = "date";
  label.textContent = day === todayKey ? "Today" : shortDate(day);
  meta.append(label);
  const note = document.createElement("div");
  note.className = "note";
  const entry = {
    day,
    seq,
    savedBody: body,
    pending: null,
    runner: null,
    timer: 0,
    editing: editable,
    article,
    note: null,
  };
  if (editable) {
    meta.append(label);
  } else {
    const actions = document.createElement("div");
    actions.className = "actions";
    const action = (hint, name, icon) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "action";
      button.title = hint;
      button.setAttribute("aria-label", name);
      button.innerHTML = icon;
      actions.append(button);
      return button;
    };
    action(
      "Edit this note",
      `Edit the note for ${longDate(day)}`,
      EDIT_ICON,
    ).addEventListener("click", () => startEditing(entry));
    action(
      "Summarise this note",
      `Summarise the note for ${longDate(day)}`,
      SUMMARISE_ICON,
    ).addEventListener("click", () => summarise(entry));
    const remove = action(
      "Delete this note",
      `Delete the note for ${longDate(day)}`,
      DELETE_ICON,
    );
    remove.classList.add("remove");
    remove.addEventListener("click", () => removeEntry(entry));
    meta.append(label, actions);
  }
  entry.note = noteEditor(note, {
    body,
    readOnly: !editable,
    label: `Note for ${longDate(day)}`,
    onEdit: () => {
      entry.pending = entry.note.body();
      clearTimeout(entry.timer);
      entry.timer = setTimeout(() => flushEntry(entry), DEBOUNCE);
    },
    onFocus: () => {
      focused = entry;
      updateFade();
    },
    onBlur: () => {
      stopEditing(entry);
      updateFade();
      flushEntry(entry).then((ok) => {
        if (ok) maybeDrop(entry);
      });
    },
  });
  article.append(meta, note);
  article.addEventListener("mousedown", (event) => {
    if (event.target.closest(".note, .action") !== null) return;
    event.preventDefault();
    entry.note.focus();
  });
  return entry;
}

function renderLog(days, hasMore) {
  for (const entry of entries) entry.note.destroy();
  logEl.replaceChildren();
  entries = days.map((entry) => makeEntry(entry.day, entry.body, entry.seq));
  for (const entry of entries) {
    logEl.append(entry.article);
  }
  more = hasMore;
}

/**
 * Load the first page again: today at the top, older days after it, or the log
 * from a day when a search result asked for it.
 */
async function loadLog(from) {
  const token = ++loadToken;
  searchToken += 1;
  let result;
  try {
    result = await tiny.api.call(
      "openLog",
      from === undefined ? undefined : { from },
    );
  } catch (message) {
    fatal(message);
    return;
  }
  if (token !== loadToken) return;
  todayKey = result.today;
  commandError = "";
  commandSelectable = false;
  jumpNotice = "";
  midnight = null;
  hideAssistant();
  showLog();
  renderLog(result.days, result.more);
  focused = entries[0] ?? null;
  if (focused !== null && focused.editing) {
    focused.note.focusEnd();
  }
  pageEl.scrollTop = 0;
  logError = "";
  searchError = "";
  updateFade();
  renderStatus();
  painted = true;
}

async function loadOlder() {
  if (!more || loading || searchOpen || settingsOpen || entries.length === 0)
    return;
  loading = true;
  const token = loadToken;
  try {
    const result = await tiny.api.call("openLog", {
      before: entries[entries.length - 1].day,
    });
    if (token !== loadToken) return;
    for (const day of result.days) {
      const entry = makeEntry(day.day, day.body, day.seq);
      logEl.append(entry.article);
      entries.push(entry);
    }
    more = result.more;
    logError = "";
  } catch (message) {
    logError = `Could not load older days — ${message}`;
  } finally {
    loading = false;
    renderStatus();
  }
}

/**
 * The search leaves the screen without deciding where the log is: the log, the
 * settings page and a jump all come back to it.
 */
function hideSearch() {
  searchOpen = false;
  searchToken += 1;
  clearTimeout(searchTimer);
  queryEl.value = "";
  hide(searchPage);
  hideResults();
}

/** Settings is over the loaded log, never a reload of it. */
function hideSettings() {
  settingsOpen = false;
  hide(settingsEl);
  exportResult.textContent = "";
  exportResult.classList.remove("error");
}

/** The log is the default view: no field, no settings and no results. */
function showLog() {
  hideSearch();
  hideSettings();
  show(pageEl);
  updateFade();
}

function showResults() {
  show(resultsEl);
}

/** The results area is empty until the first character. */
function hideResults() {
  hide(resultsEl, () => {
    resultsEl.replaceChildren();
  });
}

/**
 * Search is a mode opened by ⌘F or the bar's search control: the field takes the
 * caret and the log leaves the screen until Esc or a second press closes it.
 */
function openSearch() {
  if (!searchOpen) {
    hideSearch();
    hideSettings();
    searchOpen = true;
    hideAssistant();
    show(searchPage);
    hide(pageEl);
    hideResults();
    renderStatus();
  }
  queryEl.focus();
  queryEl.select();
  updateFade();
}

/**
 * Settings replaces the log or the search below the bar. The log stays loaded,
 * so closing returns to the day and scroll it held and gives a note it was
 * writing its caret back. It is not stored: the app always opens on today.
 */
function openSettings() {
  hideSearch();
  hideAssistant();
  settingsScroll = pageEl.scrollTop;
  settingsOpen = true;
  hide(pageEl);
  show(settingsEl);
  exportResult.textContent = "";
  exportResult.classList.remove("error");
  updateFade();
  renderStatus();
  flushAll();
}

function closeSettings() {
  if (!settingsOpen) return;
  showLog();
  if (focused !== null) {
    if (settingsEditing) beginEditing(focused);
    else focused.note.focus();
  }
  settingsEditing = false;
  pageEl.scrollTop = settingsScroll;
  renderStatus();
}

function renderResults(days) {
  resultsEl.replaceChildren();
  if (days.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent = "No note says that.";
    resultsEl.append(empty);
    return;
  }
  for (const { day, snippet } of days) {
    const result = document.createElement("button");
    result.type = "button";
    result.className = "result";
    const date = document.createElement("span");
    date.className = "date";
    date.textContent = day === todayKey ? "Today" : shortDate(day);
    const text = document.createElement("span");
    text.className = "snippet";
    text.textContent = snippet;
    result.append(date, text);
    result.addEventListener("click", () => openDay(day));
    resultsEl.append(result);
  }
}

/** A result opens the log at its day, so the note found can be read and written. */
async function openDay(day) {
  if (!(await flushAll())) return;
  queryEl.value = "";
  await loadLog(day);
}

/**
 * A date is answered with the page of the log at that day. An empty day is not
 * in the log, so the newest day before it is shown and the status says why.
 */
function showJump({ day, days, more: hasMore }) {
  commandError = "";
  commandSelectable = false;
  logError = "";
  searchError = "";
  clearTimeout(searchTimer);
  queryEl.value = "";
  showLog();
  hideAssistant();
  renderLog(days, hasMore);
  focused = entries[0] ?? null;
  if (focused !== null && focused.editing) {
    focused.note.focusEnd();
  }
  pageEl.scrollTop = 0;
  if (days.length === 0) {
    jumpNotice = `No note on or before ${shortDate(day)}.`;
  } else if (days[0].day !== day) {
    jumpNotice = `No note on ${shortDate(day)} — showing ${shortDate(days[0].day)}.`;
  } else {
    jumpNotice = "";
  }
  updateFade();
  renderStatus();
}

/**
 * The search mode: every word must be in a note, as a prefix, in any order, and
 * a text search never reaches today. An exact date opens its day before that
 * rule. An empty field stays open.
 */
async function search(query) {
  if (!searchOpen) return;
  if (query.trim() === "") {
    searchToken += 1;
    searchError = "";
    jumpNotice = "";
    hideResults();
    renderStatus();
    return;
  }
  const token = ++searchToken;
  if (!(await flushAll())) return;
  let result;
  try {
    result = await tiny.api.call("searchNotes", { query });
  } catch (message) {
    if (token !== searchToken) return;
    searchError = `Could not search — ${message}`;
    resultsEl.replaceChildren();
    showResults();
    renderStatus();
    return;
  }
  if (token !== searchToken) return;
  searchError = "";
  commandError = "";
  commandSelectable = false;
  if (result.refused !== undefined) {
    searchError = result.refused;
    renderStatus();
    return;
  }
  if (result.jump !== undefined) {
    showJump(result.jump);
    return;
  }
  jumpNotice = "";
  renderResults(result.days);
  showResults();
  resultsEl.scrollTop = 0;
  renderStatus();
}

async function goToday() {
  if (!(await flushAll())) return;
  queryEl.value = "";
  await loadLog();
}

/**
 * Leaving the search empties the field and puts the log back at today. A save
 * that cannot finish keeps the mode open, because the text has not landed yet.
 */
async function closeSearch() {
  clearTimeout(searchTimer);
  searchToken += 1;
  if (!(await flushAll())) return;
  queryEl.value = "";
  await loadLog();
}

/**
 * Delete asks once on an older day and cannot be undone. Today has no delete:
 * clearing its last character is how the text goes.
 */
async function removeEntry(target) {
  const sure = await tiny.dialog.confirm(
    `Delete the note for ${shortDate(target.day)}?`,
    {
      detail: "The text is gone for good. There is no undo.",
      ok: "Delete",
      cancel: "Keep",
    },
  );
  if (!sure) return;
  if (!(await flushEntry(target))) return;
  clearTimeout(target.timer);
  target.pending = null;
  const stamp = target.seq + 1;
  try {
    await tiny.api.call("saveDay", { day: target.day, body: "", seq: stamp });
  } catch (message) {
    saveFailures.set(target.day, message);
    renderStatus();
    return;
  }
  target.seq = stamp;
  target.savedBody = "";
  target.note.setBody("");
  saveFailures.delete(target.day);
  midnight = null;
  renderStatus();
  dropEntry(target);
}

/**
 * Export is one-way: the folder is chosen every time, every loaded note is
 * flushed first, and the backend writes the files. A failure names the first day
 * that did not write; the files before it stay.
 */
async function runExport() {
  if (exporting) return;
  exporting = true;
  exportButton.disabled = true;
  exportResult.textContent = "";
  exportResult.classList.remove("error");
  try {
    if (!(await flushAll())) {
      exportResult.textContent = "Not exported — a note could not be saved.";
      exportResult.classList.add("error");
      return;
    }
    const folder = await tiny.dialog.pickFolder();
    if (folder === null) return;
    exportResult.textContent = "Exporting…";
    const result = await tiny.api.call("exportNotes", { folder });
    if (result.failed !== null) {
      const count = result.written === 1 ? "1 note" : `${result.written} notes`;
      exportResult.textContent = `Wrote ${count} to ${result.folder} before ${result.failed.day} failed — ${result.failed.reason}`;
      exportResult.classList.add("error");
      return;
    }
    if (result.written === 0) {
      exportResult.textContent = "There are no notes to export.";
      return;
    }
    const count = result.written === 1 ? "1 note" : `${result.written} notes`;
    exportResult.textContent = `Wrote ${count} to ${result.folder}.`;
  } catch (message) {
    exportResult.textContent = `Could not export — ${message}`;
    exportResult.classList.add("error");
  } finally {
    exporting = false;
    exportButton.disabled = false;
  }
}

function fatal(message) {
  hideAssistant();
  hide($("app"));
  $("fatal-message").textContent = message;
  show($("fatal"));
}

searchButton.addEventListener("click", () => {
  if (searchOpen) closeSearch();
  else openSearch();
});
settingsButton.addEventListener("mousedown", () => {
  if (!settingsOpen) settingsEditing = focused !== null && focused.editing;
});
settingsButton.addEventListener("click", () => {
  if (settingsOpen) closeSettings();
  else openSettings();
});
exportButton.addEventListener("click", runExport);
$("assistant-close").addEventListener("click", hideAssistant);

tiny.hotkey.on((id) => {
  if (id === SHORTCUT_ID) goToday();
});

tiny.api.on(DATA_FOLDER_EVENT, ({ path, error }) => {
  if (error === null) {
    commandError = "";
    commandSelectable = false;
    renderStatus();
    return;
  }
  commandError =
    path === ""
      ? `Could not open the data folder — ${error}`
      : `Could not open ${path} — ${error}`;
  commandSelectable = true;
  renderStatus();
});

queryEl.addEventListener("input", () => {
  clearTimeout(searchTimer);
  if (queryEl.value.trim() === "") {
    search("");
    return;
  }
  searchTimer = setTimeout(() => search(queryEl.value), SEARCH_DEBOUNCE);
});

document.addEventListener(
  "keydown",
  (event) => {
    const action = keyAction(event, OS);
    if (action === null) return;
    if (action === "escape") {
      if (settingsOpen) {
        event.preventDefault();
        closeSettings();
        return;
      }
      if (searchOpen) {
        event.preventDefault();
        closeSearch();
        return;
      }
      return;
    }
    event.preventDefault();
    if (action === "search") {
      openSearch();
      return;
    }
    if (action === "settings") {
      if (!settingsOpen) {
        settingsEditing = focused !== null && focused.editing;
        openSettings();
      }
      return;
    }
    if (action === "today") {
      goToday();
      return;
    }
    moveDay(action === "previous" ? -1 : 1);
  },
  true,
);

$("close").addEventListener("click", async () => {
  await flushAll();
  tiny.win.close();
});
$("minimize").addEventListener("click", () => tiny.win.minimize());
$("zoom").addEventListener("click", () => tiny.win.zoom());
pageEl.addEventListener(
  "scroll",
  () => {
    if (
      pageEl.scrollTop + pageEl.clientHeight >=
      pageEl.scrollHeight - LOAD_AT
    ) {
      loadOlder();
    }
  },
  { passive: true },
);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) flushAll();
});
window.addEventListener("blur", () => {
  flushAll();
  updateFade();
});
window.addEventListener("focus", updateFade);

tiny.api.call("readShortcut").then(({ registered }) => {
  shortcutMissing = shortcutNotice(tiny.system.os(), registered);
  renderStatus();
});

loadLog();
