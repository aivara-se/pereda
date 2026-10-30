// Pereda's backend: it owns the clock and the notes database, and the page
// reaches them only through the calls below.
//
// The app is one process, so these are plain functions rather than an IPC
// bridge; the separation is kept because it is what the product promises — the
// page never touches the database or the filesystem itself.

import { Database } from 'bun:sqlite';
import { mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { openStore, type Notes, type PageRow } from './store.ts';
import { addDays, assertWritableDay, today, validDay } from './day.ts';

const DB_NAME = 'pereda.db';
const PAGE = 30;

// The data folder is the backup: one database, one folder, named per platform.
function dataFolder(): string {
	if (process.platform === 'darwin') {
		return join(homedir(), 'Library', 'Application Support', 'Pereda');
	}
	if (process.platform === 'win32') {
		return join(process.env.APPDATA ?? join(homedir(), 'AppData', 'Roaming'), 'Pereda');
	}
	return join(process.env.XDG_DATA_HOME ?? join(homedir(), '.local', 'share'), 'pereda');
}

// The store is opened once and shared by every call, so a database that cannot
// be opened reports the same reason to each of them for the life of the app.
let opening: Promise<Notes> | null = null;
let opened: Notes | null = null;

export function databasePath(): string {
	return join(dataFolder(), DB_NAME);
}

function store(): Promise<Notes> {
	if (opening === null) {
		opening = (async () => {
			const folder = dataFolder();
			mkdirSync(folder, { recursive: true });
			opened = openStore(join(folder, DB_NAME), (path) => new Database(path));
			return opened;
		})();
	}
	return opening;
}

export type OpenedDay = { day: string; body: string; seq: number };

export type OpenLogResult = { today: string; days: OpenedDay[]; more: boolean };

// A save as the page describes it: a whole body, under the counter the page holds.
export type Save = { day?: string; body?: string; seq?: number };

function write(notes: Notes, params: Save): { day: string; seq: number } {
	const current = today();
	const day = params?.day;
	assertWritableDay(day, current);
	if (typeof params?.body !== 'string') throw new Error('A note is plain text.');
	if (!Number.isSafeInteger(params?.seq) || (params.seq as number) < 1) {
		throw new Error('A save needs a counter.');
	}
	const saved = notes.save(day as string, params.body, params.seq as number);
	if (!saved.applied) {
		throw new Error('This note was written somewhere else.');
	}
	return { day: day as string, seq: (saved.row as { seq: number }).seq };
}

// The same save, without the promise: a quit ends the process before a microtask
// runs, so the page flushes its unsaved bodies through this one. It writes to the
// store the calls above opened, and refuses when there is none.
export function saveNow(params: Save): { day: string; seq: number } {
	if (opened === null) throw new Error('The notes are not open yet.');
	return write(opened, params);
}

export const api = {
	// One page of the log: today on the first page, then the days before the
	// oldest one loaded, newest first. A day with nothing written is skipped,
	// except today, which is the first entry even when it is empty.
	async openLog(params?: { before?: string }): Promise<OpenLogResult> {
		const notes = await store();
		const current = today();
		const before = params?.before;
		if (before !== undefined && !validDay(before)) throw new Error('That is not a date.');

		const rows = notes.page(before ?? addDays(current, 1), PAGE + 1) as PageRow[];
		const more = rows.length > PAGE;
		let days: OpenedDay[] = rows.slice(0, PAGE);
		if (before === undefined) {
			const row = notes.day(current);
			const first: OpenedDay = row
				? { day: current, body: row.body, seq: row.seq }
				: { day: current, body: '', seq: 0 };
			days = [first, ...days.filter((entry) => entry.day !== current)];
		}
		return { today: current, days, more };
	},

	// Save a whole body with the page's counter. An older counter loses the
	// comparison in the store and is reported instead of pretending to save.
	async saveDay(params: Save): Promise<{ day: string; seq: number }> {
		return write(await store(), params);
	}
};
