<!--
  AUDIENCE: Engineers and AI agents working in this repository.
  PURPOSE:  Proposal — performance budget on checkout page loads.
  LOCATION: docs/planning/proposals/0007-performance-budget.md
  STAGE:    Proposed (sketch).
-->

# Proposal 0007 — Performance budget on checkout page loads

**Stage:** Proposed (sketch)
**Backlog item:** —
**Rough effort:** 5–8 h
**Provenance:** Captured as a sketch in `docs/planning/README.md`; surfaced into its own file 2026-06-19.

## Problem

The suite proves the checkout *works*, not that it is *fast*. Cold-store render penalties have already
bitten the test timing (the CI warm-up step exists because of it).

## Sketch

Capture navigation timings (e.g. `page.evaluate(() => performance.timing)` or a CDP performance trace)
for the key page transitions and assert against a generous budget, reported as a Serenity artifact. Run
against the warmed store only, to measure steady-state not cold-start.

## Trade-offs and risks

Performance numbers on a single-container Docker store are not production-representative; the budget
would catch gross regressions only, and must be lenient enough not to flake on a busy CI runner. Document
it as indicative, not a production SLO.

## Detailed design

_TBD until the proposal reaches the **Designed** stage._

## Implementation plan

_TBD until the **Designed** stage._

## Validation

_TBD until the **Designed** stage._
