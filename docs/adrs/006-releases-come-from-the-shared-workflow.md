# 006 - Releases Come From the Shared Workflow

## Context

[004](004-distribution-without-an-update-channel.md) has each release built by hand on each OS and the archives uploaded to the site: a `.dmg` on macOS, a folder on Windows, a folder and a tar on Linux. Three hand builds of one version are three chances to ship a different tree, and a release nobody can rebuild from the tag is a claim rather than an artifact.

The organisation now carries one shared workflow for this, in `aivara-se/.github`, and this repository calls it from `.github/workflows/publish.yml`. It builds all three platforms on GitHub's runners, tags the commit it built and attaches the archives to a GitHub release. It builds with `tinyjs build`; it does not run `tinyjs publish`, so the app still carries no `update` block and still makes no request of its own.

Its version is a bump: it adds one to the version already in `tinyjs.json` and opens the release pull request with the result. The version in the file, 1.0.0, is the one it cannot produce.

## Decision

- A release is a commit on `main` whose message starts `release: v`, tagged `v<version>` with the version read from `tinyjs.json`, holding the builds as assets of a GitHub release. No build is made on a person's machine.
- The assets are `pereda-<version>-macos-arm64.zip` and `pereda-<version>-macos-x86_64.zip`, each holding `Pereda.app`; `pereda-<version>-windows-x86_64.zip`, holding the build folder's contents, with `pereda.exe` and its launcher at the archive root; and `pereda-<version>-linux-x86_64.tar.gz`, holding the Linux build folder's contents. The tag is created only after every build succeeds.
- v1.0.0 ships first, and it is not a bump: the version in `tinyjs.json` is already 1.0.0, so its release is started by a `release: v1.0.0` commit that reaches `main` by pull request, like every other change. A bump run produces v1.0.1, and every version after it.
- macOS is signed with a Developer ID and notarized when the signing and notary secrets are set, and ad-hoc signed when they are not. The release that first ships v1.0 needs them: a macOS build Gatekeeper blocks on another Mac is not a v1.0 build.

This overrides [004](004-distribution-without-an-update-channel.md):

- Its Decision: "shipped in a `.dmg`" — macOS ships a zip per architecture.
- Its Decision: "a folder with `pereda.exe` on Windows" — Windows ships that folder as a zip.
- Its Decision: "macOS builds are signed with a Developer ID and notarized."
- Its Decision: "A new version is downloaded from the site and installed over the old one" — from the release page.
- Its Decision: "The site hosts the builds."
- Its Decision: "the download page publishes each archive's sha256."
- Its Consequences: "The site is the update channel."

## Consequences

- The files live on the release page, so the site has to link them; until it does, v1.0 is reached only through GitHub.
- Nothing publishes a checksum, so a person checking a Windows or Linux archive has none: the sha256 [004](004-distribution-without-an-update-channel.md) promised is a gap this record leaves open.
- A release now needs the signing and notary secrets set before it runs, or the macOS build is the one that gets blocked; the run still publishes it.
- v1.0.0 skips the workflow's bump pull request, not review: `main` admits no commit without one, so the `release: v1.0.0` commit arrives through an ordinary reviewed pull request too.
- The caller pins the shared workflow at that repository's `main`, so a change there changes the build of every release, in this repository too.
