import { describe, expect, test } from 'bun:test';

import { writeExport } from '../src/backend/export.js';

const target = (day) => `/notes/${day}.md`;

function writer(seed = []) {
  const files = new Map(seed);
  return {
    files,
    write: async (path, body) => {
      files.set(path, body);
    },
  };
}

describe('the export', () => {
  test('writes every note oldest first, verbatim', async () => {
    const { files, write } = writer();
    const rows = [
      { day: '2026-10-24', body: 'Fog.\n\nThen sun.' },
      { day: '2026-10-26', body: 'No newline added' },
    ];

    expect(await writeExport(rows, target, write)).toEqual({ written: 2, failed: null });
    expect([...files.keys()]).toEqual(['/notes/2026-10-24.md', '/notes/2026-10-26.md']);
    expect(files.get('/notes/2026-10-24.md')).toBe('Fog.\n\nThen sun.');
    expect(files.get('/notes/2026-10-26.md')).toBe('No newline added');
  });

  test('replaces a file that already has the day name', async () => {
    const { files, write } = writer([['/notes/2026-10-26.md', 'the old file']]);

    expect(
      await writeExport([{ day: '2026-10-26', body: 'the new note' }], target, write),
    ).toEqual({ written: 1, failed: null });
    expect(files.get('/notes/2026-10-26.md')).toBe('the new note');
  });

  test('stops at the first failed write and keeps what came before', async () => {
    const written = [];
    const write = async (path, body) => {
      if (path.endsWith('2026-10-25.md')) throw new Error('disk full');
      written.push(body);
    };
    const rows = [
      { day: '2026-10-24', body: 'first' },
      { day: '2026-10-25', body: 'second' },
      { day: '2026-10-26', body: 'third' },
    ];

    expect(await writeExport(rows, target, write)).toEqual({
      written: 1,
      failed: { day: '2026-10-25', reason: 'disk full' },
    });
    expect(written).toEqual(['first']);
  });

  test('refuses a day that is not a date before building its path', async () => {
    let called = false;
    const result = await writeExport([{ day: '../escape', body: 'x' }], target, async () => {
      called = true;
    });

    expect(result).toEqual({ written: 0, failed: { day: '../escape', reason: 'That is not a date.' } });
    expect(called).toBe(false);
  });

  test('writes nothing for an empty log', async () => {
    const { files, write } = writer();
    expect(await writeExport([], target, write)).toEqual({ written: 0, failed: null });
    expect(files.size).toBe(0);
  });
});
