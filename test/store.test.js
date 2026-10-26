import { describe, expect, test } from 'bun:test';
import { Database } from 'bun:sqlite';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { openStore } from '../src/backend/store.js';

const openDatabase = (path) => new Database(path);

function memoryStore() {
  return openStore(':memory:', openDatabase);
}

function temporaryFile() {
  return join(mkdtempSync(join(tmpdir(), 'pereda-')), 'pereda.db');
}

describe('the notes store', () => {
  test('leaves no row for a day that was never written', () => {
    const store = memoryStore();
    expect(store.day('2026-10-26')).toBeNull();
    store.close();
  });

  test('inserts a note and reads it back whole', () => {
    const store = memoryStore();
    const body = 'A paragraph.\n\nAnd a second one, with ünïcode and <b>markup</b>.';
    expect(store.save('2026-10-26', body, 1)).toEqual({
      applied: true,
      row: { body, seq: 1 },
    });
    expect(store.day('2026-10-26')).toEqual({ body, seq: 1 });
    store.close();
  });

  test('replaces the whole body on a newer counter', () => {
    const store = memoryStore();
    store.save('2026-10-26', 'first', 1);
    expect(store.save('2026-10-26', 'second', 2)).toEqual({
      applied: true,
      row: { body: 'second', seq: 2 },
    });
    store.close();
  });

  test('loses a save whose counter is not newer', () => {
    const store = memoryStore();
    store.save('2026-10-26', 'newest', 5);
    expect(store.save('2026-10-26', 'older', 4)).toEqual({
      applied: false,
      row: { body: 'newest', seq: 5 },
    });
    expect(store.save('2026-10-26', 'same counter', 5)).toEqual({
      applied: false,
      row: { body: 'newest', seq: 5 },
    });
    expect(store.day('2026-10-26').body).toBe('newest');
    store.close();
  });

  test('reports a same-counter write from another window that it did not make', () => {
    const store = memoryStore();
    expect(store.save('2026-10-26', 'the other window', 3).applied).toBe(true);
    expect(store.save('2026-10-26', 'this window', 3)).toEqual({
      applied: false,
      row: { body: 'the other window', seq: 3 },
    });
    store.close();
  });

  test('keeps a cleared day as an empty tombstone, and no older save resurrects it', () => {
    const store = memoryStore();
    store.save('2026-10-26', 'a note', 1);
    expect(store.save('2026-10-26', '', 2)).toEqual({
      applied: true,
      row: { body: '', seq: 2 },
    });

    expect(store.save('2026-10-26', 'a late save', 1)).toEqual({
      applied: false,
      row: { body: '', seq: 2 },
    });
    store.close();
  });

  test('pages days newest first, skips empty ones and stops at the end', () => {
    const store = memoryStore();
    store.save('2026-10-26', 'today', 1);
    store.save('2026-10-25', '', 1);
    store.save('2026-10-24', 'older', 1);
    store.save('2026-10-20', 'older still', 1);

    expect(store.page('2026-10-27', 2)).toEqual([
      { day: '2026-10-26', body: 'today', seq: 1 },
      { day: '2026-10-24', body: 'older', seq: 1 },
    ]);
    expect(store.page('2026-10-24', 2)).toEqual([
      { day: '2026-10-20', body: 'older still', seq: 1 },
    ]);
    expect(store.page('2026-10-20', 2)).toEqual([]);
  });

  test('creates the schema at version 1', () => {
    const path = temporaryFile();
    openStore(path, openDatabase).close();

    const db = new Database(path);
    expect(db.prepare('PRAGMA user_version').all()[0].user_version).toBe(1);
    expect(db.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all()).toEqual([
      { name: 'notes' },
    ]);
    db.close();
  });

  test('names the notes file when the schema cannot be created', () => {
    const path = temporaryFile();
    const db = new Database(path);
    db.exec(
      'CREATE TABLE notes (day TEXT PRIMARY KEY, body TEXT NOT NULL, seq INTEGER NOT NULL) WITHOUT ROWID',
    );
    db.close();

    expect(() => openStore(path, openDatabase)).toThrow(`could not open its notes at ${path}`);
  });

  test('refuses a file that is not a database, and does not touch it', () => {
    const path = temporaryFile();
    writeFileSync(path, 'this is not a database');
    let message = '';
    try {
      openStore(path, openDatabase);
    } catch (error) {
      message = error.message;
    }
    expect(message).toContain(`could not open its notes at ${path}`);
    expect(readFileSync(path, 'utf8')).toBe('this is not a database');
  });

  test('refuses a schema version it does not read', () => {
    const path = temporaryFile();
    openStore(path, openDatabase).close();
    const db = new Database(path);
    db.exec('PRAGMA user_version = 2');
    db.close();

    expect(() => openStore(path, openDatabase)).toThrow(
      `could not read the notes at ${path}: version 2, and this build reads version 1.`,
    );
  });
});
