# 014 - The Data Folder Is One Menu Item

## Context

The product's backup is one sentence: copy the data folder with the app closed, and copy it back to restore. The folder is whatever `app.paths().data` returns — inside `~/Library/Application Support` on macOS, inside `%APPDATA%` on Windows — a path the person is never shown and cannot easily reach.

Today the only way to find it is to ask someone where the app keeps its file. An export is not the answer: [005](005-no-export-in-v1.md) decides there is none, and a copy of the SQLite file is exactly what the backup is.

## Decision

- One menu item, **Show data folder**, opens the operating system's file manager at the data folder.
- The path comes from the backend's `app.paths()`; the page never builds a path.
- The item opens the folder. It does not copy, export, zip, choose a destination or verify anything.
- If the folder cannot be opened, the status line says so and shows the path as selectable text.
- The item arrives with the app's first menu ([012](012-the-assistant-runs-on-this-machine.md)), stores no preference and adds no settings screen.

## Consequences

- The backup promise becomes executable: the person can reach the file the documentation tells them to copy.
- Opening a folder is not a backup, and the label says what it does. "With the app closed" stays the rule, because a copy taken while the app is writing can be torn.
- The app now has a menu. That is a new surface, and this record should be read as "no settings screen", not "no menu": the next item costs nothing to add, which is the risk it accepts.
- Nothing changes about what the app writes: the data folder is still the only place.
