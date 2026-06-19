<!--
  AUDIENCE: Engineers and AI agents working in this repository.
  PURPOSE:  Index of individual future-work proposal files + the anatomy each file must follow.
  LOCATION: docs/planning/proposals/
  NOTE:     The canonical status register and the end-to-end lifecycle live one level up in
            docs/planning/README.md. This folder holds one file per proposal; the source of
            truth for delivered/committed work remains docs/backlog.md.
-->

# Proposals

One file per future-work proposal, named `NNNN-short-slug.md` (zero-padded id, matching the register
in [`../README.md`](../README.md)). A proposal file starts as a **sketch** and is then fleshed out into
a **full detailed design + implementation plan** before (or as the first step of) implementation. The
four-stage lifecycle — **Sketch → Designed → Accepted → Done** — is defined in
[`../README.md`](../README.md); this page is the index plus the file template.

## Index

| # | File | Stage | Backlog item |
|---|---|---|---|
| 0001 | [0001-screenshots-in-test-reports.md](0001-screenshots-in-test-reports.md) | ✅ Done | #12 (ADR-0007) |
| 0002 | [0002-trace-video-capture-on-failure.md](0002-trace-video-capture-on-failure.md) | Accepted (sketch) | #13 |
| 0003 | [0003-cross-browser-run-matrix.md](0003-cross-browser-run-matrix.md) | Accepted (sketch) | #14 |
| 0004 | [0004-accessibility-smoke-checks.md](0004-accessibility-smoke-checks.md) | Proposed (sketch) | — |
| 0005 | [0005-visual-regression-baseline.md](0005-visual-regression-baseline.md) | Proposed (sketch) | — |
| 0006 | [0006-scheduled-freshness-watch.md](0006-scheduled-freshness-watch.md) | Proposed (sketch) | — |
| 0007 | [0007-performance-budget.md](0007-performance-budget.md) | Proposed (sketch) | — |

> Keep this index and the register in [`../README.md`](../README.md) in step whenever a proposal
> changes stage. The register is canonical; this table is the navigational mirror.

## File anatomy

Every proposal file carries the same headed sections. At **sketch** stage the first three are written
and the rest are explicit `_TBD_` placeholders; at **Designed** stage the placeholders are filled in.

```markdown
# Proposal NNNN — <title>

**Stage:** Proposed | Designed | Accepted | Done
**Backlog item:** #N  (or —)
**Rough effort:** <range>
**Provenance:** <where the idea came from>

## Problem
What is wrong or missing now, and who feels it.

## Sketch
The one- or two-line implementation idea — enough to triage, not yet a design.

## Trade-offs and risks
The main cost or coupling. Name any dependency on other work (e.g. the per-scenario
isolation reset in `src/hooks/browser.hooks.ts`, backlog #10).

## Detailed design
_TBD until the proposal reaches the **Designed** stage._
The full design: components touched, configuration model, interfaces, gating.

## Implementation plan
_TBD until the **Designed** stage._
Ordered, checkable steps — each a candidate worklist/loop iteration.

## Validation
_TBD until the **Designed** stage._
How "done" is proven (commands, expected counts, the gate that must stay green).
```

## Advancing a proposal

1. **Sketch → Designed.** Replace the three `_TBD_` sections with a real design, implementation plan,
   and validation approach. Update `Stage:` here and the register in [`../README.md`](../README.md).
2. **Designed → Accepted.** Promote into [`../../backlog.md`](../../backlog.md) as a priority-scored
   `Item #N`; record the backlog number in this file's header and the register. (A proposal may also be
   **Accepted directly from Sketch** when the work is committed before detailed design — as #13/#14 were
   — in which case the detailed design is produced as the opening step of the backlog item.)
3. **Accepted → Done.** Once delivered and merged, set `Stage: Done`; the file remains as the historical
   design record.
