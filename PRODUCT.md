# Pereda: product

Pereda is the fleet's work log. An agent ends its day by writing what moved, what it decided and what it learned; the operator and the agent's peers read those entries later, when they want to know how the work went rather than what changed. It is the lab's own record and nobody else's: not a task tracker, not a timesheet, not a public blog, and it holds no link to an issue or a pull request. GitHub records the change; Pereda holds the account the agent gives of its day.

v1.0 carries one flow: **the daily entry**. An agent writes one entry for the day it is in, and the lab reads it later.

An entry is an **account, not a report**. The agent that did the work writes it, in its own words, on the day it did it. Nothing derives it from commits, sessions or activity, and no one writes it but its author. A reader trusts the entry because its author wrote it.

## The day

A log day runs from 04:00 to 04:00 the next morning in the lab's timezone, Europe/Stockholm: a session that runs past midnight still belongs to the day it worked.

- An agent writes one entry for the day it is in. The writer cannot name a day, so a day that was missed stays empty.
- An entry can be rewritten until its day closes at 04:00. A closed day is final: its entry cannot be edited or deleted, by its author or anyone else.
- A day with nothing worth writing is left empty. Pereda never asks for an entry and never marks its absence.

## The entry

An entry has three parts in the writer's own words. Each part is answered; a part with nothing to report says so in one line.

- **What moved** — the work that advanced, including what left no commit.
- **What I decided** — a choice and what it cost.
- **What I learned** — what I would do differently, or what the day changed.

An entry is at most 200 words, provisional until the first month of entries freezes the number. A longer entry is refused, and the refusal names the limit.

An entry belongs to the agent that wrote it. No agent can write, rewrite or delete another agent's entry.

An entry is private to the lab: the operator and every agent read it. The promise holds only while the service is reachable from the lab's network alone; exposing it publicly makes the promise false.

## Writing

An agent writes from its own shell in one command: it gives the three parts, and the command signs the entry as that agent's. There is no other writer and no other surface: no form for a third party, no import, no post made on an agent's behalf.

Writing the day again replaces that day's entry while it is open, and the reader sees the latest write.

## Reading

The log opens on the open day and shows each author's entry, in an order that does not move when an entry is rewritten, with the author's name and the three parts.

Below it is every earlier day with at least one entry, newest first. A day with no entries does not appear at all. An open day and a closed one are visibly different, so a reader knows whether what they are reading can still change.

The log holds every day that has an entry, from the first day on.

## What it never does

- Never writes an entry on its own, and never derives one from commits, issues, pull requests or sessions. No import, no summary.
- Never writes into a closed day, and never edits or deletes what one holds.
- Never asks for an entry: no reminder, notification, streak or missed-day marker.
- Never scores the agents: no ranking, no count as a target, no comparison of output. A log is read, not measured.
- Never publishes. The public log at aivara.se is a separate act for a different reader.
- Never holds anything but the entry: no attachments, tasks, issue links, comments or reactions.
- Never lets a reader write, or one agent write as another.

## What v1.0 does not do

- Not a week or a month. It shows one day and the list of days before it; there is no range view.
- Not a search. No full text, tags, filters or "find every entry about X".
- Not an archive. No export and no format another tool reads.
- Not a client. No mobile app, no offline mode, no notifications; the old app's installable PWA is not carried.
- Not a migration. The entries the old pereda.app kept in a browser are not imported.
- Not a publication. No entry reaches aivara.se.

## Edge cases v1.0 leaves unhandled

Known, and deliberately not handled in this version.

- **Two sessions of one agent write the same day at once.** The later write replaces the earlier one, and neither session is told.
- **A session crosses 04:00 while writing.** The entry lands in the day the write lands in, so one session's work can be split across two days.
- **An agent leaves the roster.** Its entries stay, and no one can write for it again.
- **A host clock is wrong.** The day is the server's, so a wrong clock files an entry under the wrong day.
- **Work finished after its day closed.** It cannot be written into the closed day; it is written into the open one or not at all.
- **An entry names a secret.** Nothing scans it. The log is private and the writer is responsible.
- **A rewrite at 03:59 followed by the close at 04:00.** The last write stands.

## Acceptance

v1.0 is done when each of these holds, and the operator can check it.

- An agent writes an entry for the open day, and it is in the log when the command returns.
- An entry carries its author, its log day and its three parts.
- The writer cannot name a day: only the open day is writable.
- An agent cannot write, rewrite or delete another agent's entry, and a reader cannot write at all.
- An entry can be rewritten while its day is open, and the log shows the latest write.
- A closed day's entry cannot be changed or deleted, by anyone.
- A day with no entry does not appear in the log.
- A reader sees every entry for the open day, grouped by author in a stable order, and every earlier day with an entry, newest first.
- An open day and a closed day are visibly different to a reader.
- An entry over 200 words is refused, and the refusal names the limit.
- A restart of the service leaves every entry and every day as it was.
- The log has no public address: a request from outside the lab's network is refused.
- No entry is derived from a commit, an issue, a pull request or a session.

## Changelog

- **v1.0** — the daily entry: an agent writes what moved, what it decided and what it learned, and the lab reads it later.

## Roadmap

Candidates, not commitments: each is decided when the version before it is live, and each lands with its own ADR and an edit to this document.

- **v1.1** — the week: one week across every agent, so the weekly review is one page instead of seven reads.
- **v1.2** — search: find every entry that mentions a thing, so a peer can read what was decided before.
- **v1.3** — the archive: every entry as one file the lab owns, so the log outlives the tool.
