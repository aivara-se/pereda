// A day, written for a reader: the date beside the note and the date in a
// sentence are the same day, and the log's dates are the short form.

const LONG = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const SHORT = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
});

// The day's own date, from its YYYY-MM-DD, without a timezone in the way.
function at(day) {
  return new Date(`${day}T12:00:00`);
}

export function formatDay(day) {
  return LONG.format(at(day));
}

export function formatShortDay(day) {
  return SHORT.format(at(day));
}
