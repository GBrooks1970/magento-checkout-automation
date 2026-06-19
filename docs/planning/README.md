<!--
  AUDIENCE: Engineers and AI agents working in this repository.
  PURPOSE:  Register of future-work proposals + a record of which have been delivered.
  LOCATION: docs/planning/
  NOTE:     The project was closed on 2026-06-19 (terminal handover v16) and then
            reopened the same day to deliver item 0001. On 2026-06-19 items 0002
            and 0003 were also promoted into the backlog (Accepted = #13/#14);
            items 0004-0007 remain proposals, not committed work. The source of
            truth for delivered/committed work is docs/backlog.md.
-->

# Future Work — proposals and delivery record

This folder holds **proposals**, plus a record of which have since been delivered. The project
shipped its bounded scope (one guest-checkout journey, 12 scenarios / 94 steps green, living
documentation published) and was closed on 2026-06-19, then reopened the same day to deliver
**0001 (screenshots in the report)** — now committed as backlog Item #12. On 2026-06-19 **0002 and
0003 were promoted into the backlog** (Items #13 and #14); items 0004–0007 remain improvements a
future maintainer could pick up. **Each proposal lives as its own file under
[`proposals/`](proposals/)** so the thinking is not lost and a sketch can be fleshed out into a full
design in place.

## How a proposal moves from idea to delivered

Each proposal lives as its own file under [`proposals/`](proposals/), named `NNNN-short-slug.md`, and
advances through four stages. **A proposal starts as a sketch and is fleshed out into a full detailed
design + implementation plan before — or as the first step of — implementation.**

1. **Sketch (`Proposed`).** Capture the idea as `proposals/NNNN-slug.md` from the
   [file template](proposals/README.md#file-anatomy): the **Problem**, a one- or two-line **Sketch**,
   and the main **Trade-offs**. The Detailed design / Implementation plan / Validation sections are
   explicit `_TBD_` placeholders. Add a row to the register below and to the
   [`proposals/` index](proposals/README.md).
2. **Detail (`Designed`).** When the proposal is picked up, flesh out the `_TBD_` sections into a full
   **detailed design**, an **ordered implementation plan** (each step a candidate worklist iteration),
   and a **validation** approach. Update the file's `Stage:` and the register.
3. **Accept (`Accepted`).** Promote the proposal into [`../backlog.md`](../backlog.md) as a
   priority-scored `Item #N`; record the backlog number in the file and the register. A proposal may
   also be **Accepted directly from Sketch** when the work is committed before detailed design (as
   #13/#14 were 2026-06-19) — in that case the detailed design is produced as the opening step of the
   backlog item, not skipped.
4. **Deliver (`Done`).** Once implemented and merged, set `Stage: Done`; the file is retained as the
   historical design record (e.g. 0001).

**Status vocabulary:** `Proposed` (sketch captured) → `Designed` (detailed design + implementation
plan written) → `Accepted` (moved into `docs/backlog.md` as committed work) → `Done` (delivered;
retained as the design record). The **register** below is the canonical status list; the
[`proposals/` index](proposals/README.md) mirrors it for navigation, and
[`../backlog.md`](../backlog.md) is the source of truth for committed/delivered work.

## Register

| # | Proposal | Status | File | Rough effort |
|---|---|---|---|---|
| 0001 | Screenshots in the test reports (CI/local configurable) | ✅ **Done** (backlog #12, ADR-0007) | [proposals/0001-…](proposals/0001-screenshots-in-test-reports.md) | 3–5 h |
| 0002 | Trace + video capture on failure (CI debugging) | **Accepted** (backlog #13, 2026-06-19) | [proposals/0002-…](proposals/0002-trace-video-capture-on-failure.md) | 2–4 h |
| 0003 | Cross-browser run matrix (Firefox / WebKit) | **Accepted** (backlog #14, 2026-06-19) | [proposals/0003-…](proposals/0003-cross-browser-run-matrix.md) | 4–6 h |
| 0004 | Accessibility smoke checks on key pages | Proposed | [proposals/0004-…](proposals/0004-accessibility-smoke-checks.md) | 4–8 h |
| 0005 | Visual-regression baseline on the checkout pages | Proposed | [proposals/0005-…](proposals/0005-visual-regression-baseline.md) | 6–10 h |
| 0006 | Scheduled "freshness" CI run + dependency/image drift watch | Proposed | [proposals/0006-…](proposals/0006-scheduled-freshness-watch.md) | 3–5 h |
| 0007 | Performance budget on checkout page loads | Proposed | [proposals/0007-…](proposals/0007-performance-budget.md) | 5–8 h |

The **problem, sketch, and trade-off** for each proposal now live in its file under
[`proposals/`](proposals/) — previously these were inlined in this README. Open a file to read or
extend it; flesh out its `_TBD_` sections to advance it from **Sketch** to **Designed**.
