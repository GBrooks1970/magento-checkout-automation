# Migration Strategy and Plans

[<- Back to Index](00_CODE_REVIEW_CLAUDE_Fable_5_v2_20260718T0033Z.md) | [Next: Annex - Metrics ->](ANNEX/METRICS.md)

**Reviewer:** AI assistant (CLAUDE Fable 5)
**Date:** 2026-07-18T00:33Z

Template scaling note: the three canonical plans below are assessed against what this repo has
already achieved; where a migration is complete, the plan records residual actions only.

## Single Source of Truth for Features

- Already achieved for executable behaviour: `features/**` is the sole behaviour spec, indexed by
  [features/_manifest.md](features/_manifest.md), enforced at runtime by profile tags and in CI
  by the scenario-count guard keyed to the feature set.
- Residual action 1: the guard's `SERENITY_EXPECTED_SCENARIOS=10` must be updated in lockstep
  with any Scenario/Outline addition - the workflow comment documents this well; a future
  improvement could derive the count from a dry-run instead of a constant.
- Residual action 2 (Risk 1): restore the backlog's authority - reconcile Status/Summary/header
  so prose truth matches item-body truth; until then the "source of truth" claim is compromised.
- Residual action 3: fold the WebKit follow-up out of #14's resolution prose into a numbered
  item so planned coverage lives only in the backlog.

## Docker Compose for Local Development

- Migration complete and mature: pinned healthchecked stack
  ([docker-compose.yml](docker-compose.yml)), CI overlay swapping in pre-baked GHCR images
  ([docker-compose.ci.yml](docker-compose.ci.yml)), immutable per-bake tags with PR-gated
  adoption (R-06b), fork-safe `${GHCR_OWNER}` interpolation with a self-documenting `:?` error
  (R-06c), and a validated from-scratch runbook for image changes.
- Residual action 1: the overlay currently pins `:2.4.8-b24`; the bake provenance (digests) is
  in the bake run summary - consider mirroring the current tag's digests into the overlay
  comment at adoption time so provenance survives GitHub log expiry.
- Residual action 2: local development still requires ~6 GB Docker RAM; documented, no action.

## GitHub Actions / Workflow

- Current status: two workflows - `bake.yml` (manual/tag-triggered image baking, Marketplace
  secrets confined to the `bake` environment) and `ci.yml` (preflight -> 3-engine matrix test ->
  guard -> report -> Pages deploy). Badge green on `main`; living docs live.
- Plan item 1 (Risk 2): gate render/upload/deploy on the guard's outcome with
  `if: always() && steps.serenity-guard.outcome == 'success'` semantics so the empty-shell
  regression path is closed while publish-on-failure (with data) is preserved.
- Plan item 2 (Risk 3): restrict non-Chromium legs to schedule/dispatch until a tuning item
  exists; add promotion criteria to the backlog.
- Plan item 3: caching is currently npm-only (`setup-node` cache); the compose pulls (~3-5 min)
  are already near-optimal from GHCR - no further action worth its complexity.
- Plan item 4: secrets posture is correct (CI needs none; bake environment holds Marketplace
  keys; baked admin credentials are test-only and localhost-guarded in the client) - no change.
- Local reproducibility is genuinely equivalent to CI (same compose files, same images, same
  env defaults), which few suites achieve; keep it that way when adding the guard change.

---

[<- Previous: Architecture Assessment](06_ARCHITECTURE_ASSESSMENT.md) | [Back to Index](00_CODE_REVIEW_CLAUDE_Fable_5_v2_20260718T0033Z.md) | [Next: Annex - Metrics ->](ANNEX/METRICS.md)
