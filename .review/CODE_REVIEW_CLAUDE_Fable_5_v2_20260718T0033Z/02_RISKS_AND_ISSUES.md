# Risks and Issues

[<- Back to Index](00_CODE_REVIEW_CLAUDE_Fable_5_v2_20260718T0033Z.md) | [Next: Project Reviews ->](03_PROJECT_REVIEWS/PROJECT_001_Checkout_Automation_Suite.md)

**Reviewer:** AI assistant (CLAUDE Fable 5)
**Date:** 2026-07-18T00:33Z

Risks are numbered high to low. No HIGH-severity findings: the suite, CI, and security posture
are sound. The top findings are documentation-coherence and CI-policy issues.

Status of the six v1 risks (2026-07-06): all resolved on `main` - v1 Risk 1 (audit) by
MAG-C05/MAG-C11 (`npm audit` now 0 vulnerabilities, verified this review); v1 Risk 2
(README/backlog drift) by MAG-C06 - but see Risk 1 below for its regression; v1 Risk 3
(licence) by PR #36 (MIT in [LICENSE](LICENSE) and [package.json](package.json) (line 5));
v1 Risk 4 (Node 18 engines floor) by MAG-C08 ([package.json](package.json) (line 7));
v1 Risk 5 (existence-only Serenity guard) by MAG-C09
([.github/workflows/ci.yml](.github/workflows/ci.yml) (lines 256-301)); v1 Risk 6 (stale
comment path) by MAG-C10 ([src/config/screenshots.ts](src/config/screenshots.ts) (line 14)).

---

## Risk 1 (MEDIUM): Post-PR #37 documentation drift - the backlog is internally contradictory and README/CHANGELOG/registry tell yesterday's story

**Risk Description:**
PR #37 (merged 2026-07-17, `167be92`) delivered backlog items #13 and #14 and the MAG-C05..C11
worklist, but the documentation reconciliation that should have accompanied it is only half done.
The backlog's item bodies record #13 and #14 as resolved with detailed live-store evidence, while
every summary surface still reports them outstanding. This is the third occurrence of the
project's most persistent failure mode (previously fixed as MAG-C02 header drift and MAG-C06
README drift), and this time the drift regressed within the same PR that did the work.

**Evidence Outline:**
- [docs/backlog.md](docs/backlog.md) (line 627): item #13 heading reads "Resolved 2026-07-17",
  yet line 635 still reads "**Status:** READY TO START".
- [docs/backlog.md](docs/backlog.md) (line 691): item #14 heading reads "Resolved 2026-07-17
  (drift documented, not fixed)", yet line 698 still reads "**Status:** READY TO START".
- [docs/backlog.md](docs/backlog.md) (lines 753-755): the Summary table lists "#13 (11) READY"
  and "#14 (15) READY" and counts "**Outstanding** | **2**".
- [docs/backlog.md](docs/backlog.md) (lines 12-13): header still "Version: 4 ... Last Updated:
  2026-06-22", despite substantive 2026-07-17 update notes at lines 24-56 and the #13/#14
  resolutions - the exact header-vs-body drift MAG-C02 fixed before.
- [README.md](README.md) (lines 189-191): "Items **#13** ... and **#14** ... remain outstanding".
- [CHANGELOG.md](CHANGELOG.md) (lines 10-69): the Unreleased section ends at the 2026-07-14 MIT
  licence entry; none of the 2026-07-17 wave (Cucumber 11->12 major bump, engines floor,
  scenario-count guard, trace/video capture, cross-browser matrix - nine commits) is recorded,
  despite the file's own rule that notable changes must be documented.
- [docs/implementation-logs/](docs/implementation-logs/): the latest log is
  `2026-07-14_p04-mit-licence-alignment.md`; no implementation log exists for PR #37, the
  largest change wave since June, breaking the portfolio convention of a log per dev task.
- Portfolio registry ([portfolio-prompts/README.md](../../portfolio-prompts/README.md) (line 33),
  outside this repo): "Backlog items #13 and #14 remain open; ... latest handover v18" - also
  stale against this repo's `main`.

**Impact Analysis:**
- A hiring manager or reviewer reading README/CHANGELOG concludes work is outstanding that is in
  fact done - the project undersells itself and, worse, demonstrates the drift habit the
  portfolio's own reviews keep flagging as its recurring cross-project theme.
- The backlog is the portfolio's declared source of truth; while it self-contradicts
  (heading vs Status vs Summary), downstream tooling (derive-worklist, resume-session,
  portfolio-status) can pick whichever signal it reads first and plan phantom work.
- The missing implementation log breaks the append-only evidence chain that the rest of the repo
  maintains carefully.

**Refactor Recommendation and Strategy:**
1. One docs-only PR: set backlog header to Version 5 / Last Updated 2026-07-17+, flip the #13/#14
   Status fields to DONE, update the Summary table to 0 outstanding, refresh README Status,
   append CHANGELOG entries for the PR #36/#37 waves, and write the missing implementation log
   for PR #37.
2. Update the registry row (in `portfolio-prompts/registry.yml`, then re-render) once (1) merges.
3. Process fix: make "Summary table, header, README Status, CHANGELOG, implementation log"
   an explicit checklist item in the loop-worklist closing step, since item-body updates
   demonstrably happen while summary surfaces get missed.

---

## Risk 2 (MEDIUM): On a failing run, the empty-shell guard is skipped but the report is still rendered, uploaded, and deployed - the guard does not protect the publish path

**Risk Description:**
The MAG-C09 guard asserts that `docs/reports/` contains exactly `SERENITY_EXPECTED_SCENARIOS`
non-empty JSON files, specifically to prevent republishing the empty-shell report (the 2026-06-08
to 2026-06-11 incident). But the guard step has no `if:` condition, so when `npm test` fails, the
guard is *skipped* under GitHub Actions' default behaviour - while the subsequent render step
runs `if: always()`, the Pages artifact upload runs `if: always() && matrix.browser ==
'chromium'`, and the `deploy-pages` job runs on `main` under `always()`. A run that fails before
or while writing Serenity JSON (for example `MagentoApi.authenticate()` throwing in `BeforeAll`,
a store bring-up that passes healthchecks but breaks mid-suite, or a recurrence of the starved-
formatter defect itself) would render a zero- or partial-scenario report and deploy it over the
live populated one. The publish-on-failure policy documented in the README is intentional for
*failing scenarios*; it was never meant to cover *absent data* - yet the pipeline cannot
currently tell the two apart on the failure path.

**Evidence Outline:**
- [.github/workflows/ci.yml](.github/workflows/ci.yml) (lines 256-301): guard step, no `if:`.
- [.github/workflows/ci.yml](.github/workflows/ci.yml) (lines 303-308): "Generate Serenity living
  documentation" with `if: always()`.
- [.github/workflows/ci.yml](.github/workflows/ci.yml) (lines 310-322): "Upload Pages artifact"
  with `if: always() && matrix.browser == 'chromium'`.
- [.github/workflows/ci.yml](.github/workflows/ci.yml) (lines 333-340): `deploy-pages` gated only
  on `main` + images-available + `always()`.
- [README.md](README.md) (lines 158-164): documents publish-on-failure as showing "failing
  scenarios in the published report" - i.e. populated data, not an empty shell.

**Impact Analysis:**
- The flagship portfolio artefact (the live living-documentation site) can regress to the exact
  empty-shell state the project spent PRs #18/#19 and MAG-C09 defending against, triggered by any
  infrastructure-level failure on `main`.
- Because the deploy succeeds, nothing on the Pages side signals the regression; only the red
  badge hints something is wrong, and the README explicitly tells readers a red badge with a
  published report is expected behaviour.

**Refactor Recommendation and Strategy:**
1. Give the guard `if: always()` so it runs (and fails visibly) even after a test failure, and
   record its outcome: `id: serenity-guard`.
2. Condition the render and upload steps on data actually existing:
   `if: always() && steps.serenity-guard.outcome == 'success'` - a failing *suite* with complete
   JSON still publishes (preserving the documented policy), while a run with missing JSON never
   reaches Pages.
3. Optional refinement: on scenario failures the JSON count still matches (failed scenarios still
   emit reports), so no relaxation of the exact-count assertion is needed; document this in the
   guard comment.

---

## Risk 3 (MEDIUM): The WebKit matrix leg is pervasively red with no tracked follow-up item, and non-blocking legs triple CI cost indefinitely

**Risk Description:**
Backlog #14 was closed as "drift documented, not fixed": on PR #37's CI run, Firefox failed one
scenario (add-to-cart success-message wait exceeded by ~2s) and WebKit timed out in 9+ scenarios
across add-to-cart, quantity, delete, and checkout-navigation waits. The resolution narrative
names a follow-up ("a future item should either raise WebKit-specific timeouts or investigate
why WebKit settles slower, before promoting it out of non-blocking") - but no backlog item
carries it. The follow-up exists only inside the resolution prose of a closed item, the exact
place future planning passes will not look. Meanwhile each push now performs three full store
bring-ups (~15-25 min each), two of which are currently guaranteed or likely to end red.

**Evidence Outline:**
- [docs/backlog.md](docs/backlog.md) (lines 722-732): the drift findings and the untracked
  follow-up sentence.
- [.github/workflows/ci.yml](.github/workflows/ci.yml) (lines 139-151): matrix over
  `[chromium, firefox, webkit]`, `continue-on-error: ${{ matrix.browser != 'chromium' }}`,
  with the "roughly triples CI minutes - the documented, accepted trade-off" comment.
- [docs/backlog.md](docs/backlog.md) (lines 753-755): the Summary table (see Risk 1) does not
  list any WebKit follow-up item; the outstanding count is wrong in the other direction too.
- Wait ceilings tuned for Chromium against this store: e.g.
  [src/tasks/AddToCart.ts](src/tasks/AddToCart.ts) (line 17) 15s,
  [src/tasks/ProvideShippingDetails.ts](src/tasks/ProvideShippingDetails.ts) (lines 35-42) 20s.

**Impact Analysis:**
- A permanently red-but-ignored leg trains maintainers to ignore the matrix, eroding the value
  the item was meant to add; promotion to required has no tracked path.
- Roughly 30-50 wasted runner-minutes per push on legs whose outcome is already known, with no
  scheduled review point.
- The untracked follow-up is precisely the "planned-but-unimplemented coverage" pattern this
  review series is required to police.

**Refactor Recommendation and Strategy:**
1. Raise a backlog item #15: triage WebKit timing (either engine-conditional wait ceilings, e.g.
   a multiplier read from `BROWSER`, or a diagnosis of the storefront's WebKit rendering), with
   promotion-to-required criteria for both non-Chromium legs.
2. Until #15 lands, cut the cost: run Firefox/WebKit legs on a schedule or `workflow_dispatch`
   only (or only on `main`, not PRs) so PRs pay for one bring-up, not three.
3. Record the decision in the backlog either way - "accepted red leg on every push" should be a
   documented choice, not an emergent state.

---

## Risk 4 (MEDIUM-LOW): The registry-recorded validation gate (`npm run verify`) does not exist in this repository

**Risk Description:**
The portfolio registry row for this project records `Gates: npm run verify`, and the portfolio
layout contract resolves validation gates through that row. But `package.json` defines only
`test`, `test:smoke`, and `test:report` scripts - there is no `verify` script. Any agent or
maintainer following the documented gate cascade hits a missing script and must fall back to
guessing stack defaults. (This review ran `npx tsc --noEmit`, `npm audit`, and both profile
dry-runs as the stack-default lightweight gates.)

**Evidence Outline:**
- [portfolio-prompts/README.md](../../portfolio-prompts/README.md) (line 33): "Gates:
  `npm run verify`." (generated from `registry.yml`).
- [package.json](package.json) (lines 9-13): scripts `test`, `test:smoke`, `test:report` only.

**Impact Analysis:**
- The single most-automated touchpoint (gate resolution) silently fails for this project;
  orchestration prompts that trust the registry will report a broken gate or skip validation.
- A fresh contributor cannot discover the intended pre-commit check.

**Refactor Recommendation and Strategy:**
1. Preferred: add a `verify` script that matches what is actually runnable without the store,
   e.g. `"verify": "tsc --noEmit && cucumber-js --profile default --dry-run && cucumber-js
   --profile smoke --dry-run"` - typecheck plus binding verification, cheap and store-free.
2. Alternatively, correct `registry.yml` to record the real gates (`npx tsc --noEmit`; full
   E2E via docker compose + `npm test` where a store is available) and re-render the table.
3. Either way, note the store-dependent full gate explicitly so nobody mistakes the light gate
   for E2E evidence.

---

## Risk 5 (LOW): Release hygiene - `package.json` claims 1.0.0 but the CHANGELOG has never cut a release past 0.3.0

**Risk Description:**
[package.json](package.json) (line 3) declares `"version": "1.0.0"`, but
[CHANGELOG.md](CHANGELOG.md) (line 73) shows the last released section as `[0.3.0] - 2026-06-02`;
everything since - the entire delivered backlog #1-#14, CI, licence - sits in a six-week
`[Unreleased]` block (lines 10-69, and growing; see also Risk 1 for the missing entries). The
project states adherence to Semantic Versioning (line 6) but its two version signals disagree
and no release has ever been tagged.

**Evidence Outline:** as above.

**Impact Analysis:** Cosmetic for a test-automation portfolio (nothing consumes the package),
but it contradicts the file's own stated conventions, and the giant Unreleased block loses the
"what shipped when" narrative that CHANGELOGs exist for.

**Refactor Recommendation and Strategy:** Cut a `[1.0.0]` section dated at the original
close-out (2026-06-19, "all 12 items delivered") or at the next docs PR, moving the Unreleased
content under it; start `[1.1.0]` for the #13/#14 wave. One-time, docs-only.

---

## Risk 6 (LOW): Carried-over minor items - hard-coded product slug map; Chromium-tuned wait ceilings

**Risk Description and Evidence:**
- The product-name-to-URL-slug map in
  [src/interactions/StorefrontPage.ts](src/interactions/StorefrontPage.ts) (lines 4-7) remains
  hard-coded for the two Luma products. It fails loudly with a clear message on an unknown name
  (lines 10-14), which is acceptable, but the API client already knows how to resolve products -
  the `url_key` attribute could remove the duplication if a third product ever arrives.
- Every explicit wait ceiling (15-20s) encodes Chromium-against-this-store timing; Risk 3's
  WebKit findings show they are not engine-portable. Kept LOW because the values are
  centralisable (a `CHECKOUT_RENDER` constant already exists in
  [src/tasks/ProceedToCheckout.ts](src/tasks/ProceedToCheckout.ts) (line 16)) and the drift is
  documented.

**Impact Analysis:** Both are contained; neither affects current green runs.

**Refactor Recommendation and Strategy:** Fold the wait-ceiling centralisation into the Risk 3
follow-up item (an engine-aware duration helper would fix both at once); leave the slug map until
a third product forces the question (YAGNI).

---

## Questions recorded for the maintainer (unattended run - not blocking)

1. Should the Risk 1 documentation reconciliation be done as a single docs PR now, or folded into
   the next handover/worklist cycle? (This review assumes a docs PR is the intended route.)
2. For Risk 3, is "red WebKit leg on every push" an accepted interim state, or should the
   non-Chromium legs move to schedule-only until a tuning item exists?
3. For Risk 4, should `npm run verify` be added to the repo (preferred) or the registry row
   corrected instead?

## Summary Table

| # | Severity | Area | Finding | Status quo ante (v1) |
|---|---|---|---|---|
| 1 | MEDIUM | Documentation | Post-PR #37 drift: backlog self-contradicts; README/CHANGELOG/registry stale; no impl log | Regression of v1 Risk 2's fix |
| 2 | MEDIUM | CI | Empty-shell guard skipped on failure while render/upload/deploy run `always()` | New (surfaced by MAG-C09 landing) |
| 3 | MEDIUM | CI / Coverage | WebKit leg pervasively red, follow-up untracked, 3x CI cost per push | New (from #14) |
| 4 | MEDIUM-LOW | Tooling contract | Registry gate `npm run verify` unrunnable - no such script | New |
| 5 | LOW | Docs hygiene | package.json 1.0.0 vs CHANGELOG stuck at 0.3.0 + swollen Unreleased | New |
| 6 | LOW | Implementation | Hard-coded slug map; Chromium-tuned wait ceilings | Carried from v1 Risk 6 |

---

[<- Previous: Executive Summary](01_EXECUTIVE_SUMMARY.md) | [Back to Index](00_CODE_REVIEW_CLAUDE_Fable_5_v2_20260718T0033Z.md) | [Next: Project Reviews ->](03_PROJECT_REVIEWS/PROJECT_001_Checkout_Automation_Suite.md)
