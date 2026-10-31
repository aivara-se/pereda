// The page: one log of days, newest first, every entry saved as it is typed.

import { SHORTCUT_ID, shortcutNotice } from '../shared/shortcut.js';
import { ASSISTANT_EVENT } from '../shared/assistant.js';
import { DATA_FOLDER_EVENT } from '../shared/menu.js';
import { keyAction } from '../shared/keys.js';
import { writingNotice } from '../shared/midnight.js';

const DEBOUNCE = 300;
const SEARCH_DEBOUNCE = 200;
const LOAD_AT = 700; // pixels from the bottom that ask for the next page
const OS = tiny.system.os();

const $ = (id) => document.getElementById(id);
const logEl = $('log');
const resultsEl = $('results');
const pageEl = $('page');
const searchBar = $('searchbar');
const searchButton = $('search');
const queryEl = $('query');
const settingsEl = $('settingspage');
const settingsButton = $('settings');
const exportButton = $('export');
const exportResult = $('export-result');
const statusLine = $('status');
const assistantPanel = $('assistant');
const assistantText = $('assistant-text');

let todayKey = null; // the backend's idea of today, refreshed on every load
let entries = []; // the days on screen, newest first
let more = false; // is there a page before the oldest day loaded?
let loading = false;
let loadToken = 0; // the newest load, so a slow one cannot win
let focused = null; // the entry with the caret, and the one the keys move from
let logError = '';
let searchError = '';
let shortcutMissing = ''; // said once when the system would not give the combination
let searchOpen = false; // the log is replaced by the field and the results
let searchToken = 0; // the newest search, so a slow one cannot win
let searchTimer = 0;
let settingsOpen = false; // the settings page is over the log
let settingsScroll = 0; // the log's scroll when the page opened
let exporting = false; // one export at a time
let assistantBusy = false; // one summary at a time
let commandError = ''; // a menu action that could not finish
let commandSelectable = false; // the data folder's path is text to copy
let jumpNotice = ''; // a date landed on an empty day
let midnight = null; // the loaded day is behind the backend's today
const saveFailures = new Map(); // day -> the last reason its save failed

function dayDate(day) {
  const [year, month, date] = day.split('-').map(Number);
  return new Date(year, month - 1, date);
}

function shortDate(day) {
  return dayDate(day).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function longDate(day) {
  return dayDate(day).toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

// A day and a month for the midnight line; the year appears only when the two
// days are in different years.
function noticeDate(day, today) {
  return dayDate(day).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'long',
    ...(day.slice(0, 4) === today.slice(0, 4) ? {} : { year: 'numeric' }),
  });
}

function renderStatus() {
  const failure = saveFailures.values().next().value;
  const problem = failure ? `Not saved — ${failure}` : commandError || logError || searchError;
  const behind =
    midnight === null
      ? ''
      : writingNotice(midnight.day, midnight.today, (day) => noticeDate(day, midnight.today));
  // A notice is said once: a real problem replaces it and it does not come back.
  if (problem !== '') shortcutMissing = '';
  statusLine.textContent = problem || behind || jumpNotice || shortcutMissing;
  statusLine.classList.toggle(
    'info',
    problem === '' && (behind !== '' || jumpNotice !== '' || shortcutMissing !== ''),
  );
  statusLine.classList.toggle(
    'selectable',
    commandSelectable && problem !== '' && problem === commandError,
  );
}

function resize(entry) {
  entry.text.style.height = 'auto';
  entry.text.style.height = `${entry.text.scrollHeight}px`;
}

function setCaretToEnd(text) {
  text.setSelectionRange(text.value.length, text.value.length);
}

// ⌘↑ and ⌘↓ make the day the unit: the day above is newer, the day below is
// older, and the caret lands at the end of the note reached.
function moveDay(delta) {
  if (searchOpen || settingsOpen || entries.length === 0) return;
  const index = focused === null ? 0 : entries.indexOf(focused);
  const from = index === -1 ? 0 : index;
  const target = entries[Math.min(entries.length - 1, Math.max(0, from + delta))];
  if (target === undefined) return;
  target.text.focus();
  setCaretToEnd(target.text);
}

function hideAssistant() {
  assistantPanel.hidden = true;
  assistantPanel.classList.remove('busy');
  assistantText.textContent = '';
}

function showAssistant(text, busy) {
  assistantText.textContent = text;
  assistantPanel.classList.toggle('busy', busy);
  assistantPanel.hidden = false;
}

// The note on screen is the one the caret is in; with none, the first entry.
// The reply is marked in the panel and never touches the textarea.
async function summariseFocused() {
  if (assistantBusy) return;
  const entry = searchOpen || settingsOpen ? null : (focused ?? entries[0] ?? null);
  if (entry === null) {
    commandError = 'Open a day to summarise it.';
    commandSelectable = false;
    renderStatus();
    return;
  }
  if (entry.text.value.trim() === '') {
    commandError = 'There is nothing to summarise.';
    commandSelectable = false;
    renderStatus();
    return;
  }

  assistantBusy = true;
  commandError = '';
  commandSelectable = false;
  showAssistant('Summarising…', true);
  renderStatus();
  try {
    const { text } = await tiny.api.call('summariseNote', { body: entry.text.value });
    showAssistant(text, false);
  } catch (message) {
    hideAssistant();
    commandError = message;
    commandSelectable = false;
  } finally {
    assistantBusy = false;
    renderStatus();
  }
}

// The only state the fade has is the caret: today's note, and only while the
// window holds focus. A summary or a status message never fades with it.
function updateFade() {
  const writing =
    !searchOpen &&
    !settingsOpen &&
    document.hasFocus() &&
    focused !== null &&
    focused.day === todayKey &&
    document.activeElement === focused.text;
  document.body.classList.toggle('writing', writing);
}

async function run(entry) {
  while (entry.pending !== null && entry.pending !== entry.savedBody) {
    const body = entry.pending;
    const stamp = entry.seq + 1;
    entry.pending = null;
    let saved;
    try {
      saved = await tiny.api.call('saveDay', { day: entry.day, body, seq: stamp });
    } catch (message) {
      saveFailures.set(entry.day, message);
      renderStatus();
      return false;
    }
    entry.seq = stamp;
    entry.savedBody = body;
    saveFailures.delete(entry.day);
    // The reply says which day was written and which day the backend is on.
    // Only the save's own reply can raise this line; nothing polls.
    midnight = saved.today > saved.day ? { day: saved.day, today: saved.today } : null;
    renderStatus();
  }
  return true;
}

// One save in flight per entry; a newer body replaces the one waiting. The
// promise clears the runner in a microtask, so a run that ends before it is
// assigned still releases the next save.
function flushEntry(entry) {
  clearTimeout(entry.timer);
  entry.pending = entry.text.value;
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
  return Promise.all(entries.map(flushEntry)).then((results) => results.every(Boolean));
}

function maybeDrop(entry) {
  if (entry.day === todayKey) return;
  if (entry.text.value !== '') return;
  dropEntry(entry);
}

function dropEntry(entry) {
  const index = entries.indexOf(entry);
  if (index === -1) return;
  entries.splice(index, 1);
  entry.article.remove();
  if (focused === entry) {
    focused = entries[index] ?? entries[index - 1] ?? null;
    if (focused !== null) focused.text.focus();
    updateFade();
  }
}

function makeEntry(day, body, seq) {
  const article = document.createElement('article');
  article.className = 'entry';
  if (day === todayKey) article.classList.add('today');

  const meta = document.createElement('div');
  meta.className = 'meta';

  const label = document.createElement('p');
  label.className = 'date';
  label.textContent = day === todayKey ? 'Today' : shortDate(day);
  meta.append(label);

  const text = document.createElement('textarea');
  text.className = 'note';
  text.value = body;
  text.rows = 1;
  text.spellcheck = true;
  text.placeholder = 'What happened?';
  text.setAttribute('aria-label', `Note for ${longDate(day)}`);

  const entry = {
    day,
    seq,
    savedBody: body,
    pending: null,
    runner: null,
    timer: 0,
    article,
    text,
  };

  // Delete belongs to the note it removes, under its date. Today's note has no
  // row: clearing its last character is how it goes.
  if (day !== todayKey) {
    const action = document.createElement('button');
    action.type = 'button';
    action.className = 'action';
    action.title = 'Delete this note';
    action.setAttribute('aria-label', `Delete the note for ${longDate(day)}`);
    action.innerHTML =
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14"/><path d="M10 7V5h4v2"/><path d="M7 7l1 12h8l1-12"/></svg>';
    action.addEventListener('click', () => removeEntry(entry));
    meta.append(action);
  }

  text.addEventListener('input', () => {
    resize(entry);
    entry.pending = text.value;
    clearTimeout(entry.timer);
    entry.timer = setTimeout(() => flushEntry(entry), DEBOUNCE);
  });
  text.addEventListener('focus', () => {
    focused = entry;
    updateFade();
  });
  text.addEventListener('blur', () => {
    updateFade();
    flushEntry(entry).then((ok) => {
      if (ok) maybeDrop(entry);
    });
  });

  article.append(meta, text);
  return entry;
}

function renderLog(days, hasMore) {
  logEl.replaceChildren();
  entries = days.map((entry) => makeEntry(entry.day, entry.body, entry.seq));
  for (const entry of entries) {
    logEl.append(entry.article);
    resize(entry);
  }
  more = hasMore;
}

// Load the first page again: today at the top, older days after it, or the log
// from a day when a search result asked for it.
async function loadLog(from) {
  const token = ++loadToken;
  searchToken += 1; // a load ends any search still on its way
  let result;
  try {
    result = await tiny.api.call('openLog', from === undefined ? undefined : { from });
  } catch (message) {
    fatal(message);
    return;
  }
  if (token !== loadToken) return;
  todayKey = result.today;
  commandError = '';
  commandSelectable = false;
  jumpNotice = '';
  midnight = null;
  hideAssistant();
  showLog(); // first: an entry measured while the log is hidden has no height
  renderLog(result.days, result.more);
  focused = entries[0] ?? null;
  if (focused !== null) {
    focused.text.focus();
    setCaretToEnd(focused.text);
  }
  pageEl.scrollTop = 0;
  logError = '';
  searchError = '';
  updateFade();
  renderStatus();
}

// Ask for the days before the oldest one on screen.
async function loadOlder() {
  if (!more || loading || searchOpen || settingsOpen || entries.length === 0) return;
  loading = true;
  const token = loadToken;
  try {
    const result = await tiny.api.call('openLog', { before: entries[entries.length - 1].day });
    if (token !== loadToken) return;
    for (const day of result.days) {
      const entry = makeEntry(day.day, day.body, day.seq);
      logEl.append(entry.article);
      entries.push(entry);
      resize(entry);
    }
    more = result.more;
    logError = '';
  } catch (message) {
    logError = `Could not load older days — ${message}`;
  } finally {
    loading = false;
    renderStatus();
  }
}

// The search leaves the screen without deciding where the log is: the log, the
// settings page and a jump all come back to it.
function hideSearch() {
  searchOpen = false;
  searchToken += 1;
  clearTimeout(searchTimer);
  queryEl.value = '';
  searchBar.hidden = true;
  resultsEl.hidden = true;
  resultsEl.replaceChildren();
  searchButton.setAttribute('aria-expanded', 'false');
  searchButton.setAttribute('aria-label', 'Search');
  searchButton.title = OS === 'macos' ? 'Search (⌘F)' : 'Search (Ctrl+F)';
}

// Settings is over the loaded log, never a reload of it.
function hideSettings() {
  settingsOpen = false;
  settingsEl.hidden = true;
  settingsButton.setAttribute('aria-pressed', 'false');
  pageEl.hidden = false;
  exportResult.textContent = '';
  exportResult.classList.remove('error');
}

// The log is the default view: no field, no settings and no results.
function showLog() {
  hideSearch();
  hideSettings();
  logEl.hidden = false;
  updateFade();
}

function showResults() {
  logEl.hidden = true;
  resultsEl.hidden = false;
}

// The results area is empty until the first character.
function hideResults() {
  resultsEl.replaceChildren();
  resultsEl.hidden = true;
}

// Search is a mode opened from the bar: the field takes the caret and the log
// leaves the screen until the mode is closed.
function openSearch() {
  if (!searchOpen) {
    hideSearch();
    hideSettings();
    searchOpen = true;
    hideAssistant();
    searchBar.hidden = false;
    logEl.hidden = true;
    searchButton.setAttribute('aria-expanded', 'true');
    searchButton.setAttribute('aria-label', 'Close search');
    searchButton.title = 'Close search';
    hideResults();
    pageEl.scrollTop = 0;
    renderStatus();
  }
  queryEl.focus();
  queryEl.select();
  updateFade();
}

// Settings replaces the log or the search below the bar. The log stays loaded,
// so closing returns to the day and scroll it held and gives the note its caret
// back. It is not stored: the app always opens on today.
function openSettings() {
  if (settingsOpen) {
    closeSettings();
    return;
  }
  hideSearch();
  hideAssistant();
  settingsScroll = pageEl.scrollTop;
  settingsOpen = true;
  pageEl.hidden = true;
  settingsEl.hidden = false;
  settingsButton.setAttribute('aria-pressed', 'true');
  exportResult.textContent = '';
  exportResult.classList.remove('error');
  updateFade();
  renderStatus();
  flushAll();
}

function closeSettings() {
  if (!settingsOpen) return;
  showLog();
  if (focused !== null) focused.text.focus();
  pageEl.scrollTop = settingsScroll;
  renderStatus();
}

function renderResults(days) {
  resultsEl.replaceChildren();
  if (days.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'empty';
    empty.textContent = 'No note says that.';
    resultsEl.append(empty);
    return;
  }
  for (const { day, snippet } of days) {
    const result = document.createElement('button');
    result.type = 'button';
    result.className = 'result';

    const date = document.createElement('span');
    date.className = 'date';
    date.textContent = day === todayKey ? 'Today' : shortDate(day);

    const text = document.createElement('span');
    text.className = 'snippet';
    text.textContent = snippet;

    result.append(date, text);
    result.addEventListener('click', () => openDay(day));
    resultsEl.append(result);
  }
}

// A result opens the log at its day, so the note found can be read and written.
async function openDay(day) {
  if (!(await flushAll())) return;
  queryEl.value = '';
  await loadLog(day);
}

// A date is answered with the page of the log at that day. An empty day is
// not in the log, so the newest day before it is shown and the status says why.
function showJump({ day, days, more: hasMore }) {
  commandError = '';
  commandSelectable = false;
  logError = '';
  searchError = '';
  clearTimeout(searchTimer);
  queryEl.value = '';
  showLog();
  hideAssistant();
  renderLog(days, hasMore);
  focused = entries[0] ?? null;
  if (focused !== null) {
    focused.text.focus();
    setCaretToEnd(focused.text);
  }
  pageEl.scrollTop = 0;
  if (days.length === 0) {
    jumpNotice = `No note on or before ${shortDate(day)}.`;
  } else if (days[0].day !== day) {
    jumpNotice = `No note on ${shortDate(day)} — showing ${shortDate(days[0].day)}.`;
  } else {
    jumpNotice = '';
  }
  updateFade();
  renderStatus();
}

// The search mode: every word must be in a note, as a prefix, in any order, and
// a text search never reaches today. An exact date opens its day before that
// rule. An empty field stays open.
async function search(query) {
  if (!searchOpen) return;
  if (query.trim() === '') {
    searchToken += 1;
    searchError = '';
    jumpNotice = '';
    hideResults();
    renderStatus();
    return;
  }
  const token = ++searchToken;
  if (!(await flushAll())) return;
  let result;
  try {
    result = await tiny.api.call('searchNotes', { query });
  } catch (message) {
    if (token !== searchToken) return;
    searchError = `Could not search — ${message}`;
    resultsEl.replaceChildren();
    showResults();
    renderStatus();
    return;
  }
  if (token !== searchToken) return;
  searchError = '';
  commandError = '';
  commandSelectable = false;
  if (result.refused !== undefined) {
    // A date after today: say so and leave the log where it is.
    searchError = result.refused;
    renderStatus();
    return;
  }
  if (result.jump !== undefined) {
    showJump(result.jump);
    return;
  }
  jumpNotice = '';
  renderResults(result.days);
  showResults();
  pageEl.scrollTop = 0;
  renderStatus();
}

async function goToday() {
  if (!(await flushAll())) return;
  queryEl.value = '';
  await loadLog();
}

// Leaving the search empties the field and puts the log back at today. A save
// that cannot finish keeps the mode open, because the text has not landed yet.
async function closeSearch() {
  clearTimeout(searchTimer);
  searchToken += 1;
  if (!(await flushAll())) return;
  queryEl.value = '';
  await loadLog();
}

// An older day's delete: one question, the day named, and no undo. Today has
// no button; clearing its last character is how it goes.
async function removeEntry(target) {
  const sure = await tiny.dialog.confirm(`Delete the note for ${shortDate(target.day)}?`, {
    detail: 'The text is gone for good. There is no undo.',
    ok: 'Delete',
    cancel: 'Keep',
  });
  if (!sure) return;

  // The dialog's blur can start a save; let it settle, or the delete and that
  // save would carry one counter and one of them would lose.
  if (!(await flushEntry(target))) return;

  clearTimeout(target.timer);
  target.pending = null;
  const stamp = target.seq + 1;
  try {
    await tiny.api.call('saveDay', { day: target.day, body: '', seq: stamp });
  } catch (message) {
    saveFailures.set(target.day, message);
    renderStatus();
    return;
  }
  target.seq = stamp;
  target.savedBody = '';
  target.text.value = '';
  saveFailures.delete(target.day);
  midnight = null;
  renderStatus();
  dropEntry(target);
}

// Export is one-way: the folder is chosen every time, every loaded note is
// flushed first, and the backend writes the files. A failure names the first day
// that did not write; the files before it stay.
async function runExport() {
  if (exporting) return;
  exporting = true;
  exportButton.disabled = true;
  exportResult.textContent = '';
  exportResult.classList.remove('error');
  try {
    if (!(await flushAll())) {
      exportResult.textContent = 'Not exported — a note could not be saved.';
      exportResult.classList.add('error');
      return;
    }
    const folder = await tiny.dialog.pickFolder();
    if (folder === null) return;
    exportResult.textContent = 'Exporting…';
    const result = await tiny.api.call('exportNotes', { folder });
    if (result.failed !== null) {
      const count = result.written === 1 ? '1 note' : `${result.written} notes`;
      exportResult.textContent = `Wrote ${count} to ${result.folder} before ${result.failed.day} failed — ${result.failed.reason}`;
      exportResult.classList.add('error');
      return;
    }
    if (result.written === 0) {
      exportResult.textContent = 'There are no notes to export.';
      return;
    }
    const count = result.written === 1 ? '1 note' : `${result.written} notes`;
    exportResult.textContent = `Wrote ${count} to ${result.folder}.`;
  } catch (message) {
    exportResult.textContent = `Could not export — ${message}`;
    exportResult.classList.add('error');
  } finally {
    exporting = false;
    exportButton.disabled = false;
  }
}

function fatal(message) {
  hideAssistant();
  $('app').hidden = true;
  $('fatal-message').textContent = message;
  $('fatal').hidden = false;
}

$('today').addEventListener('click', goToday);
$('today').title = OS === 'macos' ? 'Today (⌘T)' : 'Today (Ctrl+T)';
settingsButton.addEventListener('click', openSettings);
searchButton.addEventListener('click', () => (searchOpen ? closeSearch() : openSearch()));
exportButton.addEventListener('click', runExport);

// The backend registers the shortcut at launch and brings the window forward on
// a press; the press reaches this page too, and it takes the Today path.
tiny.hotkey.on((id) => {
  if (id === SHORTCUT_ID) goToday();
});

// A menu click that needs the note on screen comes back as this event. The
// menu itself is the backend's; the page only owns the reply panel.
tiny.api.on(ASSISTANT_EVENT, summariseFocused);
$('assistant-close').addEventListener('click', hideAssistant);

// Show data folder: the backend opened it, or it could not and sent the path
// back. The path is the fallback the person can copy.
tiny.api.on(DATA_FOLDER_EVENT, ({ path, error }) => {
  if (error === null) {
    commandError = '';
    commandSelectable = false;
    renderStatus();
    return;
  }
  commandError =
    path === ''
      ? `Could not open the data folder — ${error}`
      : `Could not open ${path} — ${error}`;
  commandSelectable = true;
  renderStatus();
});

queryEl.addEventListener('input', () => {
  clearTimeout(searchTimer);
  if (queryEl.value.trim() === '') {
    search('');
    return;
  }
  searchTimer = setTimeout(() => search(queryEl.value), SEARCH_DEBOUNCE);
});

// The four fixed keys. Escape acts only in the field; the others cancel the
// webview's own meaning before taking the app's path. Nothing is configurable.
document.addEventListener('keydown', (event) => {
  const action = keyAction(event, OS);
  if (action === null) return;

  if (action === 'escape') {
    if (settingsOpen) {
      event.preventDefault();
      closeSettings();
      return;
    }
    if (!searchOpen || document.activeElement !== queryEl) return;
    event.preventDefault();
    closeSearch();
    return;
  }

  event.preventDefault();
  if (action === 'search') {
    openSearch();
    return;
  }
  if (action === 'today') {
    goToday();
    return;
  }
  moveDay(action === 'previous' ? -1 : 1);
});

// The window has no frame, so its controls live in the page. A close waits for
// the saves in flight, then quits; a failed save is already on the status line.
$('close').addEventListener('click', async () => {
  await flushAll();
  tiny.win.close();
});
$('minimize').addEventListener('click', () => tiny.win.minimize());
$('zoom').addEventListener('click', () => tiny.win.zoom());
pageEl.addEventListener(
  'scroll',
  () => {
    if (pageEl.scrollTop + pageEl.clientHeight >= pageEl.scrollHeight - LOAD_AT) {
      loadOlder();
    }
  },
  { passive: true },
);
window.addEventListener('resize', () => entries.forEach(resize));
document.addEventListener('visibilitychange', () => {
  if (document.hidden) flushAll();
});
window.addEventListener('blur', () => {
  flushAll();
  updateFade();
});
window.addEventListener('focus', updateFade);

// One ask says whether the system gave the app its shortcut; a missing one is
// said once in the status line, and everything else works without it.
tiny.api.call('readShortcut').then(({ registered }) => {
  shortcutMissing = shortcutNotice(tiny.system.os(), registered);
  renderStatus();
});

loadLog();
