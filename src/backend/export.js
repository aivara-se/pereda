// Export: the notes leave as one Markdown file per day, a readable copy the app
// never reads back.

// Join a folder and a file name without doubling the separator the folder
// already ends with. Windows accepts "/" in paths.
export function join(dir, name) {
  return dir.endsWith('/') || dir.endsWith('\\') ? `${dir}${name}` : `${dir}/${name}`;
}

// Write one file per day, named YYYY-MM-DD.md with the body verbatim. The first
// failure stops the export and reports the day it stopped on and how many files
// were written before it; what is already written stays.
export async function writeExport(days, dir, writeFile) {
  let written = 0;
  for (const { day, body } of days) {
    try {
      await writeFile(join(dir, `${day}.md`), body);
    } catch (error) {
      return { ok: false, day, written, reason: error.message };
    }
    written += 1;
  }
  return { ok: true, written };
}
