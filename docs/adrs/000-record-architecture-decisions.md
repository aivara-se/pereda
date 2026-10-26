# 000 - Record Architecture Decisions

## Context

Pereda is being rebuilt as an Aivara project, and its first documents decide how the app is shaped before any code exists. Those decisions need a home that a later reader can find, and a status that does not depend on someone remembering it.

## Decision

We record one significant architectural decision per file in `docs/adrs`, as Markdown. A decision is **Accepted** when its file is merged into `main`, and **In Review** while its pull request is open. An accepted record is not edited: a decision that contradicts it is a new record that names the clauses it overrides, and the old file stays as the account of what was believed then.

A record cites only ADRs with a lower number. A later decision is not a premise an earlier record can know, and a forward reference makes a record depend on a file written after it.

An ADR is written before the code that depends on it, and it says what the choice costs, not only what it buys.

## Consequences

- The why behind a choice is searchable and outlives the person who made it.
- A reader can tell which decisions are live and which are history.
- A decision that inverts costs a new file rather than a rewrite, so the record keeps its history.
