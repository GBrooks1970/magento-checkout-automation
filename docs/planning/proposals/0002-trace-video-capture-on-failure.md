<!--
  AUDIENCE: Engineers and AI agents working in this repository.
  PURPOSE:  Proposal — Playwright trace + video capture on failed scenarios.
  LOCATION: docs/planning/proposals/0002-trace-video-capture-on-failure.md
  STAGE:    Accepted (sketch) — committed as backlog Item #13; detailed design pending.
-->

# Proposal 0002 — Trace + video capture on failure

**Stage:** Accepted (sketch) — promoted to the backlog 2026-06-19; detailed design still to be written.
**Backlog item:** #13
**Rough effort:** 2–4 h
**Provenance:** Captured as a sketch in `docs/planning/README.md`; surfaced into its own file 2026-06-19.

## Problem

When a CI scenario fails, the only forensic evidence today is the Serenity narrative and (since
Item #12) a failure screenshot. A single still frame often does not explain a Knockout.js timing
failure — what the page was doing *before* the assertion matters.

## Sketch

Enable Playwright tracing and video on the browser context for failed scenarios
(`browser.newContext({ recordVideo: … })` + `context.tracing.start`), started in the relevant hook and
discarded on pass / archived on fail. Attach the `.zip` trace + `.webm` as Serenity artifacts alongside
the failure screenshot. Gate it exactly as Item #12 gated screenshots — **off by default**, opt-in via
an env var (e.g. `TRACE=on-failure`), and on locally only when explicitly asked (traces are large).

## Trade-offs and risks

Tracing changes the context-creation path, which the per-scenario isolation reset
(`src/hooks/browser.hooks.ts`) is carefully tuned around — see the cart-leak lesson (backlog #10). Any
trace work **must** re-verify isolation, because recreating the context per scenario is exactly what
that code deliberately avoids. This coupling is why it is a separate item, not a rider on #12.

## Detailed design

_TBD until the proposal reaches the **Designed** stage (or as the opening step of Item #13)._

## Implementation plan

_TBD until the **Designed** stage._

## Validation

_TBD until the **Designed** stage._ Expected shape: a deliberately-failed scenario produces a trace +
video attached to the report; the default run captures nothing and is byte-for-byte unchanged; isolation
(Item #10) re-verified green; `tsc` clean; smoke 7/7 and default 12/12 unaffected.
