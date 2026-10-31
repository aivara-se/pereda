// Pereda's backend: it owns the clock and the notes database, and the page
// reaches them only through the calls below.

import { Database } from 'tjs:sqlite';
import { openStore } from './store.js';
import { addDays, assertWritableDay, today, validDay } from '../shared/day.js';
import { SHORTCUT_COMBO, SHORTCUT_ID } from '../shared/shortcut.js';

const DB_NAME = 'pereda.db';
const PAGE = 30;

// The store is opened once and shared by every call, so a database that cannot
// be opened reports the same reason to each of them for the life of the app.
let opening = null;

function store(app) {
  if (opening === null) {
    opening = (async () => {
      const { data } = await app.paths();
      return openStore(`${data}/${DB_NAME}`, (path) => new Database(path));
    })();
  }
  return opening;
}

// The shortcut is asked for once for the life of the process: init asks at
// launch, and a page that asks first still gets the same answer.
let registering = null;

async function registerShortcut(app) {
  const { globalHotkeys } = await app.system.capabilities();
  if (globalHotkeys === false) return false;
  return app.hotkey.register(SHORTCUT_ID, SHORTCUT_COMBO);
}

function shortcutRegistration(app) {
  if (registering === null) registering = registerShortcut(app);
  return registering;
}

// One hotkey, while the app runs. Nothing else is set up at launch.
export function init(app) {
  shortcutRegistration(app);
}

// A press brings the window forward; the page hears the same press and takes
// the Today path, so the shortcut does what the button does, not a second thing.
export function onHotkey(id, app) {
  if (id === SHORTCUT_ID) app.win.show();
}

export const api = {
  // One page of the log: today on the first page, then the days before the
  // oldest one loaded, newest first. A day with nothing written is skipped,
  // except today, which is the first entry even when it is empty. `from` opens
  // the log at a day instead of at today, which is how a search result is read.
  async openLog(params, app) {
    const notes = await store(app);
    const current = today();
    const before = params?.before;
    const from = params?.from;
    if (before !== undefined && !validDay(before)) throw new Error('That is not a date.');
    if (from !== undefined && !validDay(from)) throw new Error('That is not a date.');

    const upper = from === undefined ? (before ?? addDays(current, 1)) : addDays(from, 1);
    const rows = notes.page(upper, PAGE + 1);
    const more = rows.length > PAGE;
    let days = rows.slice(0, PAGE);
    if (before === undefined && from === undefined) {
      const row = notes.day(current);
      const first = row
        ? { day: current, body: row.body, seq: row.seq }
        : { day: current, body: '', seq: 0 };
      days = [first, ...days.filter((entry) => entry.day !== current)];
    }
    return { today: current, days, more };
  },

  // Save a whole body with the page's counter. An older counter loses the
  // comparison in the store and is reported instead of pretending to save.
  async saveDay(params, app) {
    const notes = await store(app);
    const current = today();
    const day = params?.day;
    assertWritableDay(day, current);
    if (typeof params?.body !== 'string') throw new Error('A note is plain text.');
    if (!Number.isSafeInteger(params?.seq) || params.seq < 1) {
      throw new Error('A save needs a counter.');
    }
    const saved = notes.save(day, params.body, params.seq);
    if (!saved.applied) {
      throw new Error('This note was written somewhere else.');
    }
    return { day, seq: saved.row.seq };
  },

  // Search the notes by their words: every word, in any order, each as a
  // prefix, newest first. A result is a day and the text around the match.
  async searchNotes(params, app) {
    const notes = await store(app);
    if (typeof params?.query !== 'string') throw new Error('A search needs words.');
    return { days: notes.search(params.query) };
  },

  // Whether the system gave the app its shortcut, so the page can say a missing
  // one once and work on without it. A registration that failed to answer is
  // the same answer as a refusal: no shortcut.
  async readShortcut(params, app) {
    return { registered: await shortcutRegistration(app).catch(() => false) };
  },
};
