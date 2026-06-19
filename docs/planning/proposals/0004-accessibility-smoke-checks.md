<!--
  AUDIENCE: Engineers and AI agents working in this repository.
  PURPOSE:  Proposal — accessibility smoke checks on key checkout pages.
  LOCATION: docs/planning/proposals/0004-accessibility-smoke-checks.md
  STAGE:    Proposed (sketch).
-->

# Proposal 0004 — Accessibility smoke checks on key pages

**Stage:** Proposed (sketch)
**Backlog item:** —
**Rough effort:** 4–8 h
**Provenance:** Captured as a sketch in `docs/planning/README.md`; surfaced into its own file 2026-06-19.

## Problem

A checkout journey is exactly where accessibility failures hurt real users, yet the suite asserts
nothing about a11y.

## Sketch

Run `axe-core` against the storefront, cart, and checkout pages as a small additional Screenplay
question (a `PerformAccessibilityScan` interaction), asserting **no new** critical/serious violations
against a committed baseline (Magento core ships pre-existing ones — gate on regressions, not absolute
zero). Surface the violations as a Serenity artifact.

## Trade-offs and risks

Magento core ships with known a11y issues, so a zero-tolerance gate is unrealistic; a baseline-diff
approach needs the baseline curated and re-reviewed whenever Magento is re-baked.

## Detailed design

_TBD until the proposal reaches the **Designed** stage._

## Implementation plan

_TBD until the **Designed** stage._

## Validation

_TBD until the **Designed** stage._
