# 008 - Releases Are Built Here

## Context

[006](006-releases-come-from-the-shared-workflow.md) moved the release build off a person's machine and into `aivara-se/.github`, and had this repository call the shared workflow from `.github/workflows/publish.yml`, pinned at that repository's `main`. [007](007-releases-follow-the-version-file.md) kept that arrangement and changed only the trigger.

The steps are the same for every tinyjs app; the packaging is not. A change to pereda's build — a tinyjs flag, the order the macOS certificate is imported, what an archive holds — had to land in a repository whose workflow every other app's release also runs, so it took effect in their releases too. The alternative was an exception in the shared file naming this repository, filed from a change to this one.

## Decision

Pereda carries its own publish workflow. `.github/workflows/publish.yml` holds the standard's jobs and steps inlined, with this app's packaging in the same file: the three platforms, two macOS architectures, the archive contents and the secrets.

The version in `tinyjs.json` stays the trigger, the tag still waits for every build, and the assets keep their names.

This overrides [006](006-releases-come-from-the-shared-workflow.md), as [007](007-releases-follow-the-version-file.md) kept it:

- Context: "The organisation now carries one shared workflow for this, in `aivara-se/.github`, and this repository calls it from `.github/workflows/publish.yml`."
- Consequences: "The caller pins the shared workflow at that repository's `main`, so a change there changes the build of every release, in this repository too."

Everything else in 006 stands.

## Consequences

- A change to this app's packaging is reviewed here, by the review that needs it, and reaches no other repository.
- The steps exist twice: a fix to them lands here and in the other copy, and drift between the two is silent until someone diffs them. The standard is the account of the steps; this file is checked against it when either moves.
- The standard in `aivara-se/.github` says `tinyjs-publish.yml` is the implementation pereda calls. From here that sentence is wrong for this repository: pereda's copy is the stated exception, and the line is corrected in a change to that repository, not this one.
- A failed release is read here, where the packaging is, rather than in a file this repository does not own.
