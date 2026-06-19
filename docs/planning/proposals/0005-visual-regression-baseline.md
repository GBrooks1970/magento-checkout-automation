<!--
  AUDIENCE: Engineers and AI agents working in this repository.
  PURPOSE:  Proposal — visual-regression baseline on the checkout pages.
  LOCATION: docs/planning/proposals/0005-visual-regression-baseline.md
  STAGE:    Proposed (sketch).
-->

# Proposal 0005 — Visual-regression baseline on the checkout pages

**Stage:** Proposed (sketch)
**Backlog item:** —
**Rough effort:** 6–10 h
**Provenance:** Captured as a sketch in `docs/planning/README.md`; surfaced into its own file 2026-06-19.

## Problem

Layout/style regressions in the checkout are invisible to functional assertions.

## Sketch

Capture deterministic screenshots of stable checkout states (masking dynamic regions — order numbers,
dates) and diff against committed baselines (Playwright's `toHaveScreenshot` or a Serenity-archived
comparison). Run only against the pinned, pre-baked store so pixels are stable.

## Trade-offs and risks

Visual baselines are notoriously flaky across fonts/renderers and OS; they need the single pinned image
(`:2.4.8-b<run>`) and a tolerance policy, and they add a baseline-maintenance burden on every intentional
UI change. Highest-effort, lowest-certainty item in the register; depends on **0001's** screenshot
plumbing (now landed as Item #12).

## Detailed design

_TBD until the proposal reaches the **Designed** stage._

## Implementation plan

_TBD until the **Designed** stage._

## Validation

_TBD until the **Designed** stage._
