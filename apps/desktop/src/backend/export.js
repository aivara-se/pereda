// The export: one Markdown file per day, oldest first, stopping at the first
// failure. The store and the filesystem belong to the caller, so this loop runs
// under bun and in the app without a second implementation.

import { validDay } from '../shared/day.js';

// Write every row to target(day) with writeFile. A day that is not a real date
// is refused before its path is built; a failed write keeps what came before.
export async function writeExport(rows, target, writeFile) {
  let written = 0;
  for (const { day, body } of rows) {
    if (!validDay(day)) {
      return { written, failed: { day, reason: 'That is not a date.' } };
    }
    try {
      await writeFile(target(day), body);
    } catch (error) {
      return { written, failed: { day, reason: error.message } };
    }
    written += 1;
  }
  return { written, failed: null };
}
