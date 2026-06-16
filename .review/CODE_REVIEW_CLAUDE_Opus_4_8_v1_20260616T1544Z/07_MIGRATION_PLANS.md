# Migration Plans

[<- Back to Index](00_CODE_REVIEW_CLAUDE_Opus_4_8_v1_20260616T1544Z.md) | [Next: Annex - Metrics ->](ANNEX/METRICS.md)

**Reviewer:** AI assistant (CLAUDE_Opus_4_8)

These plans are framed as forward-looking consolidation/maintenance strategies; most of the underlying
work is already done in this repository, so each plan focuses on the remaining delta.

## Single Source of Truth for Features

- The Gherkin in [features/](../../features/) is already the single specification; step definitions are
  committed after the specs (SDD ordering visible in history).
- Remaining delta: keep the *derived* counts honest. The 12/94 figure is consistent across
  README/QA-strategy/manifest, but the smoke count (C-01) and backlog metadata (C-02) drifted.
- Adopt a one-line norm: any PR changing suite scope re-derives counts via `--dry-run` for both
  profiles and updates every doc that quotes a count.
- Treat [docs/backlog.md](../../docs/backlog.md) as authoritative and bump its header on every reconciliation, so the
  source of truth never looks staler than the docs it governs.
- Long term, a tiny CI check could assert "README smoke count == smoke dry-run count" to make the
  alignment self-enforcing.
- No feature consolidation is otherwise needed - the four files are cohesive and non-overlapping.

## Docker Compose for Local Development

- The base [docker-compose.yml](../../docker-compose.yml) plus the [docker-compose.ci.yml](../../docker-compose.ci.yml) overlay already give
  a clean local-vs-CI split; the pull-based path against public GHCR images is documented and is the
  easy on-ramp ([README.md](../../README.md) lines 84-104).
- Remaining delta: tighten the `phpfpm`/`app` readiness link (C-03) so a slow runner cannot misreport
  the failure mode.
- Provide a scripted wrapper (`npm run demo:up`/`down`) around the two-file `compose ... --wait`
  command to remove copy-paste friction for a reviewer trying the repo.
- Keep the `${GHCR_OWNER}` interpolation and the `.env` guidance - this is what makes a fork pull its
  own namespace, and it is already correct.
- Document a one-line teardown reminder near the bring-up command (already present) so disposable
  stores do not linger.
- No migration to a different orchestrator is warranted; compose is the right tool at this scope.

## GitHub Actions / Workflow

- Current status: the `e2e` workflow is green on `main`, gated behind a preflight image check, with a
  warm-up step, an empty-report guard, render, and publish-on-failure Pages deploy
  ([.github/workflows/ci.yml](../../.github/workflows/ci.yml)). The `bake-store-images` workflow produces immutable
  per-bake tags with digest provenance ([.github/workflows/bake.yml](../../.github/workflows/bake.yml)).
- Remaining delta is minimal and quality-of-life, not correctness:
  - Add the smoke-count self-check described above (cheap, prevents C-01 recurring).
  - Consider pinning action SHAs (currently `@v3`/`@v4` tags) for supply-chain hardening - optional
    for a portfolio, standard for production.
  - The `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24` env shim is dated to a June 16 2026 migration; revisit
    and remove once the action majors natively run Node 24, to avoid a stale workaround.
  - Node is pinned to 20 in CI while `engines` allows `>=18`; that is fine, but stating the CI Node
    version in the QA strategy would close the loop.
- No structural CI migration is needed; the pipeline is already the strongest artefact in the repo.

---

[<- Previous: Architecture Assessment](06_ARCHITECTURE_ASSESSMENT.md) | [Back to Index](00_CODE_REVIEW_CLAUDE_Opus_4_8_v1_20260616T1544Z.md) | [Next: Annex - Metrics ->](ANNEX/METRICS.md)
