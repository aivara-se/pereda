// The page: one log of days, newest first, every entry saved as it is typed.

const DEBOUNCE = 300;
const LOAD_AT = 700; // pixels from the bottom that ask for the next page

const $ = (id) => document.getElementById(id);
const logEl = $('log');
const pageEl = $('page');
const statusLine = $('status');
const deleteButton = $('delete');

let todayKey = null; // the backend's idea of today, refreshed on every load
let entries = []; // the days on screen, newest first
let more = false; // is there a page before the oldest day loaded?
let loading = false;
let loadToken = 0; // the newest load, so a slow one cannot win
let focused = null; // the entry the delete button acts on
let logError = '';
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

function renderStatus() {
  const failure = saveFailures.values().next().value;
  if (failure) {
    statusLine.textContent = `Not saved — ${failure}`;
    return;
  }
  statusLine.textContent = logError;
}

function resize(entry) {
  entry.text.style.height = 'auto';
  entry.text.style.height = `${entry.text.scrollHeight}px`;
}

function setCaretToEnd(text) {
  text.setSelectionRange(text.value.length, text.value.length);
}

function updateDelete() {
  deleteButton.hidden = focused === null || focused.text.value === '';
}

async function run(entry) {
  while (entry.pending !== null && entry.pending !== entry.savedBody) {
    const body = entry.pending;
    const stamp = entry.seq + 1;
    entry.pending = null;
    try {
      await tiny.api.call('saveDay', { day: entry.day, body, seq: stamp });
    } catch (message) {
      saveFailures.set(entry.day, message);
      renderStatus();
      return false;
    }
    entry.seq = stamp;
    entry.savedBody = body;
    saveFailures.delete(entry.day);
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
    updateDelete();
  }
}

function makeEntry(day, body, seq) {
  const article = document.createElement('article');
  article.className = 'entry';
  if (day === todayKey) article.classList.add('today');

  const label = document.createElement('p');
  label.className = 'date';
  label.textContent = day === todayKey ? 'Today' : shortDate(day);

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

  text.addEventListener('input', () => {
    resize(entry);
    entry.pending = text.value;
    clearTimeout(entry.timer);
    entry.timer = setTimeout(() => flushEntry(entry), DEBOUNCE);
    updateDelete();
  });
  text.addEventListener('focus', () => {
    focused = entry;
    updateDelete();
  });
  text.addEventListener('blur', () => {
    flushEntry(entry).then((ok) => {
      if (ok) maybeDrop(entry);
    });
  });

  article.append(label, text);
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

// Load the first page again: today at the top, older days after it.
async function loadLog() {
  const token = ++loadToken;
  let result;
  try {
    result = await tiny.api.call('openLog');
  } catch (message) {
    fatal(message);
    return;
  }
  if (token !== loadToken) return;
  todayKey = result.today;
  renderLog(result.days, result.more);
  focused = entries[0] ?? null;
  if (focused !== null) {
    focused.text.focus();
    setCaretToEnd(focused.text);
  }
  pageEl.scrollTop = 0;
  logError = '';
  updateDelete();
  renderStatus();
}

// Ask for the days before the oldest one on screen.
async function loadOlder() {
  if (!more || loading || entries.length === 0) return;
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

async function goToday() {
  if (!(await flushAll())) return;
  await loadLog();
}

async function removeFocused() {
  const target = focused;
  if (target === null) return;
  const sure = await tiny.dialog.confirm(
    target.day === todayKey ? "Delete today's note?" : `Delete the note for ${shortDate(target.day)}?`,
    {
      detail: 'The text is gone for good. There is no undo.',
      ok: 'Delete',
      cancel: 'Keep',
    },
  );
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
  renderStatus();

  if (target.day === todayKey) {
    resize(target);
    target.text.focus();
    setCaretToEnd(target.text);
    updateDelete();
  } else {
    dropEntry(target);
  }
}

function fatal(message) {
  $('app').hidden = true;
  $('fatal-message').textContent = message;
  $('fatal').hidden = false;
}

$('today').addEventListener('click', goToday);
$('delete').addEventListener('click', removeFocused);
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
window.addEventListener('blur', () => flushAll());

loadLog();
