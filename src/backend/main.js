// Pereda's backend: it owns the clock, the notes database and the export, and
// the page reaches them only through the calls below.

import { Database } from 'tjs:sqlite';
import { openStore } from './store.js';
import { join, writeExport } from './export.js';
import { assertWritableDay, today } from '../shared/day.js';

const DB_NAME = 'pereda.db';

// The store is opened once and shared by every call, so a database that cannot
// be opened reports the same reason to each of them for the life of the app.
let opening = null;

function store(app) {
  if (opening === null) {
    opening = (async () => {
      const { data } = await app.paths();
      return openStore(join(data, DB_NAME), (path) => new Database(path));
    })();
  }
  return opening;
}

export const api = {
  // Open a day, or today when none is named, so the page never reads its own
  // clock. A day after today is refused here as well as in the page.
  async openDay(params, app) {
    const notes = await store(app);
    const current = today();
    const day = params?.day ?? current;
    assertWritableDay(day, current);
    const row = notes.day(day);
    return { day, body: row?.body ?? '', seq: row?.seq ?? 0, today: current };
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

  // Write every note into the chosen folder. A failure names the day it stopped
  // on; the files already written stay.
  async exportNotes(params, app) {
    const notes = await store(app);
    if (typeof params?.dir !== 'string' || params.dir === '') {
      throw new Error('Choose a folder to export into.');
    }
    return writeExport(notes.exported(), params.dir, (path, body) =>
      tjs.writeFile(path, body),
    );
  },
};
