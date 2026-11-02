// The web app's store: SQLite compiled to WebAssembly, kept in the
// origin-private file system, with the notes library opened over it. The library
// takes the database handle, so this file is the driver and nothing else: the
// schema, the SQL and the search are the desktop's.
//
// The library's handle is the one the desktop passes: `exec`, `prepare().all()`,
// `prepare().run()` and `close`. SQLite's oo1 API answers a query through `exec`
// with a callback, so this adapter is the whole of the difference.

import sqlite3InitModule from "@sqlite.org/sqlite-wasm";
import wasm from "@sqlite.org/sqlite-wasm/sqlite3.wasm?url";

import {
  addDays,
  assertWritableDay,
  dayQuery,
  today,
  validDay,
} from "@pereda/notes/day.js";
import { openStore } from "@pereda/notes/store.js";

const FILE = "/pereda.db";
const PAGE = 30;

function rows(db, sql, bind) {
  const out = [];
  db.exec({ sql, bind, rowMode: "object", callback: (row) => out.push(row) });
  return out;
}

function handle(db) {
  return {
    exec: (sql) => db.exec(sql),
    prepare: (sql) => ({
      all: (...bind) => rows(db, sql, bind),
      run: (...bind) => db.exec({ sql, bind }),
    }),
    close: () => db.close(),
  };
}

// The pool is the browser's file: one connection, made from a worker, without a
// header the host cannot set. A browser without the origin-private file system
// refuses here, and the app says so instead of keeping notes it would lose.
async function create() {
  const sqlite3 = await sqlite3InitModule({ locateFile: () => wasm });
  const pool = await sqlite3.installOpfsSAHPoolVfs({
    name: "pereda",
    directory: ".pereda",
    initialCapacity: 4,
  });
  const db = new pool.OpfsSAHPoolDb(FILE);
  return openStore(FILE, () => handle(db));
}

let opening = null;

function store() {
  if (opening === null) opening = create();
  return opening;
}

// The same three calls the desktop's backend answers, in the same order and
// with the same refusals: the log, the save and the search.
const calls = {
  async open() {
    await store();
    return { today: today() };
  },

  // One page of the log: today on the first page, then the days before the
  // oldest one loaded, newest first. `from` opens the log at a day instead of at
  // today, which is how a search result and a date jump are read.
  async openLog(params) {
    const notes = await store();
    const current = today();
    const before = params?.before;
    const from = params?.from;
    if (before !== undefined && !validDay(before))
      throw new Error("That is not a date.");
    if (from !== undefined && !validDay(from))
      throw new Error("That is not a date.");

    const upper =
      from === undefined ? (before ?? addDays(current, 1)) : addDays(from, 1);
    const read = notes.page(upper, PAGE + 1);
    const more = read.length > PAGE;
    let days = read.slice(0, PAGE);
    if (before === undefined && from === undefined) {
      const row = notes.day(current);
      const first = row
        ? { day: current, body: row.body, seq: row.seq }
        : { day: current, body: "", seq: 0 };
      days = [first, ...days.filter((entry) => entry.day !== current)];
    }
    return { today: current, days, more };
  },

  async saveDay(params) {
    const notes = await store();
    const current = today();
    const day = params?.day;
    assertWritableDay(day, current);
    if (typeof params?.body !== "string")
      throw new Error("A note is plain text.");
    if (!Number.isSafeInteger(params?.seq) || params.seq < 1) {
      throw new Error("A save needs a counter.");
    }
    const saved = notes.save(day, params.body, params.seq);
    if (!saved.applied)
      throw new Error("This note was written somewhere else.");
    return { day, seq: saved.row.seq, today: current };
  },

  // Search the notes by their words, and answer an exact date before that rule:
  // the page of the log bounded by the day after it.
  async searchNotes(params) {
    const notes = await store();
    if (typeof params?.query !== "string")
      throw new Error("A search needs words.");
    const current = today();
    let jump;
    try {
      jump = dayQuery(params.query, current);
    } catch (error) {
      return { refused: error.message };
    }
    if (jump !== null) {
      const read = notes.page(jump.upper, PAGE + 1);
      const more = read.length > PAGE;
      let days = read.slice(0, PAGE);
      if (jump.day === current) {
        const row = notes.day(current);
        if (row === null || row.body === "") {
          days = [
            { day: current, body: "", seq: row === null ? 0 : row.seq },
            ...days.filter((entry) => entry.day !== current),
          ];
        }
      }
      return { jump: { day: jump.day, days, more } };
    }
    return { days: notes.search(params.query, current) };
  },

  // Every day that has a note, oldest first, for the export. A tombstone is not
  // a note and writes no file.
  async all() {
    const notes = await store();
    return notes.all();
  },
};

self.onmessage = async (event) => {
  const { id, name, args } = event.data;
  try {
    const call = calls[name];
    if (call === undefined) throw new Error(`there is no call named ${name}`);
    self.postMessage({ id, value: await call(...args) });
  } catch (error) {
    self.postMessage({ id, error: error.message });
  }
};
