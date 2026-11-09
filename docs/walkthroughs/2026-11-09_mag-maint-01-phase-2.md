# Walkthrough — Magento Phase 2 main acceptance

## Executive Summary

Phase 1 repair and handover PRs were merged under the owner's Phase 2 authorisation. Exact-main required CI and report publication passed, closing MAG-MAINT-01. Three moderate findings and failing exploratory WebKit remain separately deferred.

## 1. Changes Implemented

- [README](../../README.md): replace pending-merge status with evidence-backed main acceptance.
- [Backlog](../backlog.md): resolve MAG-MAINT-01, reconcile the outstanding count and credibility table, and record WebKit's observed result.
- [Dependency policy](../dependency-audit-policy.md): distinguish the accepted repair from the vulnerable historical lockfile.
- [Phase 2 plan](../implementation-plans/2026-11-09_mag-maint-01-phase-2.md) and [index](../implementation-plans/_index.md): preserve owner authority and delivery scope.
- [Receipt](../verification/2026-11-09-magento-phase-2/receipt.json): exact SHA, run/job timestamps, counts and live/artefact hashes.
- [This walkthrough](2026-11-09_mag-maint-01-phase-2.md): immutable acceptance record. Registry lifecycle and paired handover are delivered separately in their owning repositories.

## 2. Verification & Test Evidence

| Command / source | Gate | Status | Metrics | Duration |
|---|---|---|---|---|
| Main run 42541336270 | audit | PASS | HIGH gate, no exception introduced | Job timestamps in receipt |
| Main run 42541336270 | Chromium | PASS | 12/12 | 90.150s suite real time |
| Main run 42541336270 | Firefox exploratory | PASS | 12/12 | 124.146s suite real time |
| Main run 42541336270 | WebKit exploratory | FAIL, non-blocking | 0/12, 12 failed | 617.690s suite real time |
| Main run 42541336270 | Pages | PASS | Deployment completed | Job timestamps in receipt |
| HTTP fetch plus SHA-256 comparison | Published report | PASS | 3/3 HTTP 200 and byte-identical pages | Not timed |
| python tools/check-library.py | Registry | PASS | Standalone self-gate; sibling checks skipped | Not timed |
| Registry main run 42541663540 | check-library | PASS | Merged 07b5f1c | Run record |

Chromium console: `Cart management: 4 successful`, `Checkout validation: 2 successful`, `Guest checkout: 5 successful`, `Payment failure handling: 1 successful`; `Real time: 1m 30s 150ms`, `Scenarios: 12`. WebKit console reports 4 + 2 + 5 + 1 failed scenarios. The HIGH gate passing is not a zero-vulnerability claim; the Phase 1 complete audit retained three MODERATE findings. See the [main run](https://github.com/GBrooks1970/magento-checkout-automation/actions/runs/42541336270) and receipt for provenance. Existing Phase 1 logs retain the five-HIGH baseline negative control; no new runtime tests are needed for this documentation reconciliation.

## 3. Operational State & Invariants

Accepted main is `9b6dd5f07779bb0caf170b47072de23a86e2ff79`. This reconciliation branch is `codex/magento-phase2-20261109`; plan commit `0806929` was saved/pushed before acceptance documentation. The final documentation PR and exact-head checks are recorded in paired handover v24 after this batch. Support PR #366 is merged as `c32f4a9`; registry PR #141 is merged as `07b5f1c`. Primary Magento was safely fast-forwarded using Cowork adoption; registry primary retained its unrelated edits. Primary support has overlapping uncommitted index work and must not be overwritten. No local Docker operation was needed; its storage remains `E:\_DockerData`. Required browser gates and exploratory promotion policy are unchanged.

## 4. Recommended Next Actions

1. Finish the bounded reconciliation PR, exact-final-main checks, paired v24 handover and safe synchronisation.
2. Stop before Phase 3. MAG-MAINT-02 requires explicit authorisation for compatibility work.
3. Leave WebKit investigation for separately authorised Phase 4; no stability claim or promotion follows from aggregate workflow success.
