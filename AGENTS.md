# Agent Instructions

Pereda is a real-time daily note app for the desktop: one note per day, written to disk as it is typed. It is built for one person on one machine, with no account, no server and no network.

This file is the `aivara-se` agent convention: the rules that hold in every repository. Adopt it, do not fork it. It never describes the state of the work — that lives in the documents below.

## Where a fact lives

- `PRODUCT.md` — what the app is, who it serves, what it must not do, what the work is on now, and what would make it done.
- `SYSTEMS.md` — how it is served, built and checked.
- `docs/adrs/` — a decision per file, written before the code it decides.
- `README.md` — how to run it locally.

One fact, one home: link to a document, never restate it.

## House rules

- **Never** add a network call: a request exists only when the person starts a feature that needs one, and no version yet has one.
- **Never** ask for a save: no save button, no dirty state, no "unsaved changes" dialog. The backend confirms every write.
- **Never** let the page reach the database or the filesystem: the backend is the only authority.
- **Never** merge text or write a diff: a save is the whole note, ordered and atomic.
- **Never** delete, recreate or repair the database over the notes: if it cannot be opened, every write is refused and the app names the file.
- **Always** keep a cleared day's tombstone and skip it on read, so a late save cannot resurrect a day the person cleared.
- **Never** put AI output into a note unmarked and unaccepted.
- **Always** record a significant technology choice as an ADR before the code that depends on it lands.

## Tooling

- **Bun runs the scripts.** A script that runs commands is TypeScript, run with `bun run scripts/<name>.ts` — never Python, and a shell script only when it stays a few lines. A command typed at the prompt is not a script.
- **Never** add a second package manager, lockfile, formatter or test runner. The toolchain is the one the repository already declares.
- **Never** report "tests pass", "it builds" or "verified" without the command and the tree it ran against.

## Skills

The organisation's skills live in `aivara-se/.agents/skills` and every agent reads them from there; a repository carries no copy. Each declares a `when-to-use`: open the one that covers the work before starting it.

## Verify before pushing

```bash
bun test        # the store, the search and the day
tinyjs build    # the app for this OS
```

Run the whole sequence and read every result — the last exit code says nothing about the first.

The same commands run in `.github/workflows/validate.yml`, whose job is named `validate`. `SYSTEMS.md` names what these commands cannot reach, and how a release covers it.

## Version Control

- **Branches**: lowercase, hyphens, one per task: `docs/`, `feat/`, `fix/` or `chore/` and a short name — `docs/adopt-agents-config`, `fix-log-timezone`. No uppercase, no underscores, no personal prefixes.
- **Commits**: Conventional Commits, lowercase, single line, no scopes — `type: short description`.
- **Never** commit to `main` directly, and **never** force-push a branch someone else has seen.
- Keep history linear: no merge commits, no empty commits, no work-in-progress commits.
- Commit under your own identity, never another agent's.
- Remote work is a branch plus a pull request: the body says what changed, what was verified and how, and what was left out. Leave the tree clean.
- Request review from the operator (`thani-sh`) alone on a documents-only change, and from one peer agent as well on an implementation one.
