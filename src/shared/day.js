// The calendar, shared by the page and the backend: one date format everywhere.
//
// A day is the machine's local calendar day, written YYYY-MM-DD. Both sides
// compare days as strings, which is why the format is fixed-width.

const DAY = /^(\d{4})-(\d{2})-(\d{2})$/;

// Month lengths in a common year, January first.
const LENGTHS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

function pad(value) {
  return String(value).padStart(2, '0');
}

function leap(year) {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

function daysInMonth(year, month) {
  if (month < 1 || month > 12) return 0;
  if (month === 2 && leap(year)) return 29;
  return LENGTHS[month - 1];
}

// True when day is a real date written YYYY-MM-DD; a leap day counts only in
// a leap year.
export function validDay(day) {
  if (typeof day !== 'string') return false;
  const match = DAY.exec(day);
  if (match === null) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const date = Number(match[3]);
  return date >= 1 && date <= daysInMonth(year, month);
}

// The local calendar day of a Date.
export function localDay(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

// The local calendar day now, read by the backend so the page never guesses.
export function today(date = new Date()) {
  return localDay(date);
}

// Move a day forward or back, across months, years and leap days. UTC keeps the
// arithmetic away from daylight saving.
export function addDays(day, delta) {
  const year = Number(day.slice(0, 4));
  const month = Number(day.slice(5, 7));
  const date = Number(day.slice(8, 10));
  const moved = new Date(Date.UTC(year, month - 1, date + delta));
  return `${moved.getUTCFullYear()}-${pad(moved.getUTCMonth() + 1)}-${pad(moved.getUTCDate())}`;
}

// Refuse a day that cannot be written: an impossible date, or one after
// today. Today and every day before it are open.
export function assertWritableDay(day, current) {
  if (!validDay(day)) throw new Error('That is not a date.');
  if (day > current) throw new Error('A day after today cannot be written.');
}

// The day a search field is asking for, or null when the text is not one.
// Only an exact YYYY-MM-DD that names a real day is a date; a day after today
// is refused, and every other string stays a query.
export function dayQuery(query, current) {
  if (!validDay(query)) return null;
  if (query > current) throw new Error('A day after today cannot be opened.');
  return { day: query, upper: addDays(query, 1) };
}
