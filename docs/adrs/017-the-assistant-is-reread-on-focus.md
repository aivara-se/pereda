# 017 - The Assistant's Availability Is Re-read on Focus

## Context

[012](012-the-assistant-runs-on-this-machine.md) reads the assistant's availability at launch and again when the menu opens, because Apple Intelligence can be turned on while the app runs and the menu must stop offering a disabled action once it is.

The runtime builds a menu from the state a set call left and reports a menu click; it reports nothing when a menu opens, and a menu cannot be rebuilt in the moment before it is drawn. The clause was written against a surface the runtime does not have, and no build ever ran it, so nothing shipped depends on it.

The window, by contrast, reports when it regains focus, and that is the moment after a person returns from the Settings that turned the model on.

## Decision

- Availability is read at launch, when the main window regains focus, and again before every request.
- [012](012-the-assistant-runs-on-this-machine.md) stands except for the sentence that the check runs "when the menu opens": that clause stops, and the focus trigger replaces it.

## Consequences

- Turning Apple Intelligence on means leaving the app to do it, and coming back focuses the window and rebuilds the menu, so the common path needs no relaunch.
- A model that finishes downloading while the person stays in Pereda leaves the action disabled until the window loses focus and regains it; a request that arrives anyway is refused in words naming the state, so the reason is never silent.
- Nothing polls and nothing ticks: the trigger is an event the window already reports, and each request re-reads the state it depends on.
