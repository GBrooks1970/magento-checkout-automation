# Cross-Cutting Analysis

[Index](00_CODE_REVIEW_CLAUDE_Opus_4_8_v2_20260730T1718Z.md) | [Executive Summary](01_EXECUTIVE_SUMMARY.md) | [Risks](02_RISKS_AND_ISSUES.md) | [Project Review](03_PROJECT_REVIEWS/PROJECT_001_magento-checkout-automation.md) | **Cross-Cutting** | [Recommendations](05_RECOMMENDATIONS.md) | [Architecture](06_ARCHITECTURE_ASSESSMENT.md) | [Migration](07_MIGRATION_PLANS.md)

This is a single-project repository, so "cross-project" is read per the template's single-repository customisation as **cross-cutting concerns within the repo**: the test suite, the Docker infrastructure, the CI/CD, the in-repo Magento module code, and the documentation set - and how they cohere.

## Suite <-> Infrastructure

Strong coherence. The suite assumes a clean, deterministic SUT and the Docker layer delivers exactly that (baked images -> throwaway volumes). API-driven backgrounds mean the suite does not depend on UI-created state carrying between scenarios. The `preflight` image-existence gate is the seam that keeps the suite honest when infrastructure is not ready (skip, do not false-fail).

## Suite <-> CI

Mostly coherent, one gap. Chromium-required + Firefox/WebKit-non-blocking is a defensible cost/signal trade-off, well documented (TRIAGE-03). The gap is **static/security gates**: CI runs the E2E but not `npm audit`, so dependency health - the one live HIGH in this review - is outside CI's field of view. Contrast the sibling `bfx-ws-screenplay`, which runs `audit:ci` in every job. Adopting that closes the loop.

## Infrastructure <-> Supply chain

The GHCR image strategy is a real strength (fast, reproducible), but image immutability rests on convention (unique `:2.4.8-b<run>` tags + a bare `:2.4.8`) rather than enforced digest pinning at consume time (CODEX v1 Risk 6). Acceptable for a portfolio SUT; worth a note that "convention, not enforcement" is the standing posture.

## Module code (app/) <-> Suite

The in-repo Magento modules (`Portfolio_CartSeed`, `Portfolio_DeclinePayment`) are a genuine differentiator - they show the author can extend the SUT, not just drive it. `DeclinePayment` now defaults off (CODEX-01), so the always-declining fixture cannot leak into a non-test store. Good boundary discipline.

## Documentation set (cohesion)

The docs are thorough (backlog, ADRs 0001-0007, planning proposals, implementation logs, many handovers) but **long and accretive**. The recurring failure mode across all six reviews is not inaccuracy in the authoritative summary - that has stayed correct - but stale *dated narrative* elsewhere in the same files drifting out of step (v17, the 2026-06-22 block, the registry cache). The content is right; the shape lets old prose masquerade as current.

## Portfolio-level pattern (one observation)

The `brace-expansion` HIGH is the **same advisory** just fixed in `bfx-ws-screenplay`. That is a portfolio signal: a transitive advisory can hit multiple repos, and only the repos with an `audit:ci` gate catch it automatically. A portfolio-wide "every repo runs `npm audit --audit-level=high` in CI" convention would have surfaced this here on the day it landed. Worth raising as a cross-portfolio recommendation (not actioned in this single-repo review).
