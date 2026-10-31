# 016 - Midnight Is Said, Not Taken

## Context

The day rule is deliberate: a window left open across midnight keeps the entry it opened, and Today moves the log. What is missing is any signal that the day changed, so a person typing at 00:10 writes into yesterday without being told, and the note they expect to find under today is not there.

Switching automatically would split a sentence across two notes. A dialog would stop the writing. Creating a note would let a clock begin one, and the product says a note begins with its first character.

## Decision

- While the loaded day is behind the backend's day, the status line says where the text is going: **"Writing to 31 October — today is 1 November."**
- Nothing moves on its own. The caret, the loaded day and the note are the same before and after; the person takes Today by button or by ⌘T ([015](015-keys-and-nothing-to-configure.md)) when they choose.
- The signal is derived, not stored. The save reply already carries the backend's day and now carries `today` as well, so there is no timer, no polling and no new table. A window that sits idle says nothing, because it is writing nothing.
- A save failure replaces the line, because a save that did not happen outranks a date notice. The line returns with the next successful save while the day is still behind.

## Consequences

- The rule stays and the surprise goes: a person can still write into yesterday, and now knows it while they do.
- The status line carries three states — saved, failed, and behind the day — and failure wins. That precedence is the whole design, and it has to be written down or the first bug will be a notice that hides a lost save.
- A clock that moves backwards makes the loaded day ahead of today; the store already refuses a save to a future day, in words, and this record leaves that refusal as it is.
- No new write path and no stored state: the line is text in the page until the person moves.
