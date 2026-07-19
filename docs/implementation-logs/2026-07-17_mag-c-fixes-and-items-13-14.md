# PR #37: MAG-C05..C11 review-derived fixes, and Items #13/#14 — 2026-07-17

## Session Summary

Delivered the review-derived worklist (MAG-C05..C11) from code review v1
(`.review/CODE_REVIEW_CLAUDE_Fable_5_v1_20260706T1048Z/`), then unblocked and implemented the two
remaining backlog items (#13 trace/video capture, #14 cross-browser matrix) once a live Docker
Magento store became available. Ten commits on branch `worklist/mag-c-fixes`, merged as PR #37
(`167be92`). `npm audit` moved from 1 HIGH + 5 moderate to 0 vulnerabilities; the suite gained
trace/video-on-failure capability and a three-engine CI matrix; the CI Serenity-JSON guard was
corrected and strengthened. Chromium (required) is green throughout; Firefox/WebKit carry real,
documented, non-blocking timing drift.

---

## Objectives

1. ✅ Clear the npm audit HIGH finding (MAG-C05).
2. ✅ Reconcile the README Status section with the backlog (MAG-C06).
3. ✅ Confirm the MIT licence metadata already present (MAG-C07).
4. ✅ Raise the Node engines floor to `>=20` (MAG-C08).
5. ✅ Strengthen the CI Serenity-JSON guard to an exact scenario count (MAG-C09).
6. ✅ Fix the dead comment path in `screenshots.ts` (MAG-C10).
7. ✅ Major-bump `@cucumber/cucumber` 11→12, clearing the remaining moderate advisories (MAG-C11).
8. ✅ Deliver backlog Item #14 — cross-browser run matrix (Firefox/WebKit, non-blocking).
9. ✅ Deliver backlog Item #13 — trace + video capture on failure, gated off by default.

---

## Test Results

| Validation | Result | Status |
|---|---|---|
| `npm audit` (start of session) | 1 HIGH (`form-data`), 5 moderate (`uuid` via `@cucumber/*`) | baseline |
| `npm audit` (after MAG-C05) | 0 high/critical, 5 moderate (documented, scheduled for MAG-C11) | ✅ PASS |
| `npm audit` (after MAG-C11) | 0 vulnerabilities | ✅ PASS |
| `npx tsc --noEmit` | Clean throughout all ten commits | ✅ PASS |
| `--profile default --dry-run` / `--profile smoke --dry-run` | 12/12 and 7/7 resolve cleanly after every commit | ✅ PASS |
| CI `test (chromium)` (required) | Green on every commit through the final push (run `29583525308`) | ✅ PASS |
| CI `test (firefox)` | 1 scenario timed out on the live run (add-to-cart success message, 16.9s of a 15s wait) | 🟡 documented drift, non-blocking |
| CI `test (webkit)` | 9+ scenarios timed out across add-to-cart, quantity-input, delete-button, checkout-navigation waits | 🟡 documented drift, non-blocking |
| Live-store `TRACE=on-failure` verification (3 deliberate failures) | 3/3 trace `.zip` + 3/3 video `.webm`, 0 for the 5 passed scenarios | ✅ PASS |
| Live-store cart-isolation re-verification (Item #10) under the new context lifecycle | 12/12 green with `TRACE=on-failure` set on every scenario | ✅ PASS |
| CI Serenity-JSON guard, corrected count | `SERENITY_EXPECTED_SCENARIOS=10` (9 single Scenarios + 1 aggregated Scenario Outline report) — matches `@serenity-js/serenity-bdd`'s one-JSON-per-Outline behaviour, not one-per-example-row | ✅ PASS |

---

## Changes Implemented

### Security / dependencies

- `package-lock.json` — `form-data` 4.0.5 → 4.0.6 (MAG-C05, non-breaking, clears the one HIGH
  advisory).
- `package.json` / `package-lock.json` — `@cucumber/cucumber` 11.3.0 → 12.9.0 (MAG-C11), clearing
  the remaining 5 moderate advisories. `@serenity-js/cucumber@3.43.2`'s peer range already covered
  `^12.0.0`; no Serenity package bump required. `cucumber.js`'s `format: ['@serenity-js/cucumber']`
  array is unchanged — the single-stdout-formatter constraint (PR #19) still holds.

### CI

- `.github/workflows/ci.yml` — added `SERENITY_EXPECTED_SCENARIOS` to the workflow-level `env:`
  block; the guard step now fails on both zero non-empty JSON (the original starved-formatter
  defect class) and any count that does not match the expected value (MAG-C09). Corrected the
  expected value from an initial 12 to the actual 10 after tracing `@serenity-js/core`'s
  `DomainEventQueues.queueIdFor()`, which aggregates every example row of a Scenario Outline into
  one report keyed on the Outline's own `ScenarioDetails`.
- `.github/workflows/ci.yml` — added a `chromium`/`firefox`/`webkit` matrix; Chromium required,
  Firefox/WebKit `continue-on-error: true` (Item #14). Pages artifact upload restricted to the
  Chromium leg only, so one run produces exactly one Pages artifact.

### Application code

- `src/hooks/browser.hooks.ts` — added `resolveBrowserType()` reading a `BROWSER` env var
  (default `chromium`) to select the Playwright engine (Item #14); added the `TRACE=on-failure`
  path: when set, every scenario gets a freshly-created, isolated `BrowserContext`/`Page`
  (`BrowseTheWebWithPlaywright.usingPage`) with tracing and video recording started on it, kept
  only if the scenario fails; when unset, the pre-existing shared-context path (and Item #10's
  cart-isolation reset) is completely unmodified and unreached (Item #13).
- `src/config/screenshots.ts` — corrected the stale comment path from `docs/planning/0001-…` to
  `docs/planning/proposals/0001-screenshots-in-test-reports.md`, matching where PR #33 moved the
  file (MAG-C10, comment-only, no behaviour change).

### Documentation

- `README.md` — "Running the suite" now states the Node 20+ requirement (MAG-C08); "Status"
  section rewritten to no longer claim "All backlog items are closed", instead stating #1–#12
  delivered/green with #13/#14 tracked in the backlog (MAG-C06) — later itself superseded by the
  2026-07-19 TRIAGE-01 update once #13/#14 delivered.
- `package.json` — `engines.node` `>=18` → `>=20` (MAG-C08).

---

## Technical Decisions

| Decision | Rationale | Alternatives rejected |
|---|---|---|
| Trace/video via a per-scenario isolated context, only when `TRACE=on-failure` | The only way to get a per-scenario Playwright video (`recordVideo` is a context-creation-time option) without touching the default shared-context path Item #10's cart-isolation fix depends on | Recording video on the shared context (not supported by the API); always creating isolated contexts (defeats the point of gating, and untested against Item #10 by default) |
| Trace/video artefacts co-located by naming convention, not embedded in the Serenity JSON | `@serenity-js/serenity-bdd@3.43.2`'s `ArtifactArchiver.notifyOf()` only archives `Photo`/`TestReport` artifact instances — no generic binary-artifact type exists for video/trace | Forking or patching the Serenity adapter to add a new artifact type (disproportionate for this item) |
| `SERENITY_EXPECTED_SCENARIOS=10`, not 12 | Empirically confirmed via the guard's own CI history (including its first run, before MAG-14/MAG-13 landed) that `@serenity-js/cucumber` writes one JSON per Scenario Outline regardless of example-row count, not one per row | Keeping 12 and treating the guard's own correct-but-unexpected count as a false-positive failure to work around |
| Firefox/WebKit non-blocking, drift documented not fixed | Diagnosing/tuning engine-specific wait strategies needs a live interactive session against the Magento store, unavailable in this environment; the item's own acceptance criterion ("triaged and either fixed or documented") is satisfied by documenting | Blind-raising all wait ceilings without evidence of the actual root cause |

ADR-0007 (screenshots) already established the "gate report-enrichment by environment, default-off
in CI" pattern; Item #13 follows it directly. No new ADR was required for either #13 or #14 — both
are implementations of already-accepted planning proposals (0002, 0003), not new architectural
decisions.

---

## Documentation Updates

- `README.md` — Status section, Node floor.
- `CHANGELOG.md` — not updated in this PR; done separately as part of the 2026-07-19 TRIAGE-01
  documentation-drift reconciliation (this same commit records that gap explicitly).
- `docs/backlog.md` — MAG-C05's accepted-risk note closed with a dated resolution; Items #13/#14
  resolution text added (their `Status:` fields and the Summary table were **not** flipped in this
  PR — that drift is what TRIAGE-01 fixes on 2026-07-19).
- this log — written retroactively on 2026-07-19 as part of TRIAGE-01, since PR #37 shipped without
  one (review v2 Risk 1 finding).

---

## Lessons Learned

- **A stdout-formatter's per-scenario-vs-per-Outline aggregation behaviour must be verified
  empirically, not assumed.** The `SERENITY_EXPECTED_SCENARIOS=12` guess was reasonable but wrong;
  tracing the adapter's actual queueing logic (and checking the guard's own first CI run) found the
  true invariant (10 JSON files) directly rather than debugging a false "regression".
- **A design item blocked on live-store access should stay `BLOCKED`, not be guessed at.** Item #13
  was correctly held open until a Docker store was available, rather than implementing an unverified
  design against Item #10's isolation-sensitive context lifecycle.
- **Landing a large wave of fixes without an implementation log breaks the append-only evidence
  chain the rest of the repo maintains carefully** — the gap this very log exists to close.

---

## Recommendations / Next Steps

- [ ] Raise a follow-up item for WebKit/Firefox wait-ceiling tuning once a live interactive session
  is available (already tracked as review v2 Risk 3 / worklist TRIAGE-03). — MEDIUM
- [ ] Backfill CHANGELOG entries for Item #12 (screenshots, ADR-0007) and the first review cycle
  (MAG-C01..C04) — an older documentation gap noticed while writing this log, predating PR #37 and
  out of TRIAGE-01's stated scope; raised as a new worklist item rather than folded in here. — LOW

---

*Session logged retroactively: 2026-07-19 (original work: 2026-07-17). Author: Claude, directed by
Gary Brooks, as part of worklist item TRIAGE-01.*
