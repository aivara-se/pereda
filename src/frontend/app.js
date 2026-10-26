// The page: the calendar is the index, the note is the page's only state, and
// every character reaches the backend through one debounced, ordered save.

import { daysInMonth, firstWeekday, monthOf, nextMonth, previousMonth } from '../shared/day.js';

const DEBOUNCE = 300;

const $ = (id) => document.getElementById(id);
const note = $('note');
const statusLine = $('status');
const deleteButton = $('delete');
const monthLabel = $('month');
const dateLabel = $('date');
const dayGrid = $('days');

let todayKey = null; // the backend's idea of today, refreshed on every open
let openKey = null; // the day in the editor
let shownMonth = null; // the month the calendar draws
let marked = new Set(); // the days in shownMonth that have a note

let seq = 0; // the counter of the last save attempted
let savedBody = ''; // the body the backend has confirmed
let pending = null; // the newest body waiting to be sent
let runner = null; // the save in flight, if any
let timer = 0;
let loadToken = 0; // the newest open, so a slow one cannot win

function setStatus(text, kind) {
  statusLine.textContent = text;
  if (kind === undefined) delete statusLine.dataset.kind;
  else statusLine.dataset.kind = kind;
}

function count(n, word) {
  return `${n} ${word}${n === 1 ? '' : 's'}`;
}

function clock() {
  return new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

function dayDate(day) {
  const [year, month, date] = day.split('-').map(Number);
  return new Date(year, month - 1, date);
}

function labels() {
  const day = dayDate(openKey);
  dateLabel.textContent = day.toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const month = dayDate(`${shownMonth}-01`);
  monthLabel.textContent = month.toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });
}

// The calendar draws every day of the month, with the future disabled and a dot
// on each day that has a note.
function renderCalendar() {
  labels();
  const cells = [];
  for (let blank = 0; blank < firstWeekday(shownMonth); blank += 1) {
    cells.push(document.createElement('span'));
  }
  for (let date = 1; date <= daysInMonth(shownMonth); date += 1) {
    const day = `${shownMonth}-${String(date).padStart(2, '0')}`;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'day';
    button.textContent = String(date);
    button.dataset.day = day;
    button.setAttribute('aria-label', dayDate(day).toLocaleDateString(undefined, { dateStyle: 'full' }));
    if (marked.has(day)) button.classList.add('is-marked');
    if (day === todayKey) button.classList.add('is-today');
    if (day === openKey) button.classList.add('is-selected');
    if (day > todayKey) {
      button.classList.add('is-future');
      button.disabled = true;
    } else {
      button.addEventListener('click', () => load(day));
    }
    cells.push(button);
  }
  dayGrid.replaceChildren(...cells);
  $('next').disabled = shownMonth >= monthOf(todayKey);
}

async function loadMarks() {
  const result = await tiny.api.call('month', { month: shownMonth });
  marked = new Set(result.days);
}

// One save at a time: a newer body replaces the one waiting, and the whole body
// is sent every time.
async function run() {
  while (pending !== null && pending !== savedBody) {
    const body = pending;
    const stamp = seq + 1;
    pending = null;
    try {
      await tiny.api.call('saveDay', { day: openKey, body, seq: stamp });
    } catch (message) {
      setStatus(`Not saved — ${message}`, 'error');
      return false;
    }
    seq = stamp;
    savedBody = body;
    mark(openKey, body !== '');
    setStatus(`Saved ${clock()}`, 'saved');
  }
  return true;
}

// Send what is in the editor now, after a pause, a blur or before a day switch.
// The promise clears the runner in a microtask, so a runner that finishes before
// it is assigned still releases the next save.
function flush() {
  clearTimeout(timer);
  if (openKey === null) return Promise.resolve(true);
  pending = note.value;
  if (runner === null) {
    runner = run().then(
      (ok) => {
        runner = null;
        return ok;
      },
      (error) => {
        runner = null;
        throw error;
      },
    );
  }
  return runner;
}

function schedule() {
  pending = note.value;
  clearTimeout(timer);
  timer = setTimeout(flush, DEBOUNCE);
}

function mark(day, has) {
  if (monthOf(day) !== shownMonth) return;
  if (has) marked.add(day);
  else marked.delete(day);
  renderCalendar();
}

function fatal(message) {
  $('app').hidden = true;
  $('fatal-message').textContent = message;
  $('fatal').hidden = false;
}

// Open a day, or today when day is null. The flush comes first, so text never
// lands on the wrong date.
async function load(day) {
  const token = ++loadToken;
  if (!(await flush())) return;
  let opened;
  try {
    opened = await tiny.api.call('openDay', day === null ? {} : { day });
  } catch (message) {
    fatal(message);
    return;
  }
  if (token !== loadToken) return;
  openKey = opened.day;
  todayKey = opened.today;
  seq = opened.seq;
  savedBody = opened.body;
  pending = null;
  note.value = opened.body;
  note.disabled = false;
  deleteButton.hidden = opened.body === '';
  setStatus();
  if (monthOf(openKey) !== shownMonth) {
    shownMonth = monthOf(openKey);
    try {
      await loadMarks();
    } catch (message) {
      fatal(message);
      return;
    }
  }
  renderCalendar();
  tiny.win.setTitle(`Pereda — ${openKey}`);
  note.focus();
}

async function showMonth(month) {
  shownMonth = month;
  try {
    await loadMarks();
  } catch (message) {
    fatal(message);
    return;
  }
  renderCalendar();
}

// Clearing a note and deleting one are the same write: an empty body leaves the
// tombstone that keeps the day unmarked.
async function remove() {
  if (!(await flush())) return;
  const sure = await tiny.dialog.confirm('Delete this note?', {
    detail: 'The text is gone for good. There is no undo.',
    ok: 'Delete',
    cancel: 'Keep',
  });
  if (!sure) return;
  const stamp = seq + 1;
  try {
    await tiny.api.call('saveDay', { day: openKey, body: '', seq: stamp });
  } catch (message) {
    setStatus(`Not deleted — ${message}`, 'error');
    return;
  }
  seq = stamp;
  savedBody = '';
  pending = '';
  note.value = '';
  deleteButton.hidden = true;
  mark(openKey, false);
  setStatus();
  note.focus();
}

async function exportAll() {
  if (!(await flush())) return;
  const dir = await tiny.dialog.pickFolder();
  if (dir === null) return;
  let result;
  try {
    result = await tiny.api.call('exportNotes', { dir });
  } catch (message) {
    setStatus('Export failed', 'error');
    await tiny.dialog.alert('Export failed', { detail: message });
    return;
  }
  if (result.ok) {
    setStatus(result.written === 0 ? 'Nothing to export' : `Exported ${count(result.written, 'note')}`);
    await tiny.dialog.alert(
      result.written === 0 ? 'Nothing to export' : `Exported ${count(result.written, 'note')}`,
      { detail: result.written === 0 ? 'No day has a note yet.' : dir },
    );
    return;
  }
  setStatus(`Export stopped at ${result.day}`, 'error');
  await tiny.dialog.alert(`Export stopped at ${result.day}`, {
    detail: `${result.reason}. ${count(result.written, 'note')} written before it stopped.`,
  });
}

$('previous').addEventListener('click', () => showMonth(previousMonth(shownMonth)));
$('next').addEventListener('click', () => showMonth(nextMonth(shownMonth)));
$('today').addEventListener('click', () => load(null));
$('delete').addEventListener('click', remove);
$('export').addEventListener('click', exportAll);
note.addEventListener('input', () => {
  deleteButton.hidden = note.value === '';
  schedule();
});
note.addEventListener('blur', () => flush());
document.addEventListener('visibilitychange', () => {
  if (document.hidden) flush();
});
window.addEventListener('blur', () => flush());

load(null);
