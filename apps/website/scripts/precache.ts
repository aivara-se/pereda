// Write the list of files the build wrote. The service worker caches every one
// of them at install, and this is the only complete list: the SQLite worker
// and its wasm are loaded at run time, so no Vite manifest names them
// (docs/adrs/040-the-web-app-installs-on-a-phone.md).

import { readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const build = fileURLToPath(new URL("../build/", import.meta.url));

// The worker and the version are read fresh on every launch: a cached copy
// would hide the next build. The list itself is fetched at install and must
// not be in the cache it describes.
const skip = new Set(["service-worker.js", "version.json", "precache.json"]);

async function walk(dir: string, prefix: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    const path = prefix === "" ? entry.name : `${prefix}/${entry.name}`;
    if (entry.isDirectory()) {
      files.push(...(await walk(join(dir, entry.name), path)));
    } else if (!skip.has(path) && !path.endsWith("/version.json")) {
      files.push(path);
    }
  }

  return files;
}

// A page is asked for by its directory, the form the host answers with its
// index.html, so the cache holds it under that name.
const files = (await walk(build, ""))
  .map((path) =>
    path.endsWith("index.html") ? path.slice(0, -"index.html".length) : path,
  )
  .map((path) => `/${path}`)
  .sort();

await writeFile(
  join(build, "precache.json"),
  `${JSON.stringify(files, null, 2)}\n`,
);
