// Pereda's backend: it owns the clock and the notes database, and the page
// reaches them only through the calls below.

import { Database } from 'tjs:sqlite';
import { openStore } from './store.js';
import { addDays, assertWritableDay, today, validDay } from '../shared/day.js';

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

export const api = {
  // One page of the log: today on the first page, then the days before the
  // oldest one loaded, newest first. A day with nothing written is skipped,
  // except today, which is the first entry even when it is empty.
  async openLog(params, app) {
    const notes = await store(app);
    const current = today();
    const before = params?.before;
    if (before !== undefined && !validDay(before)) throw new Error('That is not a date.');

    const rows = notes.page(before ?? addDays(current, 1), PAGE + 1);
    const more = rows.length > PAGE;
    let days = rows.slice(0, PAGE);
    if (before === undefined) {
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
};
