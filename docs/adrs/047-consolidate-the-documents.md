# 047 - Consolidate the Documents

## Context

[`025`](025-the-app-lives-in-apps-desktop.md) kept `PRODUCT.md`, `SYSTEMS.md` and a root `DESIGN.md` beside `docs/`, and [`018`](018-the-menu-is-where-the-runtime-draws-one.md) placed the Windows menu gap in `PRODUCT.md` and the platform note in `SYSTEMS.md`. Those files restated each other and the records, and the organisation's standard places one fact in one file: the entry point in `README.md`, the specification in `docs/SPEC8N.md`, the visual tokens in `docs/DESIGN.md`, and a decision in an ADR.

## Decision

Product behaviour and system shape live in `docs/SPEC8N.md`; visual tokens live in `docs/DESIGN.md`; a decision lives in its ADR. The root `PRODUCT.md`, `SYSTEMS.md` and `DESIGN.md` are retired. A fact that outgrows the specification becomes an ADR, not a second document.

## Consequences

- [`025`](025-the-app-lives-in-apps-desktop.md)'s "`PRODUCT.md`, `SYSTEMS.md`, `docs/`, `LICENSE` and `.github/` stay at the root" falls: only `docs/`, `LICENSE` and `.github/` stay at the root.
- [`018`](018-the-menu-is-where-the-runtime-draws-one.md)'s "The gap lives with the other edge cases in `PRODUCT.md`" and "`SYSTEMS.md` says which platforms draw the bar" fall; the specification and this record carry them.
- The specification is capped at one page, so a detail that does not change what a reader must do is dropped or becomes an ADR.
- A reader has one place for the product, one for the design, and one per decision.
- Records `000` to `046` still stand; only the file locations above change.
