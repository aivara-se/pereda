# 012 - The Assistant Runs On This Machine

## Context

The product promises an assistant that is never the author: it may summarise a day, answer a question about the notes or suggest a line, every word it produces is marked until accepted, and it is off until the person turns it on. The product left the model open, naming what it would do if one over the network were used.

The runtime reaches macOS 26's on-device model: `generate()` with `instructions`, offline, with no key and nothing leaving the computer. `availability()` answers `available`, `unavailable` (Apple Intelligence is off, or the model is still downloading) or `unsupported` (older macOS, a build without model support, or another OS). A model over the network would need a provider, a key, a consent screen and a request path, and it would make the app's no-request promise conditional on a feature ([002](002-local-only-in-v1.md)).

## Decision

- The assistant uses the on-device model and nothing else: no provider, no key, no endpoint, and no network fallback in v1.x.
- One action in this version: summarise the note on screen. The reply appears in a panel, marked as generated on this Mac, and is never written into the note; copying it is the person's own act.
- It is off until the person turns it on, from a menu item; the choice is the app's preference, not the notes database's.
- Availability is checked before the action is offered: `unsupported` removes it, `unavailable` disables it with the reason. The check runs at launch and when the menu opens, because Apple Intelligence can be turned on while the app runs.
- One request at a time, carrying the note on screen and nothing else.

## Consequences

- The assistant exists only on macOS 26 or later with Apple Intelligence on; Windows and Linux ship without it, so the three platforms no longer carry the same features and the product has to say so.
- The app still makes no network request: the model is the operating system's, and a build without it has no assistant rather than a fallback.
- The first text the app produces is read-only: marking is a panel state, there is no accept-into-the-note flow, and "never writes unmarked" holds by not writing at all.
- Questions across the log and suggested lines are not in this version; each needs a retrieval or insertion design this record does not make.
- The app cannot choose a model, a length or a temperature; quality and latency are Apple's, and a slow reply holds the panel, not the editor.
