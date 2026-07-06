# Migration Strategy and Plans

[<- Back to Index](00_CODE_REVIEW_CLAUDE_Fable_5_v1_20260706T1048Z.md) | [Next: Annex - Metrics ->](ANNEX/METRICS.md)

**Reviewer:** AI assistant (CLAUDE Fable 5)
**Date:** 2026-07-06T10:48Z

Per the single-repository customisation, the template's three plans are
assessed against what this repo has already built (all three are largely
*done* here) plus the forward migrations this review actually recommends.

## Single Source of Truth for Features

- Achieved: `features/*.feature` is the sole specification layer, committed
  before implementation (SDD), with the manifest documenting shared-step
  economy and the naming exception.
- The `smoke`/`default` split is derived from tags on those same files, not
  from parallel lists - no consolidation work needed.
- Forward risk: scenario-count statements are duplicated across README,
  qa-strategy and architecture.md (currently consistent at 12/94, verified);
  when Items #13/#14 change run shapes, update all three or centralise the
  claim.
- Keep the manifest's shared-step table in sync if new steps land with #13/#14.

## Docker Compose for Local Development

- Achieved and validated: pinned, healthchecked base compose
  ([docker-compose.yml](../../docker-compose.yml)) plus a CI overlay that swaps
  in pre-baked GHCR images ([docker-compose.ci.yml](../../docker-compose.ci.yml))
  keyed by a unique per-bake tag (`:2.4.8-b24` today).
- Local bring-up documented two ways: quick (pull baked images, no secrets) and
  from-scratch (runbook with Marketplace keys). Start-period tuning for
  OpenSearch and nginx is recorded against the cold-start failures it fixed.
- Forward plan: nothing structural. When a re-bake is next needed (Magento or
  sample-data change), follow the documented flow - bake pushes a new unique
  tag + digests, adoption is a one-line-per-service PR to the overlay.
- Optional hardening: a periodic (scheduled) CI run would surface image/GHCR
  bit-rot between pushes (proposal 0006 covers this).

## GitHub Actions / Workflow

- Current status: two workflows, both green - `bake.yml` (manual/tag-triggered
  image baker with empty-dump and product-count guards, digest provenance in
  the run summary) and `ci.yml` (preflight image gate -> test -> deploy-pages,
  latest `main` run `27845450443` green in 5m56s; report content verified live
  during this review).
- Caching/image strategy: npm cache via `setup-node`; the heavyweight caching
  *is* the pre-baked image strategy (~40 min install avoided per run). Secrets
  hygiene: CI needs none; bake needs only the two Marketplace keys on the
  `bake` environment; GHCR push uses `GITHUB_TOKEN` with `packages: write`.
- Local reproducibility: the CI store and the local store are the same compose
  + images; `npm test` locally equals the CI test step (modulo `SCREENSHOTS`
  env defaults, documented in the README table).
- Planned migrations, in order: (1) strengthen the report guard to assert
  scenario count ([Risk 5](02_RISKS_AND_ISSUES.md#risk-5)); (2) Item #13
  trace/video with isolation re-verification; (3) Item #14 engine matrix -
  Chromium required, Firefox/WebKit non-blocking first, promoting once stable;
  (4) the Cucumber 12 bump PR with the formatter-slot re-verification
  ([Risk 1](02_RISKS_AND_ISSUES.md#risk-1)).

---

[<- Previous: Architecture Assessment](06_ARCHITECTURE_ASSESSMENT.md) | [Back to Index](00_CODE_REVIEW_CLAUDE_Fable_5_v1_20260706T1048Z.md) | [Next: Annex - Metrics ->](ANNEX/METRICS.md)
