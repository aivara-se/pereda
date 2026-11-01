// Pereda's backend: it owns the clock and the notes database, and the page
// reaches them only through the calls below.

import { Database } from 'tjs:sqlite';
import path from 'tjs:path';
import { openStore } from './store.js';
import { writeExport } from './export.js';
import { addDays, assertWritableDay, dayQuery, today, validDay } from '../shared/day.js';
import { SHORTCUT_COMBO, SHORTCUT_ID } from '../shared/shortcut.js';
import {
  ASSISTANT_EVENT,
  ASSISTANT_INSTRUCTIONS,
  ASSISTANT_PREF,
  ASSISTANT_SUMMARISE,
  ASSISTANT_TOGGLE,
  assistantMenus,
  assistantUnavailable,
} from '../shared/assistant.js';
import { DATA_FOLDER_EVENT, SHOW_DATA_FOLDER, fileMenus } from '../shared/menu.js';

const DB_NAME = 'pereda.db';
const PAGE = 30;

// The store is opened once and shared by every call, so a database that cannot
// be opened reports the same reason to each of them for the life of the app.
let opening = null;

function store(app) {
  if (opening === null) {
    opening = (async () => {
      const { data } = await app.paths();
      return openStore(`${data}/${DB_NAME}`, (path) => new Database(path));
    })();
  }
  return opening;
}

// The shortcut is asked for once for the life of the process: init asks at
// launch, and a page that asks first still gets the same answer.
let registering = null;

async function registerShortcut(app) {
  const { globalHotkeys } = await app.system.capabilities();
  if (globalHotkeys === false) return false;
  return app.hotkey.register(SHORTCUT_ID, SHORTCUT_COMBO);
}

function shortcutRegistration(app) {
  if (registering === null) registering = registerShortcut(app);
  return registering;
}

// One request at a time, for the life of the process.
let generating = false;

// The OS model, read through the only door the runtime has for it. Anything
// other than macOS 26 with the model built in is `unsupported`, which removes
// the assistant rather than offering an action that cannot work.
async function assistantAvailability(app) {
  if (app.system.os() !== 'macos' || app.macos === undefined || app.macos.ai === undefined) {
    return 'unsupported';
  }
  try {
    return await app.macos.ai.availability();
  } catch {
    return 'unsupported';
  }
}

// The switch is the app's preference and defaults to off. It is read on every
// menu build and before every request, so a stale menu cannot start a model
// the person has since turned off.
async function assistantState(app) {
  const availability = await assistantAvailability(app);
  if (availability === 'unsupported') return { availability, enabled: false };
  return { availability, enabled: (await app.store.get(ASSISTANT_PREF)) === true };
}

async function setAppMenus(app) {
  const { availability, enabled } = await assistantState(app);
  await app.menu.set([...assistantMenus(availability, enabled), ...fileMenus()]);
}

// The folder is the backup, so the person has to be able to reach it. The
// backend asks for the path; the page never builds one. Opening it copies
// nothing, and a folder that will not open comes back with its path.
async function openDataFolder(app) {
  let path = '';
  try {
    path = (await app.paths()).data;
    await app.shell.open(path);
    app.push(DATA_FOLDER_EVENT, { path, error: null });
  } catch (error) {
    app.push(DATA_FOLDER_EVENT, { path, error: error.message });
  }
}

// The menu is the app's, so it is built from the backend and its clicks are
// handled here. A summary needs the note the page holds, so that one click is
// pushed to the page.
export async function onMenu(id, app) {
  if (id === ASSISTANT_TOGGLE) {
    const { enabled } = await assistantState(app);
    await app.store.set(ASSISTANT_PREF, !enabled);
    await setAppMenus(app);
    return;
  }
  if (id === ASSISTANT_SUMMARISE) {
    app.push(ASSISTANT_EVENT);
    return;
  }
  if (id === SHOW_DATA_FOLDER) await openDataFolder(app);
}

// One hotkey, while the app runs. The assistant's menu is put up at launch,
// whether or not the model is ready; a window that regains focus rebuilds it.
export async function init(app) {
  shortcutRegistration(app);
  await setAppMenus(app);
}

// Apple Intelligence can be turned on while the app runs. The runtime has no
// menu-open event; a window that regains focus rebuilds the menu before the
// next open, which is the closest moment there is.
export function onWindowState(info, app) {
  if (info.focused && info.win === 'main') setAppMenus(app);
}

// A press brings the window forward; the page hears the same press and takes
// the Today path, so the shortcut does what the button does, not a second thing.
export function onHotkey(id, app) {
  if (id === SHORTCUT_ID) app.win.show();
}

export const api = {
  // One page of the log: today on the first page, then the days before the
  // oldest one loaded, newest first. A day with nothing written is skipped,
  // except today, which is the first entry even when it is empty. `from` opens
  // the log at a day instead of at today, which is how a search result is read.
  async openLog(params, app) {
    const notes = await store(app);
    const current = today();
    const before = params?.before;
    const from = params?.from;
    if (before !== undefined && !validDay(before)) throw new Error('That is not a date.');
    if (from !== undefined && !validDay(from)) throw new Error('That is not a date.');

    const upper = from === undefined ? (before ?? addDays(current, 1)) : addDays(from, 1);
    const rows = notes.page(upper, PAGE + 1);
    const more = rows.length > PAGE;
    let days = rows.slice(0, PAGE);
    if (before === undefined && from === undefined) {
      const row = notes.day(current);
      const first = row
        ? { day: current, body: row.body, seq: row.seq }
        : { day: current, body: '', seq: 0 };
      days = [first, ...days.filter((entry) => entry.day !== current)];
    }
    return { today: current, days, more };
  },

  // Save a whole body with the page's counter. An older counter loses the
  // comparison in the store and is reported instead of pretending to save.
  async saveDay(params, app) {
    const notes = await store(app);
    const current = today();
    const day = params?.day;
    assertWritableDay(day, current);
    if (typeof params?.body !== 'string') throw new Error('A note is plain text.');
    if (!Number.isSafeInteger(params?.seq) || params.seq < 1) {
      throw new Error('A save needs a counter.');
    }
    const saved = notes.save(day, params.body, params.seq);
    if (!saved.applied) {
      throw new Error('This note was written somewhere else.');
    }
    return { day, seq: saved.row.seq, today: current };
  },

  // Search the notes by their words: every word, in any order, each as a
  // prefix, newest first. A result is a day and the text around the match.
  // An exact date is answered before that rule: the page of the log bounded
  // by the day after it, so a result is the log at that day.
  async searchNotes(params, app) {
    const notes = await store(app);
    if (typeof params?.query !== 'string') throw new Error('A search needs words.');
    const current = today();
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
      // Today is in the log even when nothing is written. A jump to it must
      // land there, not on the newest older day, or the next keystroke would
      // be saved to the wrong date.
      if (jump.day === current) {
        const row = notes.day(current);
        if (row === null || row.body === '') {
          days = [
            { day: current, body: '', seq: row === null ? 0 : row.seq },
            ...days.filter((entry) => entry.day !== current),
          ];
        }
      }
      return { jump: { day: jump.day, days, more } };
    }
    return { days: notes.search(params.query, current) };
  },

  // The export reads every note once and writes one Markdown file per day into
  // the folder the page picked. The body is verbatim and the store is never
  // written; the first failed write stops the run and what came before stays.
  async exportNotes(params, app) {
    const notes = await store(app);
    const folder = params?.folder;
    if (typeof folder !== 'string' || folder === '') {
      throw new Error('Choose a folder to export to.');
    }
    const result = await writeExport(
      notes.all(),
      (day) => path.join(folder, `${day}.md`),
      tjs.writeFile,
    );
    return { folder, ...result };
  },

  // Whether the system gave the app its shortcut, so the page can say a missing
  // one once and work on without it. A registration that failed to answer is
  // the same answer as a refusal: no shortcut.
  async readShortcut(params, app) {
    return { registered: await shortcutRegistration(app).catch(() => false) };
  },

  // One summary at a time, of the note on screen and nothing else. The reply
  // is text for the page's panel; it is never written to the notes.
  async summariseNote(params, app) {
    const { availability, enabled } = await assistantState(app);
    if (availability === 'unsupported' || availability === 'unavailable') {
      throw new Error(assistantUnavailable(availability));
    }
    if (!enabled) throw new Error('The assistant is off.');
    const body = params?.body;
    if (typeof body !== 'string' || body.trim() === '') {
      throw new Error('There is nothing to summarise.');
    }
    if (generating) throw new Error('The assistant is still answering the last note.');
    generating = true;
    let text;
    try {
      text = await app.macos.ai.generate(body, { instructions: ASSISTANT_INSTRUCTIONS });
    } catch (error) {
      throw new Error(`The assistant could not answer: ${error.message}`);
    } finally {
      generating = false;
    }
    if (typeof text !== 'string' || text.trim() === '') {
      throw new Error('The assistant said nothing.');
    }
    return { text };
  },
};
