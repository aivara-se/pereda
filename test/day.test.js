import { describe, expect, test } from 'bun:test';

import {
  assertWritableDay,
  daysInMonth,
  firstWeekday,
  localDay,
  monthOf,
  nextMonth,
  previousMonth,
  today,
  validDay,
  validMonth,
  weekdayOf,
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

describe('a month', () => {
  test('is valid only as YYYY-MM', () => {
    expect(validMonth('2026-10')).toBe(true);
    expect(validMonth('2026-13')).toBe(false);
    expect(validMonth('2026-1')).toBe(false);
    expect(validMonth('026-10')).toBe(false);
    expect(validMonth(undefined)).toBe(false);
  });

  test('knows its length, leap years included', () => {
    expect(daysInMonth('2026-02')).toBe(28);
    expect(daysInMonth('2024-02')).toBe(29);
    expect(daysInMonth('2000-02')).toBe(29);
    expect(daysInMonth('1900-02')).toBe(28);
    expect(daysInMonth('2026-04')).toBe(30);
    expect(daysInMonth('2026-13')).toBe(0);
  });

  test('moves across the turn of the year', () => {
    expect(nextMonth('2026-12')).toBe('2027-01');
    expect(nextMonth('2026-10')).toBe('2026-11');
    expect(previousMonth('2026-01')).toBe('2025-12');
    expect(previousMonth('2026-10')).toBe('2026-09');
  });

  test('is the first seven characters of its days', () => {
    expect(monthOf('2026-10-26')).toBe('2026-10');
    expect(monthOf('2027-01-01')).toBe('2027-01');
  });
});

describe('the week', () => {
  test('names every weekday', () => {
    expect(weekdayOf('2026-10-26')).toBe(1); // Monday
    expect(weekdayOf('2026-10-25')).toBe(0); // Sunday
    expect(weekdayOf('2026-01-01')).toBe(4); // Thursday
  });

  test('starts a month in a Monday-first grid', () => {
    expect(firstWeekday('2026-06')).toBe(0); // 1 June 2026 is a Monday
    expect(firstWeekday('2026-10')).toBe(3); // 1 October 2026 is a Thursday
    expect(firstWeekday('2026-11')).toBe(6); // 1 November 2026 is a Sunday
  });
});
