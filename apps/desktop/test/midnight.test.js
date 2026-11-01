import { describe, expect, test } from 'bun:test';

import { writingNotice } from '../src/shared/midnight.js';

const plain = (day) => day;

describe('the midnight line', () => {
  test('names both days while the loaded one is behind', () => {
    expect(writingNotice('2026-10-31', '2026-11-01', plain)).toBe(
      'Writing to 2026-10-31 — today is 2026-11-01.',
    );
  });

  test('says nothing on today or a day ahead of it', () => {
    expect(writingNotice('2026-11-01', '2026-11-01', plain)).toBe('');
    expect(writingNotice('2026-11-02', '2026-11-01', plain)).toBe('');
  });

  test('formats each day through the caller', () => {
    const month = (day) => (day === '2026-10-31' ? '31 October' : '1 November');
    expect(writingNotice('2026-10-31', '2026-11-01', month)).toBe(
      'Writing to 31 October — today is 1 November.',
    );
  });
});
