<!--
  AUDIENCE: Engineers and AI agents working in this repository.
  PURPOSE:  Proposal — run the suite across Chromium / Firefox / WebKit.
  LOCATION: docs/planning/proposals/0003-cross-browser-run-matrix.md
  STAGE:    Accepted (sketch) — committed as backlog Item #14; detailed design pending.
-->

# Proposal 0003 — Cross-browser run matrix (Firefox / WebKit)

**Stage:** Accepted (sketch) — promoted to the backlog 2026-06-19; detailed design still to be written.
**Backlog item:** #14
**Rough effort:** 4–6 h
**Provenance:** Captured as a sketch in `docs/planning/README.md`; surfaced into its own file 2026-06-19.

## Problem

The suite only ever runs on Chromium. "Works in Chromium" is not "works in the storefront" — Luma's
Knockout.js checkout can behave differently across engines, and Firefox / WebKit users exercise the
same flow in production.

## Sketch

Parameterise the browser launch in `src/hooks/browser.hooks.ts` by a `BROWSER` env var
(`chromium` | `firefox` | `webkit`, default `chromium`) and add a CI matrix dimension over the three
engines. Keep Chromium the **required** gate; run Firefox / WebKit as **non-blocking** matrix legs
first, promoting them to required only once green and stable.

## Trade-offs and risks

Roughly triples CI minutes on the slowest part of the pipeline, and will surface real engine-specific
selector/timing drift that needs triage — budget for the findings, not just the wiring.

## Detailed design

_TBD until the proposal reaches the **Designed** stage (or as the opening step of Item #14)._

## Implementation plan

_TBD until the **Designed** stage._

## Validation

_TBD until the **Designed** stage._ Expected shape: the suite runs under `BROWSER=firefox` and
`BROWSER=webkit` locally; CI runs a three-engine matrix with Chromium required and the other two
non-blocking initially; any drift surfaced is fixed or documented; `tsc` clean.
