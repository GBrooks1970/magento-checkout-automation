<!--
  AUDIENCE: Engineers and AI agents working in this repository.
  PURPOSE:  Proposal — scheduled "freshness" CI run + dependency/image drift watch.
  LOCATION: docs/planning/proposals/0006-scheduled-freshness-watch.md
  STAGE:    Proposed (sketch).
-->

# Proposal 0006 — Scheduled "freshness" CI run + dependency/image drift watch

**Stage:** Proposed (sketch)
**Backlog item:** —
**Rough effort:** 3–5 h
**Provenance:** Captured as a sketch in `docs/planning/README.md`; surfaced into its own file 2026-06-19.

## Problem

The project carries pinned dependencies and a pinned GHCR bake (`:2.4.8-b24`). Pins silently rot: an
image gets pruned, a transitive dep gets a CVE, GitHub Actions versions deprecate. The terminal
handover's "if reopened, check these first" list is exactly what a schedule could check automatically.

## Sketch

A scheduled (`cron`) GitHub Actions workflow that re-runs the suite on `main` weekly and runs
`npm audit` + a check that the pinned GHCR images still pull, opening an issue on failure. Keeps the
green badge **honestly** green rather than green-as-of-last-merge.

## Trade-offs and risks

A scheduled job needs an owner for the issues it raises, otherwise it just generates noise. Cheap to
build; only worth it if someone watches it.

## Detailed design

_TBD until the proposal reaches the **Designed** stage._

## Implementation plan

_TBD until the **Designed** stage._

## Validation

_TBD until the **Designed** stage._
