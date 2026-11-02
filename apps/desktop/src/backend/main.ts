// Pereda's backend: it owns the clock and the notes database, and the page
// reaches them only through the calls below.

import { Database } from "tjs:sqlite";
import path from "tjs:path";
import { openLog, saveDay, searchNotes } from "@pereda/notes/calls.js";
import { openStore } from "@pereda/notes/store.js";
import { writeExport } from "./export.js";
import { SHORTCUT_COMBO, SHORTCUT_ID } from "../shared/shortcut.js";
import {
  ASSISTANT_INSTRUCTIONS,
  assistantUnavailable,
} from "../shared/assistant.js";
import {
  DATA_FOLDER_EVENT,
  SHOW_DATA_FOLDER,
  fileMenus,
} from "../shared/menu.js";

const DB_NAME = "pereda.db";

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
// other than macOS 26 with the model built in is `unsupported`; a request then
// says why in the status line instead of starting a model that is not there.
async function assistantAvailability(app) {
  if (
    app.system.os() !== "macos" ||
    app.macos === undefined ||
    app.macos.ai === undefined
  ) {
    return "unsupported";
  }
  try {
    return await app.macos.ai.availability();
  } catch {
    return "unsupported";
  }
}

// The folder is the backup, so the person has to be able to reach it. The
// backend asks for the path; the page never builds one. Opening it copies
// nothing, and a folder that will not open comes back with its path.
async function openDataFolder(app) {
  let path = "";
  try {
    path = (await app.paths()).data;
    await app.shell.open(path);
    app.push(DATA_FOLDER_EVENT, { path, error: null });
  } catch (error) {
    app.push(DATA_FOLDER_EVENT, { path, error: error.message });
  }
}

// The menu is the app's, so it is built from the backend and its clicks are
// handled here.
export async function onMenu(id, app) {
  if (id === SHOW_DATA_FOLDER) await openDataFolder(app);
}

// One hotkey, while the app runs. The File menu is put up once at launch: it
// does not depend on the model or on a stored preference.
export async function init(app) {
  shortcutRegistration(app);
  await app.menu.set(fileMenus());
}

// A press brings the window forward; the page hears the same press and takes
// the Today path, so the shortcut does what the button does, not a second thing.
export function onHotkey(id, app) {
  if (id === SHORTCUT_ID) app.win.show();
}

export const api = {
  // The three calls are the notes library's, so the checks, the refusals and
  // their sentences are the web app's too. Each one here binds this backend's
  // store; the page still asks for the same names.
  async openLog(params, app) {
    return openLog(await store(app), params);
  },

  async saveDay(params, app) {
    return saveDay(await store(app), params);
  },

  async searchNotes(params, app) {
    return searchNotes(await store(app), params);
  },

  // The export reads every note once and writes one Markdown file per day into
  // the folder the page picked. The body is verbatim and the store is never
  // written; the first failed write stops the run and what came before stays.
  async exportNotes(params, app) {
    const notes = await store(app);
    const folder = params?.folder;
    if (typeof folder !== "string" || folder === "") {
      throw new Error("Choose a folder to export to.");
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

  // One summary at a time, of the note whose button was pressed and nothing
  // else. The reply is text for the page's panel; it is never written to the
  // notes. A machine without the model says why.
  async summariseNote(params, app) {
    const availability = await assistantAvailability(app);
    if (availability !== "available")
      throw new Error(assistantUnavailable(availability));
    const body = params?.body;
    if (typeof body !== "string" || body.trim() === "") {
      throw new Error("There is nothing to summarise.");
    }
    if (generating)
      throw new Error("The assistant is still answering the last note.");
    generating = true;
    let text;
    try {
      text = await app.macos.ai.generate(body, {
        instructions: ASSISTANT_INSTRUCTIONS,
      });
    } catch (error) {
      throw new Error(`The assistant could not answer: ${error.message}`);
    } finally {
      generating = false;
    }
    if (typeof text !== "string" || text.trim() === "") {
      throw new Error("The assistant said nothing.");
    }
    return { text };
  },
};
