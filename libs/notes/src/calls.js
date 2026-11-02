// The three calls both surfaces answer: the log, the save and the search. The
// checks, the refusals and their sentences live here once, so the desktop's
// backend and the web app's worker cannot answer the same question two ways.
//
// The store and the day are the caller's: a surface passes the store it opened,
// and the day its clock says.

import {
  addDays,
  assertWritableDay,
  dayQuery,
  today,
  validDay,
} from "./day.js";

// One page of the log, and the first page of a jump.
const PAGE = 30;

// One page of the log: today on the first page, then the days before the oldest
// one loaded, newest first. A day with nothing written is skipped, except today,
// which is the first entry even when it is empty. `from` opens the log at a day
// instead of at today, which is how a search result and a date jump are read.
export function openLog(notes, params, current = today()) {
  const before = params?.before;
  const from = params?.from;
  if (before !== undefined && !validDay(before))
    throw new Error("That is not a date.");
  if (from !== undefined && !validDay(from))
    throw new Error("That is not a date.");

  const upper =
    from === undefined ? (before ?? addDays(current, 1)) : addDays(from, 1);
  const rows = notes.page(upper, PAGE + 1);
  const more = rows.length > PAGE;
  let days = rows.slice(0, PAGE);
  if (before === undefined && from === undefined) {
    const row = notes.day(current);
    const first = row
      ? { day: current, body: row.body, seq: row.seq }
      : { day: current, body: "", seq: 0 };
    days = [first, ...days.filter((entry) => entry.day !== current)];
  }
  return { today: current, days, more };
}

// Save a whole body with the page's counter. An older counter loses the
// comparison in the store and is reported instead of pretending to save.
export function saveDay(notes, params, current = today()) {
  const day = params?.day;
  assertWritableDay(day, current);
  if (typeof params?.body !== "string")
    throw new Error("A note is plain text.");
  if (!Number.isSafeInteger(params?.seq) || params.seq < 1) {
    throw new Error("A save needs a counter.");
  }
  const saved = notes.save(day, params.body, params.seq);
  if (!saved.applied) {
    throw new Error("This note was written somewhere else.");
  }
  return { day, seq: saved.row.seq, today: current };
}

// Search the notes by their words: every word, in any order, each as a prefix,
// newest first. A result is a day and the text around the match. An exact date
// is answered before that rule: the page of the log bounded by the day after
// it, so a result is the log at that day. Today is in the log even when nothing
// is written, so a jump to it lands there and the next keystroke is saved to
// that date, not the newest older one.
export function searchNotes(notes, params, current = today()) {
  if (typeof params?.query !== "string")
    throw new Error("A search needs words.");
  let jump;
  try {
    jump = dayQuery(params.query, current);
  } catch (error) {
    return { refused: error.message };
  }
  if (jump !== null) {
    const rows = notes.page(jump.upper, PAGE + 1);
    const more = rows.length > PAGE;
    let days = rows.slice(0, PAGE);
    if (jump.day === current) {
      const row = notes.day(current);
      if (row === null || row.body === "") {
        days = [
          { day: current, body: "", seq: row === null ? 0 : row.seq },
          ...days.filter((entry) => entry.day !== current),
        ];
      }
    }
    return { jump: { day: jump.day, days, more } };
  }
  return { days: notes.search(params.query, current) };
}
