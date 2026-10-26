# 002 - Local-only in v1.x

## Context

The notes are personal and the app is a desktop app ([001](001-a-desktop-app-on-tinyjs.md)). A server would bring accounts, authentication, storage, privacy obligations and a bill, and it would make the app stop working when the connection does. Cloud sync may come later; it must not be the thing that makes v1.x work.

## Decision

v1.x is local-only: no account, no server, no sync and no collaboration. The notes stay in the app's data folder on the machine; the app writes and reads them there. v1.0 makes no network request at all — no telemetry, no crash reporting and no update check. A new version is a download.

Cloud sync is not a v1.x candidate. If it comes, it is a v2 decision that syncs the local store; the local store stays the source of truth and the app still works offline.

## Consequences

- One machine holds the notes. A second machine starts empty; v1.0 has no import or sync, and the data folder is the only way to move them.
- A lost disk loses the notes unless the person backs up the data folder or exports. The export is the readable copy.
- No automatic updates: a security fix reaches a user when they download the new build. The site is the update channel.
- No telemetry and no crash reports: a failure is reported by the person who saw it.
- The app can be checked with the network off, and every request that would exist has to be justified.
- A future sync is a product and architecture decision, not a configuration flag. Adding it must not turn the local app into a client of a service, and it must not make an offline day impossible.
