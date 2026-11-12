// A day, written for a reader: the date beside the note, the date in a
// sentence and the midnight line's date are the same day.

const SHORT = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

// The day's own date, from its YYYY-MM-DD, without a timezone in the way.
function at(day) {
  return new Date(`${day}T12:00:00`);
}

export function formatShortDay(day) {
  return SHORT.format(at(day));
}

// The midnight line's date: the day and the month, and the year only when the
// two days are in different years, as the desktop writes it.
export function formatNoticeDay(day, today) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    ...(day.slice(0, 4) === today.slice(0, 4) ? {} : { year: "numeric" }),
  }).format(at(day));
}
