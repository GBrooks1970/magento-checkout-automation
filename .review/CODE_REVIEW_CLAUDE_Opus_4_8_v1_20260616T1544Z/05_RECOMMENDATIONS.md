# Recommendations

[<- Back to Index](00_CODE_REVIEW_CLAUDE_Opus_4_8_v1_20260616T1544Z.md) | [Next: Architecture Assessment ->](06_ARCHITECTURE_ASSESSMENT.md)

**Reviewer:** AI assistant (CLAUDE_Opus_4_8)

## Recommended Refactors (priority order)

- **Fix the `smoke` subset description and tag expression (C-01).** Re-derive the scenario count from
  a dry-run, decide whether `smoke` should exclude the decline scenario (add a `@usesDeclineModule`
  tag and extend the tag expression) or be redescribed as the 8-scenario non-order-placing subset,
  and update both [README.md](../../README.md) (line 106) and [docs/qa-strategy.md](../../docs/qa-strategy.md) (line 28).
- **Reconcile the backlog header and Summary table (C-02).** Bump `Version`/`Last Updated`/`Based on`
  and align the priority bands with the per-item scores (or replace the band table with the
  already-present credibility checklist) in [docs/backlog.md](../../docs/backlog.md) (lines 3-5, 549-555).
- **Tighten the compose readiness gate (C-03).** Give `phpfpm` a healthcheck and make `app` depend on
  `service_healthy`, or add a `start_period` to the `app` healthcheck, in
  [docker-compose.yml](../../docker-compose.yml).
- **Optionally simplify the decline module (C-04).** Either keep `DeclineCommand` (documented as
  contract-completeness) or drop the command-pool mapping so the observer stands alone -
  a clarity-only change.

## Next Steps (immediate action items)

- Run `npx cucumber-js --profile smoke --dry-run` and paste the resulting count into whichever
  description you keep, so the doc figure is sourced from the runner, not memory.
- Add "re-derive the smoke count from a dry-run" to the existing docs-reconciliation working norm the
  prior review introduced (any PR flipping suite scope re-checks the scoped counts).
- Bundle C-01 + C-02 into one docs PR (both are docs-only) and C-03 + C-04 into one infra PR; gate
  each with `tsc --noEmit` and a dry-run, plus a cold `compose up --wait` for the infra PR.
- Consider a formal `close-project` pass (the latest handover flagged this project as a
  close-candidate): verify every public-facing README claim, then mark a terminal FINAL handover.

## Future Project Ideas (long-term enhancements)

- **Add a thin contract/integration tier** exercising `MagentoApiClient` against the store API alone
  (no browser) to make the API layer independently regression-tested and to broaden the Test Pyramid
  base a little - a low-cost way to show pyramid awareness without diluting the E2E showcase.
- **Publish a one-command "try it" path** (the GHCR pull-based bring-up is already documented; a
  scripted `make demo` or `npm run demo:up` wrapper would make the fork-and-run story frictionless).
- **A second journey under the same architecture** (e.g. registered-customer reorder, or coupon
  application) would prove the pattern generalises beyond the one bounded scenario - but only if it
  stays within the deliberate "reviewable in fifteen minutes" constraint the README sets.

---

[<- Previous: Cross-Project Analysis](04_CROSS_PROJECT_ANALYSIS.md) | [Back to Index](00_CODE_REVIEW_CLAUDE_Opus_4_8_v1_20260616T1544Z.md) | [Next: Architecture Assessment ->](06_ARCHITECTURE_ASSESSMENT.md)
