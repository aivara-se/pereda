// The notes store: one SQLite row per day, whole bodies, ordered writes.
//
// The database is opened by the caller, so this module runs under bun in the
// tests and on txiki.js in the app without a second implementation of the SQL.

const SCHEMA_VERSION = 1;

// One row per day, keyed by the local date. A cleared day keeps its row with an
// empty body: the tombstone's seq is what an older save cannot beat.
const SCHEMA = `
CREATE TABLE notes (
  day  TEXT PRIMARY KEY,
  body TEXT NOT NULL,
  seq  INTEGER NOT NULL
) WITHOUT ROWID;
`;

// Open the database at path and bring it to the v1 schema. A file that is not a
// database, a failed integrity check and an unknown schema version all refuse
// the app; nothing is deleted, recreated or repaired over the notes.
export function openStore(path, openDatabase) {
  let db;
  try {
    db = openDatabase(path);
    db.exec('PRAGMA journal_mode = WAL');
    db.exec('PRAGMA synchronous = FULL');
    const check = db.prepare('PRAGMA integrity_check').all()[0];
    const result = check === undefined ? null : check.integrity_check;
    if (result !== 'ok') {
      throw new Error(`the integrity check says ${result ?? 'nothing'}`);
    }
  } catch (error) {
    throw new Error(`Pereda could not open its notes at ${path}: ${error.message}`);
  }

  const version = db.prepare('PRAGMA user_version').all()[0].user_version;
  if (version === 0) {
    try {
      db.exec(`BEGIN; ${SCHEMA} PRAGMA user_version = ${SCHEMA_VERSION}; COMMIT;`);
    } catch (error) {
      throw new Error(`Pereda could not open its notes at ${path}: ${error.message}`);
    }
  } else if (version !== SCHEMA_VERSION) {
    throw new Error(
      `Pereda could not read the notes at ${path}: version ${version}, and this build reads version ${SCHEMA_VERSION}.`,
    );
  }

  return store(db);
}

function store(db) {
  const read = db.prepare('SELECT body, seq FROM notes WHERE day = ?');
  const write = db.prepare(`
    INSERT INTO notes (day, body, seq) VALUES (?, ?, ?)
    ON CONFLICT(day) DO UPDATE SET body = excluded.body, seq = excluded.seq
    WHERE excluded.seq > notes.seq
  `);

  return {
    // The stored row for a day, or null when nothing was ever written.
    day(day) {
      return read.all(day)[0] ?? null;
    },

    // Write the whole body for a day with the page's counter. A counter that is
    // not newer than the stored one changes nothing. applied says whether this
    // exact body is the one now stored, so a same-counter write from another
    // window is reported instead of being mistaken for this one.
    save(day, body, seq) {
      write.run(day, body, seq);
      const row = read.all(day)[0] ?? null;
      return { applied: row !== null && row.seq === seq && row.body === body, row };
    },

    close() {
      db.close();
    },
  };
}
