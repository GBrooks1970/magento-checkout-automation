# Walkthrough — Magento Phase 1 dependency and CI recovery

## Executive Summary

The HIGH dependency findings are cleared on the repair branch, and the E2E workflow is active. The first PR run exposed an unsupported moving Ubuntu image; pinning the browser job restored execution with the existing toolchain. Required PR CI passes; merging and main/publication acceptance remain unauthorised Phase 2 work.

## 1. Changes Implemented

- [.github/workflows/ci.yml](../../.github/workflows/ci.yml): Pin the browser job to the supported Ubuntu 24.04 image.
- [README.md](../../README.md): Separate branch recovery from main acceptance.
- [docs/backlog.md](../../docs/backlog.md): Track HIGH recovery and remaining MODERATE work separately.
- [docs/dependency-audit-policy.md](../../docs/dependency-audit-policy.md): Record residual findings and inactive-workflow recovery.
- [docs/implementation-plans/2026-11-08_mag-maint-01-ci-recovery.md](../../docs/implementation-plans/2026-11-08_mag-maint-01-ci-recovery.md): Preserve the implementation scope, phase authorisation and plan history.
- [docs/implementation-plans/2026-11-08_mag-maint-01-ci-recovery_v2.md](../../docs/implementation-plans/2026-11-08_mag-maint-01-ci-recovery_v2.md): Preserve the implementation scope, phase authorisation and plan history.
- [docs/implementation-plans/_index.md](../../docs/implementation-plans/_index.md): Preserve the implementation scope, phase authorisation and plan history.
- [docs/templates/implementation-plan.template.md](../../docs/templates/implementation-plan.template.md): Adopt the portfolio plan template before planning this repair.
- [package-lock.json](../../package-lock.json): Resolve the three patched package records without changing the direct toolchain.
- [package.json](../../package.json): Update existing Axios and brace-expansion overrides.
- [Verification evidence directory](../verification/2026-11-08-magento-phase-1/receipt.json): captured audits, local verification and CI receipt.
- [This walkthrough](2026-11-08_mag-maint-01-phase-1.md): immutable batch evidence.

Critical changes: `axios: 1.18.1 -> 1.21.0`, `brace-expansion: ^5.0.9 -> 5.0.12`, resolved `follow-redirects: 1.16.0 -> 1.16.2`; browser job `runs-on: ubuntu-latest -> ubuntu-24.04`. No direct toolchain upgrade or relaxed gate.

## 2. Verification & Test Evidence

| Command | Quality Gate / Suite | Status | Metrics (Passed/Total) | Duration |
|---|---|---|---|---|
| npm run verify | typecheck, unit, audit, dry-run discovery | PASS | 20/20 unit; default 12, smoke 7 discovered | 37.131s |
| npm audit --json | Full audit | Findings retained | 0 HIGH, 0 CRITICAL, 3 MODERATE | Not timed |
| CI run 42528342786 | audit | success | See captured run and log | 14s |
| CI run 42528342786 | preflight | success | See captured run and log | 7s |
| CI run 42528342786 | compute-browsers | success | See captured run and log | 3s |
| CI run 42528342786 | test (chromium) | success | 12/12 scenarios | 290s job; 107.461s suite real time |


Chromium output: `Cart management: 4 successful`, `Checkout validation: 2 successful`, `Guest checkout: 5 successful`, `Payment failure handling: 1 successful`; `Scenarios: 12`, `Real time: 1m 47s 461ms`. The guard found 10 non-empty JSON reports: scenario-outline rows aggregate into one report, as documented in the workflow.

Local unit runner output: `tests 20`, `pass 20`, `fail 0`, `duration_ms 436.8341`. Dry runs discover scenarios; they do not execute browser assertions. Baseline negative control: `audit:ci FAIL - 0 critical, 5 high advisory(ies)`. The initial PR run 42527987456 failed with `Playwright does not support chromium on ubuntu26.04-x64`; its empty-JSON guard also failed as intended. [Repaired CI run](https://github.com/GBrooks1970/magento-checkout-automation/actions/runs/42528342786) and [machine-readable receipt](../verification/2026-11-08-magento-phase-1/receipt.json) retain exact head and job timestamps. Raw complete CI logs are retained in `C:\Users\brook\.codex\tmp\magento-evidence-20261108`.

## 3. Operational State & Invariants

Code head `b93aa641c95c41355133a8a5a22c17ba8776975e`, branch `codex/magento-ci-recovery-20261108`, draft [PR #68](https://github.com/GBrooks1970/magento-checkout-automation/pull/68). The code tree was clean and matched the pushed branch before this documentation batch. The paired v23 support handover records the final documentation head and final checks after this commit. Primary main remains `dfa7086c7d30ebaf34ada295d52d8a24b35720b5`; no merge or new Pages publication is claimed. Docker ran only on hosted CI; no local storage changes were made (local Docker belongs on `E:\_DockerData`). Chromium remains required; Firefox/WebKit exploratory policy and Docker/action pins remain unchanged. MAG-MAINT-01 stays open pending Phase 2; MAG-MAINT-02 tracks three MODERATE findings.

## 4. Recommended Next Actions

1. Stop after the saved Phase 1 evidence and paired handover. Await explicit owner authorisation.
2. Only when Phase 2 is authorised: review/merge, verify exact-main CI and publication, reconcile registry/backlog, then synchronise primary copies.
3. Phase 3 moderate dependency compatibility work and Phase 4 WebKit investigation remain separately unauthorised.
