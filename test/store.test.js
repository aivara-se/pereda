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

// A day, `offset` days after 1 January 2026.
function dayAt(offset) {
  return new Date(Date.UTC(2026, 0, 1 + offset)).toISOString().slice(0, 10);
}

// A file as v1.1 left it: one notes table at schema version 1, no index.
function versionOneFile() {
  const path = temporaryFile();
  const db = new Database(path);
  db.exec(`
    CREATE TABLE notes (day TEXT PRIMARY KEY, body TEXT NOT NULL, seq INTEGER NOT NULL) WITHOUT ROWID;
    PRAGMA user_version = 1;
  `);
  const write = db.prepare('INSERT INTO notes (day, body, seq) VALUES (?, ?, ?)');
  write.run('2026-09-30', 'Äpplet föll i gräset.', 1);
  write.run('2026-10-01', 'A second note about pears.', 1);
  db.close();
  return path;
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

  test('creates the schema at version 2, with the search index beside the notes', () => {
    const path = temporaryFile();
    openStore(path, openDatabase).close();

    const db = new Database(path);
    expect(db.prepare('PRAGMA user_version').all()[0].user_version).toBe(2);
    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table'")
      .all()
      .map((table) => table.name);
    expect(tables).toContain('notes');
    expect(tables).toContain('notes_fts');
    db.close();
  });

  test('finds a note by a word, folded in every script', () => {
    const store = memoryStore();
    store.save('2026-10-01', 'Äpplet föll i gräset, nära hjärtat.', 1);

    expect(store.search('äpp').map((found) => found.day)).toEqual(['2026-10-01']);
    expect(store.search('ÄPP').map((found) => found.day)).toEqual(['2026-10-01']);
    expect(store.search('hjärt').map((found) => found.day)).toEqual(['2026-10-01']);
    expect(store.search('hjart')).toEqual([]);
    store.close();
  });

  test('matches every word, in any order, each as a prefix', () => {
    const store = memoryStore();
    store.save('2026-10-01', 'An apple pie with cinnamon.', 1);

    expect(store.search('appl cinn').map((found) => found.day)).toEqual(['2026-10-01']);
    expect(store.search('cinn appl').map((found) => found.day)).toEqual(['2026-10-01']);
    expect(store.search('appl pear')).toEqual([]);
    store.close();
  });

  test('returns matching days newest first, with the text around the match', () => {
    const store = memoryStore();
    store.save('2026-10-01', 'The first day with a lantern.', 1);
    store.save('2026-09-29', 'A lantern in the fog.', 1);
    store.save('2026-09-30', 'Nothing about the word.', 1);

    const found = store.search('lantern');
    expect(found.map((entry) => entry.day)).toEqual(['2026-10-01', '2026-09-29']);
    expect(found[0].snippet).toContain('lantern');
    store.close();
  });

  test('keeps the index in step with an update and a clear', () => {
    const store = memoryStore();
    store.save('2026-10-01', 'the first words', 1);
    store.save('2026-10-01', 'other words now', 2);

    expect(store.search('first')).toEqual([]);
    expect(store.search('other').map((found) => found.day)).toEqual(['2026-10-01']);

    store.save('2026-10-01', '', 3);
    expect(store.search('other')).toEqual([]);
    store.close();
  });

  test('takes the query as words, never as FTS5 syntax', () => {
    const store = memoryStore();
    store.save('2026-10-01', 'The OR gate, a "quoted" word, star* and 100% of it.', 1);

    expect(store.search('OR').map((found) => found.day)).toEqual(['2026-10-01']);
    expect(store.search('"quoted"').map((found) => found.day)).toEqual(['2026-10-01']);
    expect(store.search('star*').map((found) => found.day)).toEqual(['2026-10-01']);
    expect(store.search('NEAR(gate word)')).toEqual([]);
    expect(store.search('"')).toEqual([]);
    expect(store.search('   ')).toEqual([]);
    store.close();
  });

  test('returns at most fifty days', () => {
    const store = memoryStore();
    for (let offset = 0; offset < 51; offset += 1) {
      store.save(dayAt(offset), `paper number ${offset}`, 1);
    }

    const found = store.search('paper');
    expect(found.length).toBe(50);
    expect(found[0].day).toBe(dayAt(50));
    expect(found[49].day).toBe(dayAt(1));
    store.close();
  });

  test('lifts a version 1 file to version 2 and indexes the notes it holds', () => {
    const path = versionOneFile();
    const store = openStore(path, openDatabase);

    expect(store.day('2026-09-30')).toEqual({ body: 'Äpplet föll i gräset.', seq: 1 });
    expect(store.search('äpp').map((found) => found.day)).toEqual(['2026-09-30']);
    expect(store.search('pears').map((found) => found.day)).toEqual(['2026-10-01']);

    store.save('2026-10-02', 'A note written after the lift.', 1);
    expect(store.search('lift').map((found) => found.day)).toEqual(['2026-10-02']);
    store.close();

    const db = new Database(path);
    expect(db.prepare('PRAGMA user_version').all()[0].user_version).toBe(2);
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
    db.exec('PRAGMA user_version = 3');
    db.close();

    expect(() => openStore(path, openDatabase)).toThrow(
      `could not read the notes at ${path}: version 3, and this build reads version 2.`,
    );
  });
});
