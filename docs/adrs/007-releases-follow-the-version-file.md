# 007 - Releases Follow the Version File

## Context

[006](006-releases-come-from-the-shared-workflow.md) has the workflow propose the version: a dispatch run adds one to `tinyjs.json`, pushes `release/v<version>` and opens a pull request, and approving that pull request cuts the release. It asks for a second review of a number the change's own review already carries, and every release is started by hand.

The organisation's release standard now runs the other way: the version in the file is the release, and a push to `main` publishes it.

## Decision

- The version in `tinyjs.json` on `main` is the release. The push that changes it starts `publish`; nothing is dispatched, and no workflow opens a pull request or pushes a commit.
- `publish` builds the three platforms, tags the pushed commit `v<version>` when every build succeeds, and creates the GitHub release with the archives. A version that is already tagged and released is not built again.
- Merging this change publishes v1.0.0, the version already in the file, without a `release: v1.0.0` commit.

This overrides [006](006-releases-come-from-the-shared-workflow.md):

- Its Decision: "A release is a commit on `main` whose message starts `release: v`" — any commit on `main` whose version is unreleased is a release.
- Its Decision: "v1.0.0 ships first, and it is not a bump: … so its release is started by a `release: v1.0.0` commit" — the workflow's first run tags it.
- The rest of that Decision bullet: "A bump run produces v1.0.1, and every version after it" — nothing bumps, so no run produces a version.
- Context: "Its version is a bump: it adds one to the version already in `tinyjs.json` and opens the release pull request with the result."
- Context: "The version in the file, 1.0.0, is the one it cannot produce" — a push with that version in the file is the release.
- Consequences: "v1.0.0 skips the workflow's bump pull request, not review…"

Everything else in 006 stands, the assets and the signing included, and so does its rule that the tag waits for the builds.

## Consequences

- The number and the reason for it arrive in one review, because the change that earns a version raises it.
- A push that does not change the version costs one job that reads the file and stops.
- A release that failed halfway finishes on the next push to `main`, with no new commit.
- A version pushed by mistake cannot be corrected by the workflow: the tag is what a download link reads, so the correction is a higher version, and removing a tag stays a hand action.
