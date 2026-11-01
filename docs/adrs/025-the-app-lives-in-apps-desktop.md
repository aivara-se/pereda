# 025 - The App Lives in apps/desktop

## Context

Pereda is one tinyjs app, and tinyjs reads the app from the directory it runs in: `tinyjs.json`, `src/`, `assets/`, `test/`, `types/` and `jsconfig.json` sit at one root. With the app at the repository root, the product and system documents, the decisions, the workflows and the license sit inside the app's directory, and every further package has to be told apart from it by name rather than by place. The repository is to hold the app as one package among others, with the root owning the workspace, the documents and the release workflow.

[001](001-a-desktop-app-on-tinyjs.md) decided the app's shape as "a JavaScript backend in `src/backend/main.js`, a page of HTML, CSS and JavaScript in `src/frontend/`", paths the layout now moves.

## Decision

- The repository is a bun workspace. The root `package.json` declares `apps/*` as its workspaces and carries the commands that run the app: `bun run dev`, `bun run build` and `bun test`.
- The desktop app is the workspace `apps/desktop`; `tinyjs.json`, `src/`, `assets/`, `test/`, `types/` and `jsconfig.json` live there, and `tinyjs` runs from that directory.
- `PRODUCT.md`, `SYSTEMS.md`, `docs/`, `LICENSE` and `.github/` stay at the root.
- The release reads the version from `apps/desktop/tinyjs.json`, and its jobs build and package in `apps/desktop`.

This overrides [001](001-a-desktop-app-on-tinyjs.md):

- Its Decision: "a JavaScript backend in `src/backend/main.js`, a page of HTML, CSS and JavaScript in `src/frontend/`" — both paths are now under `apps/desktop`.

## Consequences

- An accepted record whose path starts `src/` is read against `apps/desktop`; the record is history and is not edited.
- A package added later takes a directory under `apps/` and a script at the root, not an entry point beside the app.
- Each CI job that builds or packages the app names `apps/desktop`; a step that forgets it finds no `tinyjs.json` and fails.
- The app is unchanged: the same build, tests and data folder, one directory deeper.
