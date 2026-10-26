# 004 - Distribution Without an Update Channel

## Context

The app is public and desktop ([PRODUCT](../../PRODUCT.md)): a person downloads it for macOS, Windows or Linux. tinyjs builds on the OS it runs on and can auto-update from a signed manifest, but an update check is a network request, and v1.0 makes none ([002](002-local-only-in-v1.md)). The app `id` determines the data folder, the OS's identity for the app and the identity an update would carry, so it is expensive to change.

## Decision

- The app `id` is `se.aivara.pereda`; the display name is Pereda.
- Each release is built on its own OS with `tinyjs build`: a signed and notarized `.app`, shipped in a `.dmg`, on macOS; a folder with `pereda.exe` on Windows; and a folder plus a tar on Linux.
- v1.0 has no `update` block and does not run `tinyjs publish`. A new version is downloaded from the site and installed over the old one; the `version` in `tinyjs.json` and the About panel are the release.
- macOS builds are signed with a Developer ID and notarized. Windows and Linux builds are unsigned in v1.0; the download page publishes each archive's sha256. A Windows code-signing certificate is an operator decision, not a v1.0 promise.
- The site hosts the builds. There is no package repository and no update manifest.

## Consequences

- Every release is built three times, on three runners. A change that builds on only one OS is not shipped.
- No staged rollout and no automatic security update: a person on an old build stays there until they download. The site is the update channel.
- The `id` cannot change after release without starting every user with an empty data folder, so it is fixed now.
- macOS first install is signed and notarized and opens without a Gatekeeper warning; an unsigned Windows download earns the SmartScreen warning, and the download page says so.
- Adding auto-update later is a network exception and a new decision. It would use tinyjs's signed manifest and would not change the local store.
- Linux ships as a folder and a tar, not a distro package; packaging for a distribution is a separate decision.
