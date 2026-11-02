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

import { openLog, saveDay, searchNotes } from "@pereda/notes/calls.js";
import { today } from "@pereda/notes/day.js";
import { openStore } from "@pereda/notes/store.js";

const FILE = "/pereda.db";

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

// The calls' bodies are the notes library's; this worker only says how it is
// asked, over the store it opened.
const calls = {
  async open() {
    await store();
    return { today: today() };
  },

  async openLog(params) {
    return openLog(await store(), params);
  },

  async saveDay(params) {
    return saveDay(await store(), params);
  },

  async searchNotes(params) {
    return searchNotes(await store(), params);
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
