# Migration Plans

[<- Previous: Architecture Assessment](06_ARCHITECTURE_ASSESSMENT.md) | [Back to Index](00_CODE_REVIEW_CODEX_v1_20260723T2335Z.md) | [Next: Metrics Annex ->](ANNEX/METRICS.md)

**Reviewer:** AI assistant (OpenAI Codex, GPT-5)
**Date:** 2026-07-23T23:35Z

## Plan 1: Single Source of Truth for Execution Policy

- Choose `@deferred` or `@pending` as the one quarantine tag; prefer `@deferred` because the
  profiles and project history already use it.
- Correct the smoke contract to non-ordering/dedicated-target, or add a separate read-only tag.
- Keep engine wait values only in `src/config/wait-durations.ts`; documentation should link to it
  and describe semantics rather than duplicate every number.
- Generate or validate scenario/profile counts from a small script so README, QA strategy, and the
  Serenity guard cannot drift independently.
- Store MAG-15 promotion summaries as workflow artifacts or job summaries with engine, scenario
  result, and recovery count.
- Refresh architecture and Screenplay guides after these rules settle.

## Plan 2: Docker Compose Safety and Local Reproducibility

- Change the nginx host port to `127.0.0.1:8080:8000`.
- Default both fixture modules to operationally safe states; activate them in explicit test-store
  setup.
- Add a Compose configuration check for loopback binding, expected image references, and exactly
  two GHCR images in the CI overlay.
- Retain the current pre-baked image strategy; rebuilding Magento for every run would worsen
  feedback without improving coverage.
- Enforce image content with `tag@sha256:digest` references while preserving human-readable bake
  tags.
- Document that guest-cart tests write server-side quotes and define whether local teardown or
  periodic reset is expected.
- Verify on a clean developer host and in a PR workflow before adopting a new bake.

## Plan 3: GitHub Actions and Test Pyramid

- Add a focused TypeScript test runner and pure tests for environment/policy functions.
- Refactor native Playwright trace/recovery decision logic behind injectable boundaries only where
  required for those tests.
- Add fixture contract checks during bake: module enablement, configuration flags, decline method
  visibility, and cart-adopt default/active behaviour.
- Extend `npm run verify` with fast tests while retaining both Cucumber dry-runs.
- Add a Pages deployment concurrency group so only the newest eligible deployment proceeds.
- Pin actions to reviewed SHAs and baked images to recorded digests.
- Keep Chromium required and Firefox/WebKit exploratory until each engine independently satisfies
  the existing three-run, zero-recovery gate.

## Docker Compose for Local Development

The repository already has a functioning Compose strategy; no platform migration is recommended.
The migration is a boundary-hardening pass: loopback exposure, safe fixture defaults, content pins,
and explicit guest-cart cleanup expectations.

## GitHub Actions/Workflow Current Status

The current-SHA workflow is functioning: preflight, browser computation, Chromium, Firefox,
Chromium Pages upload, and Pages deployment succeeded. WebKit failed as documented and was allowed
to remain non-blocking. Changes above preserve this policy while improving currency and
provenance.

---

[<- Previous: Architecture Assessment](06_ARCHITECTURE_ASSESSMENT.md) | [Back to Index](00_CODE_REVIEW_CODEX_v1_20260723T2335Z.md) | [Next: Metrics Annex ->](ANNEX/METRICS.md)
