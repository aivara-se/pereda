# 038 - The Web App Ships With the Release

## Context

[`035`](035-the-web-app-is-a-static-sveltekit-site.md) deployed the site from its own workflow on a push to `main` that changed `apps/website`, `libs/` or the lockfile. The desktop release runs from the version file ([`007`](007-releases-follow-the-version-file.md)): `publish` builds the archives and tags the commit once every build succeeds.

Two workflows on one branch can disagree. A web change reached the site while the apps stayed at the last version; a broken page was red in `validate` but it did not hold the tag, which could publish from the same tree; and knowing what shipped meant reading two runs.

The web app is another platform, like macOS, Windows and Linux.

## Decision

- `publish.yml` is the only workflow on `main`. `.github/workflows/deploy.yml` is deleted.
- The web app is the fourth platform: when the version is unreleased, `publish` builds it at the release's ref with `bun run build:web`, and its build gates the tag with the three desktop builds.
- The site deploys after the release, to GitHub Pages, from the artefact the web job built. `PEREDA_BASE` still names the repository's path until a custom domain is pointed at it ([`035`](035-the-web-app-is-a-static-sveltekit-site.md)).
- The desktop archives stay the release's assets; the Pages artefact belongs to the deploy and is not attached to the release.
- A change to the web app alone ships with the next release, so the site and the apps carry the same version.

## Consequences

- [`007`](007-releases-follow-the-version-file.md)'s "builds the three platforms" now reads four: the web app is the fourth, and its build gates the tag.
- [`035`](035-the-web-app-is-a-static-sveltekit-site.md)'s "The site deploys from a workflow on a push to `main` that changes it" falls. Its reason — one static directory, no server — holds.
- A web-only fix waits for a version bump, and a broken page stops the desktop release too.
- `validate`'s `web` job still builds every pull request; the release adds the gate, not the first signal.
- One workflow and one concurrency group own a release: the site cannot move while the apps stand still.
- A failed deploy leaves the release published and the site at the previous version. Re-running the failed `deploy` job publishes the artefact the run holds while that artefact lives — the Pages artefact is kept for a day — and after that the next release is the fix.
