// The calendar, shared by the page and the backend: one date format everywhere.
//
// A day is the machine's local calendar day, written YYYY-MM-DD. A month is
// YYYY-MM. Both sides compare days as strings, which is why the format is
// fixed-width.

const DAY = /^(\d{4})-(\d{2})-(\d{2})$/;
const MONTH = /^(\d{4})-(\d{2})$/;

// Month lengths in a common year, January first.
const LENGTHS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

function pad(value) {
  return String(value).padStart(2, '0');
}

function leap(year) {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

// Days in a month, or 0 when month is not a month.
export function daysInMonth(month) {
  if (typeof month !== 'string') return 0;
  const match = MONTH.exec(month);
  if (match === null) return 0;
  const index = Number(match[2]) - 1;
  if (index < 0 || index > 11) return 0;
  if (index === 1 && leap(Number(match[1]))) return 29;
  return LENGTHS[index];
}

// True when day is a real date written YYYY-MM-DD; a leap day counts only in
// a leap year.
export function validDay(day) {
  if (typeof day !== 'string') return false;
  const match = DAY.exec(day);
  if (match === null) return false;
  const number = Number(match[3]);
  return number >= 1 && number <= daysInMonth(`${match[1]}-${match[2]}`);
}

// True when month is written YYYY-MM and names a calendar month.
export function validMonth(month) {
  return typeof month === 'string' && daysInMonth(month) > 0;
}

// The local calendar day of a Date.
export function localDay(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

// The local calendar day now, read by the backend so the page never guesses.
export function today(date = new Date()) {
  return localDay(date);
}

// The month a day belongs to.
export function monthOf(day) {
  return day.slice(0, 7);
}

// The month after month.
export function nextMonth(month) {
  const year = Number(month.slice(0, 4));
  const index = Number(month.slice(5, 7));
  return index === 12 ? `${year + 1}-01` : `${month.slice(0, 4)}-${pad(index + 1)}`;
}

// The month before month.
export function previousMonth(month) {
  const year = Number(month.slice(0, 4));
  const index = Number(month.slice(5, 7));
  return index === 1 ? `${year - 1}-12` : `${month.slice(0, 4)}-${pad(index - 1)}`;
}

// A day's weekday, 0 for Sunday through 6. Sakamoto's method, so the year 0
// and years before 1900 do not depend on Date's two-digit year rule.
export function weekdayOf(day) {
  const year = Number(day.slice(0, 4));
  const month = Number(day.slice(5, 7));
  const date = Number(day.slice(8, 10));
  const offsets = [0, 3, 2, 5, 0, 3, 5, 1, 4, 6, 2, 4];
  const adjusted = month < 3 ? year - 1 : year;
  return (
    (adjusted +
      Math.floor(adjusted / 4) -
      Math.floor(adjusted / 100) +
      Math.floor(adjusted / 400) +
      offsets[month - 1] +
      date) %
    7
  );
}

// Where a month's first day sits in a Monday-first week: 0 for Monday.
export function firstWeekday(month) {
  return (weekdayOf(`${month}-01`) + 6) % 7;
}

// Refuse a day that cannot be written: an impossible date, or one after
// today. Today and every day before it are open.
export function assertWritableDay(day, current) {
  if (!validDay(day)) throw new Error('That is not a date.');
  if (day > current) throw new Error('A day after today cannot be written.');
}
