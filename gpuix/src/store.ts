// The notes store: one SQLite row per day, whole bodies, ordered writes.
//
// The database is opened by the caller, so this module runs under bun in the
// tests and inside the app without a second implementation of the SQL.

import type { Database } from 'bun:sqlite';

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

export type NoteRow = { body: string; seq: number };
export type PageRow = NoteRow & { day: string };

export type Notes = {
	// The stored row for a day, or null when nothing was ever written.
	day(day: string): NoteRow | null;
	// Write the whole body for a day with the page's counter.
	save(day: string, body: string, seq: number): { applied: boolean; row: NoteRow | null };
	// A page of the log: days that have a note, newest first, older than the
	// upper bound.
	page(upper: string, limit: number): PageRow[];
	close(): void;
};

// Open the database at path and bring it to the v1 schema. A file that is not a
// database, a failed integrity check and an unknown schema version all refuse
// the app; nothing is deleted, recreated or repaired over the notes.
export function openStore(path: string, openDatabase: (path: string) => Database): Notes {
	let db: Database;
	try {
		db = openDatabase(path);
		db.exec('PRAGMA journal_mode = WAL');
		db.exec('PRAGMA synchronous = FULL');
		const check = db.prepare('PRAGMA integrity_check').all()[0] as { integrity_check?: string } | undefined;
		const result = check === undefined ? null : check.integrity_check;
		if (result !== 'ok') {
			throw new Error(`the integrity check says ${result ?? 'nothing'}`);
		}
	} catch (error) {
		throw new Error(`Pereda could not open its notes at ${path}: ${(error as Error).message}`);
	}

	const version = (db.prepare('PRAGMA user_version').all()[0] as { user_version: number }).user_version;
	if (version === 0) {
		try {
			db.exec(`BEGIN; ${SCHEMA} PRAGMA user_version = ${SCHEMA_VERSION}; COMMIT;`);
		} catch (error) {
			throw new Error(`Pereda could not open its notes at ${path}: ${(error as Error).message}`);
		}
	} else if (version !== SCHEMA_VERSION) {
		throw new Error(
			`Pereda could not read the notes at ${path}: version ${version}, and this build reads version ${SCHEMA_VERSION}.`
		);
	}

	return store(db);
}

function store(db: Database): Notes {
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

	return {
		day(day: string): NoteRow | null {
			return (read.all(day)[0] as NoteRow | undefined) ?? null;
		},

		// Write the whole body for a day with the page's counter. A counter that is
		// not newer than the stored one changes nothing. applied says whether this
		// exact body is the one now stored, so a same-counter write from another
		// window is reported instead of being mistaken for this one.
		save(day: string, body: string, seq: number) {
			write.run(day, body, seq);
			const row = (read.all(day)[0] as NoteRow | undefined) ?? null;
			return { applied: row !== null && row.seq === seq && row.body === body, row };
		},

		// A page of the log: days that have a note, newest first, older than the
		// upper bound.
		page(upper: string, limit: number): PageRow[] {
			return recent.all(upper, limit) as PageRow[];
		},

		close() {
			db.close();
		}
	};
}
