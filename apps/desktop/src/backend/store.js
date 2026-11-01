// The notes store: one SQLite row per day, whole bodies, ordered writes, and a
// search index kept in step with them.
//
// The database is opened by the caller, so this module runs under bun in the
// tests and on txiki.js in the app without a second implementation of the SQL.

const SCHEMA_VERSION = 2;

// A search never returns more than this many days; the log is the way to the
// rest, not a second page of results.
const LIMIT = 50;

// One row per day, keyed by the local date. A cleared day keeps its row with an
// empty body: the tombstone's seq is what an older save cannot beat.
const NOTES = `
CREATE TABLE notes (
  day  TEXT PRIMARY KEY,
  body TEXT NOT NULL,
  seq  INTEGER NOT NULL
) WITHOUT ROWID;
`;

// The index is derived: notes stays the only authority, and a match is joined
// back to it. The tokenizer folds case in every script and keeps å, ä and ö as
// their own letters, which LIKE and lower() cannot do outside ASCII.
const INDEX = `
CREATE VIRTUAL TABLE notes_fts USING fts5(
  day UNINDEXED,
  body,
  tokenize="unicode61 remove_diacritics 0"
);
CREATE TRIGGER notes_insert AFTER INSERT ON notes BEGIN
  INSERT INTO notes_fts (day, body) VALUES (new.day, new.body);
END;
CREATE TRIGGER notes_update AFTER UPDATE ON notes BEGIN
  DELETE FROM notes_fts WHERE day = old.day;
  INSERT INTO notes_fts (day, body) VALUES (new.day, new.body);
END;
CREATE TRIGGER notes_delete AFTER DELETE ON notes BEGIN
  DELETE FROM notes_fts WHERE day = old.day;
END;
`;

// The statements that lift a file from its user_version to the current one.
// Version 1 kept no index, so the rows are already there to fill it from.
const MIGRATIONS = {
  0: `${NOTES}${INDEX}`,
  1: `${INDEX}INSERT INTO notes_fts (day, body) SELECT day, body FROM notes;`,
};

// Open the database at path and bring it to the current schema. A file that is
// not a database, a failed integrity check and an unknown schema version all
// refuse the app; nothing is deleted, recreated or repaired over the notes.
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
  if (version !== SCHEMA_VERSION) {
    const migration = MIGRATIONS[version];
    if (migration === undefined) {
      throw new Error(
        `Pereda could not read the notes at ${path}: version ${version}, and this build reads version ${SCHEMA_VERSION}.`,
      );
    }
    try {
      db.exec(`BEGIN; ${migration} PRAGMA user_version = ${SCHEMA_VERSION}; COMMIT;`);
    } catch (error) {
      // The migration is one transaction: a failure leaves the file at the
      // version it opened at, and the reason is the one worth reporting.
      try {
        db.exec('ROLLBACK');
      } catch {}
      throw new Error(`Pereda could not open its notes at ${path}: ${error.message}`);
    }
  }

  return store(db);
}

// A search is words: every word must match, in any order, each as a prefix, so
// "appl" finds "apple". Each word is quoted, so its characters are literal and
// never FTS5 syntax; a word with no letter or number cannot match a token.
function matchExpression(query) {
  return query
    .split(/\s+/)
    .filter((word) => /[\p{L}\p{N}]/u.test(word))
    .map((word) => `"${word.replaceAll('"', '""')}"*`)
    .join(' ');
}

function store(db) {
  const read = db.prepare('SELECT body, seq FROM notes WHERE day = ?');
  const write = db.prepare(`
    INSERT INTO notes (day, body, seq) VALUES (?, ?, ?)
    ON CONFLICT(day) DO UPDATE SET body = excluded.body, seq = excluded.seq
    WHERE excluded.seq > notes.seq
  `);
  const recent = db.prepare(`
    SELECT day, body, seq FROM notes
    WHERE body <> '' AND day < ?
    ORDER BY day DESC
    LIMIT ?
  `);
  const every = db.prepare(`
    SELECT day, body FROM notes
    WHERE body <> ''
    ORDER BY day ASC
  `);
  const found = db.prepare(`
    SELECT notes.day AS day, snippet(notes_fts, 1, '', '', '…', 12) AS snippet
    FROM notes_fts
    JOIN notes ON notes.day = notes_fts.day
    WHERE notes_fts MATCH ? AND notes.day < ?
    ORDER BY notes.day DESC
    LIMIT ?
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

    // A page of the log: days that have a note, newest first, older than the
    // upper bound.
    page(upper, limit) {
      return recent.all(upper, limit);
    },

    // Every day that has a note, oldest first, for the export. A tombstone is
    // not a note and writes no file.
    all() {
      return every.all();
    },

    // The days before `before` whose text holds every word, newest first, each
    // with the text around the first match. The bound is how today stays out of
    // a text search. The index names the days; the note is read from notes,
    // never from the index alone.
    search(query, before) {
      const expression = matchExpression(query);
      if (expression === '') return [];
      return found.all(expression, before, LIMIT);
    },

    close() {
      db.close();
    },
  };
}
