# Project Review - magento-checkout-automation

[Index](../00_CODE_REVIEW_CLAUDE_Opus_4_8_v2_20260730T1718Z.md) | [Executive Summary](../01_EXECUTIVE_SUMMARY.md) | [Risks](../02_RISKS_AND_ISSUES.md) | **Project Review** | [Cross-Cutting](../04_CROSS_PROJECT_ANALYSIS.md) | [Recommendations](../05_RECOMMENDATIONS.md) | [Architecture](../06_ARCHITECTURE_ASSESSMENT.md) | [Migration](../07_MIGRATION_PLANS.md)

Reviewer: AI assistant (Claude Opus 4.8) - `main` @ `b30e0c6`, 2026-07-30.

## Stack and intent

- **Runner/specs:** Cucumber (`@cucumber/cucumber@12.9.0`) with Gherkin features in [features/](../../features) - `cart-management`, `checkout-validation`, `guest-checkout`, `payment-failure`.
- **Reporting/core:** Serenity/JS (`@serenity-js/*`) - Screenplay core, Cucumber adapter, Playwright web, REST, assertions, `serenity-bdd` living docs, console reporter.
- **Browser:** Playwright (Chromium required; Firefox/WebKit non-blocking on schedule/main).
- **SUT:** disposable Magento 2.4.8 via [docker-compose.yml](../../docker-compose.yml) / [docker-compose.ci.yml](../../docker-compose.ci.yml), pre-baked GHCR images ([Dockerfile.store-app](../../Dockerfile.store-app), [Dockerfile.store-db](../../Dockerfile.store-db)), plus in-repo Magento module code under [app/](../../app) (`Portfolio_CartSeed`, `Portfolio_DeclinePayment`).
- **Language/build:** TypeScript strict, `ts-node`; Node `>=20`; MIT licence.

Intent (from [README.md](../../README.md) and [docs/backlog.md](../../docs/backlog.md)): a portfolio-grade demonstration of E2E checkout automation with reproducible infrastructure and living documentation. Backlog reports **0 outstanding, all Items #1-#15 resolved**; that claim is consistent with the repository after the PR #48 reconciliation (see Risk 4).

## Executable specifications

- Four feature files, business-readable Gherkin. `default` and `smoke` Cucumber profiles ([cucumber.js](../../cucumber.js)); `verify` dry-runs both.
- **Carried concerns (CODEX v1):** the `smoke` profile is not read-only/ordering-safe (Risk 2), a negative validation scenario can pass before the invalid transition occurs (Risk 3), and the documented quarantine tag is not excluded by either profile (Risk 4). These remain open on `b30e0c6` (inference from git history; re-verify against `features/` + `cucumber.js` during triage).

## Source layers (Screenplay fidelity)

`src/` is cleanly divided into `actors`, `tasks`, `interactions`, `questions`, `api`, `config`, `hooks`, `step-definitions`. This is a faithful Screenplay layering: step definitions delegate to Tasks/Questions rather than carrying logic, and API preconditions live in `api/` behind the `Portfolio_CartSeed` endpoint. No fixed sleeps were observed; Item #15 centralised engine-aware wait ceilings. Detailed pattern assessment is in [06_ARCHITECTURE_ASSESSMENT.md](../06_ARCHITECTURE_ASSESSMENT.md).

## Runtime lifecycle, isolation, waits

- **Lifecycle:** disposable store restored from baked images into throwaway volumes; each run is a clean SUT. This is the project's strongest reliability property.
- **Isolation:** API-driven backgrounds (REST product checks + guest-cart seeding) avoid UI-order coupling between scenarios.
- **Waits:** engine-aware ceilings (Item #15). Firefox/WebKit exhibit documented, engine-specific timing drift and are deliberately non-blocking until a three-run promotion gate is met - honest, but the gate is tracked only in prose (Risk 3 of this review).

## Data setup, API, auth

- Product preconditions verified through the Magento REST API; cart seeded through guest-cart endpoints bound to the browser session via `Portfolio_CartSeed` ([docs/adr/0006-api-guest-cart-seeding.md](../../docs/adr/0006-api-guest-cart-seeding.md)).
- The baked store ships hard-coded **test** credentials by design; after `bake.yml`, CI needs no Magento secrets. `auth.json` (Adobe Marketplace keys) is used only by the bake workflow - confirm it is git-ignored / placeholder before any publish (non-finding, spot-check advised).

## CI assessment

- [.github/workflows/ci.yml](../../.github/workflows/ci.yml): `push:[main]` + `pull_request` + `workflow_dispatch` + weekly `schedule`; a `preflight` job gates `test`/`deploy-pages` on GHCR image existence (skips cleanly with an `image-not-ready` signal rather than a false failure - a genuinely good pattern). Chromium required on every push/PR; Firefox/WebKit schedule/main-only (TRIAGE-03).
- `bake.yml` builds/pushes the two GHCR images (needs Marketplace secrets); ci.yml then needs none.
- **Gap:** no `npm audit` step (Risk 1). This is the one clear CI correctness gap.
- CI on `main` independently confirmed green this session (all three engines `success`).

## Dependency, security, licence

- **HIGH:** transitive `brace-expansion` DoS (Risk 1) - no `overrides`, no gate.
- Earlier accepted `@cucumber/cucumber` `uuid` moderates were tracked under MAG-C11; `npm audit` now surfaces the `brace-expansion` HIGH as the dominant finding. Dependency currency is deliberate (exact intent) but unautomated.
- Licence: MIT, present and consistent. No committed live secrets observed.

## Documentation alignment (against docs/backlog.md)

Backlog is authoritative and now internally consistent (PR #48 reconciled the stale 2026-06-22 block). README and the live `portfolio-prompts/registry.yml` agree (magento = resting, handover v20, #1-#15 delivered). The recurring theme is *currency by discipline*: dated update blocks accrete and occasionally drift (Risk 4).

## Verdict

A mature, credible reference project. Fix the audit HIGH + gate, triage the carried CODEX v1 findings, and it is in excellent shape for a formal close-out.
