// The page: one day, one note, and every character reaching the backend through
// one debounced, ordered save.

import { addDays } from '../shared/day.js';

const DEBOUNCE = 300;

const $ = (id) => document.getElementById(id);
const note = $('note');
const statusLine = $('status');
const deleteButton = $('delete');
const dateLabel = $('date');

let todayKey = null; // the backend's idea of today, refreshed on every open
let openKey = null; // the day in the editor

let seq = 0; // the counter of the last save attempted
let savedBody = ''; // the body the backend has confirmed
let pending = null; // the newest body waiting to be sent
let runner = null; // the save in flight, if any
let timer = 0;
let loadToken = 0; // the newest open, so a slow one cannot win

function setStatus(text) {
  statusLine.textContent = text;
}

function dayDate(day) {
  const [year, month, date] = day.split('-').map(Number);
  return new Date(year, month - 1, date);
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
      setStatus(`Not saved — ${message}`);
      return false;
    }
    seq = stamp;
    savedBody = body;
    setStatus();
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
  $('next').disabled = openKey >= todayKey;
  setStatus();
  dateLabel.textContent = dayDate(openKey).toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  tiny.win.setTitle(`Pereda — ${openKey}`);
  note.focus();
}

// Walk to another day with the arrows. A day after today is never asked for.
function step(delta) {
  if (openKey === null) return;
  const wanted = addDays(openKey, delta);
  if (wanted > todayKey) return;
  load(wanted);
}

// Clearing a note and deleting one are the same write: an empty body leaves the
// tombstone that keeps the day empty.
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
    setStatus(`Not deleted — ${message}`);
    return;
  }
  seq = stamp;
  savedBody = '';
  pending = '';
  note.value = '';
  deleteButton.hidden = true;
  setStatus();
  note.focus();
}

$('previous').addEventListener('click', () => step(-1));
$('next').addEventListener('click', () => step(1));
$('today').addEventListener('click', () => load(null));
$('delete').addEventListener('click', remove);
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
