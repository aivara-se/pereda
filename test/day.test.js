import { describe, expect, test } from 'bun:test';

import {
  addDays,
  assertWritableDay,
  dayQuery,
  localDay,
  today,
  validDay,
} from '../src/shared/day.js';

describe('the local day', () => {
  test('is read from the local clock, not UTC', () => {
    expect(localDay(new Date(2026, 9, 26, 0, 0, 0))).toBe('2026-10-26');
    expect(localDay(new Date(2026, 9, 26, 23, 59, 59))).toBe('2026-10-26');
  });

  test('turns over at midnight', () => {
    expect(localDay(new Date(2026, 9, 26, 23, 59, 59, 999))).toBe('2026-10-26');
    expect(localDay(new Date(2026, 9, 27, 0, 0, 0, 0))).toBe('2026-10-27');
    expect(localDay(new Date(2026, 11, 31, 23, 59))).toBe('2026-12-31');
    expect(localDay(new Date(2027, 0, 1, 0, 0))).toBe('2027-01-01');
  });

  test('today is the local day of the date it is given', () => {
    expect(today(new Date(2026, 9, 26, 12, 0))).toBe('2026-10-26');
  });
});

describe('a day', () => {
  test('is valid only as a real date written YYYY-MM-DD', () => {
    const cases = [
      ['2026-10-26', true],
      ['2024-02-29', true],
      ['2025-02-29', false],
      ['2026-04-31', false],
      ['2026-13-01', false],
      ['2026-00-10', false],
      ['2026-10-00', false],
      ['2026-1-1', false],
      ['2026-10-26 ', false],
      ['26-10-2026', false],
      ['', false],
      [null, false],
      [20261026, false],
    ];
    for (const [day, expected] of cases) {
      expect([day, validDay(day)]).toEqual([day, expected]);
    }
  });

  test('is refused when it is after today', () => {
    expect(() => assertWritableDay('2026-10-27', '2026-10-26')).toThrow(
      'A day after today cannot be written.',
    );
  });

  test('is open on today and every day before it', () => {
    expect(() => assertWritableDay('2026-10-26', '2026-10-26')).not.toThrow();
    expect(() => assertWritableDay('2024-02-29', '2026-10-26')).not.toThrow();
  });

  test('is refused when it is not a date at all', () => {
    expect(() => assertWritableDay('2026-02-30', '2026-10-26')).toThrow('That is not a date.');
    expect(() => assertWritableDay(undefined, '2026-10-26')).toThrow('That is not a date.');
  });
});

describe('a date typed into the search field', () => {
  test('is a day only when it is exactly YYYY-MM-DD and names a real date', () => {
    expect(dayQuery('2026-10-26', '2026-10-31')).toEqual({
      day: '2026-10-26',
      upper: '2026-10-27',
    });
    expect(dayQuery('2024-02-29', '2026-10-31')).toEqual({
      day: '2024-02-29',
      upper: '2024-03-01',
    });
    const queries = [
      '2026-1-1',
      '31/10/2026',
      'October 31',
      '2026-02-30',
      '2026-10-26 ',
      '',
      'today',
    ];
    for (const query of queries) {
      expect([query, dayQuery(query, '2026-10-31')]).toEqual([query, null]);
    }
  });

  test('is refused when it is after today', () => {
    expect(() => dayQuery('2026-11-01', '2026-10-31')).toThrow(
      'A day after today cannot be opened.',
    );
  });

  test('bounds the page by the day after the target', () => {
    expect(dayQuery('2026-12-31', '2027-01-05').upper).toBe('2027-01-01');
  });
});

describe('walking to another day', () => {
  test('moves one day at a time', () => {
    expect(addDays('2026-10-26', 1)).toBe('2026-10-27');
    expect(addDays('2026-10-26', -1)).toBe('2026-10-25');
    expect(addDays('2026-10-26', 0)).toBe('2026-10-26');
  });

  test('crosses the end of a month', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDays('2026-11-01', -1)).toBe('2026-10-31');
    expect(addDays('2026-10-31', -31)).toBe('2026-09-30');
  });

  test('crosses the turn of the year', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31');
    expect(addDays('2026-10-26', 365)).toBe('2027-10-26');
  });

  test('crosses a leap day in both directions', () => {
    expect(addDays('2024-02-28', 1)).toBe('2024-02-29');
    expect(addDays('2024-02-29', 1)).toBe('2024-03-01');
    expect(addDays('2025-02-28', 1)).toBe('2025-03-01');
    expect(addDays('2024-03-01', -1)).toBe('2024-02-29');
    expect(addDays('2025-03-01', -1)).toBe('2025-02-28');
  });
});
