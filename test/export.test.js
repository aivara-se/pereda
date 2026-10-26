import { describe, expect, test } from 'bun:test';
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join as joinPath } from 'node:path';

import { join, writeExport } from '../src/backend/export.js';

function temporaryFolder() {
  return mkdtempSync(joinPath(tmpdir(), 'pereda-export-'));
}

const fileWriter = async (path, body) => {
  writeFileSync(path, body);
};

describe('the Markdown export', () => {
  test('writes one file per day, named by its date, with the body unchanged', async () => {
    const dir = temporaryFolder();
    const days = [
      { day: '2026-10-25', body: 'Sunday.\n' },
      { day: '2026-10-26', body: 'A paragraph.\n\nAnother <b>one</b>, verbatim.  ' },
    ];

    const result = await writeExport(days, dir, fileWriter);

    expect(result).toEqual({ ok: true, written: 2 });
    expect(readFileSync(joinPath(dir, '2026-10-25.md'), 'utf8')).toBe('Sunday.\n');
    expect(readFileSync(joinPath(dir, '2026-10-26.md'), 'utf8')).toBe(
      'A paragraph.\n\nAnother <b>one</b>, verbatim.  ',
    );
  });

  test('replaces a file of the same name', async () => {
    const dir = temporaryFolder();
    writeFileSync(joinPath(dir, '2026-10-26.md'), 'old');

    await writeExport([{ day: '2026-10-26', body: 'new' }], dir, fileWriter);

    expect(readFileSync(joinPath(dir, '2026-10-26.md'), 'utf8')).toBe('new');
  });

  test('stops at the first failure and reports the day and the count', async () => {
    const dir = temporaryFolder();
    const days = [
      { day: '2026-10-25', body: 'one' },
      { day: '2026-10-26', body: 'two' },
      { day: '2026-10-27', body: 'three' },
    ];
    const writer = async (path, body) => {
      if (path.endsWith('2026-10-26.md')) throw new Error('the disk is full');
      await fileWriter(path, body);
    };

    const result = await writeExport(days, dir, writer);

    expect(result).toEqual({
      ok: false,
      day: '2026-10-26',
      written: 1,
      reason: 'the disk is full',
    });
    expect(existsSync(joinPath(dir, '2026-10-25.md'))).toBe(true);
    expect(existsSync(joinPath(dir, '2026-10-26.md'))).toBe(false);
    expect(existsSync(joinPath(dir, '2026-10-27.md'))).toBe(false);
  });

  test('writes nothing when no day has a note', async () => {
    expect(await writeExport([], temporaryFolder(), fileWriter)).toEqual({ ok: true, written: 0 });
  });
});

describe('joining an export path', () => {
  test('adds only the separator the folder is missing', () => {
    expect(join('/tmp/notes', '2026-10-26.md')).toBe('/tmp/notes/2026-10-26.md');
    expect(join('/tmp/notes/', '2026-10-26.md')).toBe('/tmp/notes/2026-10-26.md');
    expect(join('C:\\notes', '2026-10-26.md')).toBe('C:\\notes/2026-10-26.md');
    expect(join('C:\\notes\\', '2026-10-26.md')).toBe('C:\\notes\\2026-10-26.md');
  });
});
