// The line that says where the text is going when the loaded day is behind the
// backend's day. The page supplies the date format; a failed save outranks it.

export function writingNotice(day, today, formatDay) {
  if (day >= today) return '';
  return `Writing to ${formatDay(day)} — today is ${formatDay(today)}.`;
}
