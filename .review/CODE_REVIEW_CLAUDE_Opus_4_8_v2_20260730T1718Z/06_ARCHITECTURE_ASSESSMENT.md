# Architecture Assessment

[Index](00_CODE_REVIEW_CLAUDE_Opus_4_8_v2_20260730T1718Z.md) | [Executive Summary](01_EXECUTIVE_SUMMARY.md) | [Risks](02_RISKS_AND_ISSUES.md) | [Project Review](03_PROJECT_REVIEWS/PROJECT_001_magento-checkout-automation.md) | [Cross-Cutting](04_CROSS_PROJECT_ANALYSIS.md) | [Recommendations](05_RECOMMENDATIONS.md) | **Architecture** | [Migration](07_MIGRATION_PLANS.md)

Assessed against the Test Pyramid, SOLID, KISS/YAGNI, REST/OpenAPI, ISTQB strategy, and pedagogical value.

## Screenplay fidelity

Faithful. `src/` separates `actors`, `tasks`, `interactions`, `questions`, `api`, `step-definitions`, `config`, `hooks`. Step definitions are glue that delegate to Tasks/Questions; domain behaviour lives in the Screenplay layers, not the steps. This is the pattern the repo teaches, implemented as taught - good pedagogical value for a mid-level reader learning Screenplay with Serenity/JS + Playwright.

## Test Pyramid

Deliberately **top-heavy by design**: this is an E2E checkout suite, so full-stack browser scenarios dominate, which is appropriate for its stated intent (demonstrate E2E checkout automation). It is not pretending to be a unit-test showcase. The API-driven backgrounds push *setup* below the UI, which is the right compromise - the pyramid inversion is scoped to the assertions that genuinely need the browser. N/A on unit-layer breadth: correctly out of scope for this project's purpose.

## SOLID

- **SRP:** strong - Tasks, Questions, Interactions, API helpers each have one job; the `Portfolio_CartSeed` module isolates seeding.
- **OCP/DIP:** the Screenplay abstractions (Ability, Task, Question) give natural extension points; new checkout flows extend rather than modify.
- **ISP/LSP:** not stressed by a suite this size; no violations observed.

## KISS / YAGNI

Mostly disciplined. The disposable-store design is the simplest thing that gives a deterministic SUT. The main YAGNI tension is the **accreting documentation** (many dated update blocks, planning proposals) - not code complexity, but doc complexity that has begun to cost currency (Risk 4). The Firefox/WebKit matrix is arguably more than a portfolio needs, but it is knowingly scoped as exploratory/non-blocking, which is a reasonable YAGNI stance.

## REST / OpenAPI

REST is used for backgrounds (product verification, guest-cart seeding via `Portfolio_CartSeed`, ADR 0006). No OpenAPI contract is published for the seeding endpoint - reasonable for an internal test fixture, and out of scope to demand one. N/A on formal API contract testing: this is a UI-checkout suite, not an API-contract project.

## ISTQB strategy

Risk-based and experience-based selection is evident: the suite targets the checkout critical path, negative validation, and payment-failure - the highest-value flows. The negative-scenario ordering concern (CODEX v1 Risk 3) is the one place where a test could pass without exercising the risk it names; worth tightening.

## Infrastructure architecture

The bake-then-consume image model (`bake.yml` -> GHCR -> `preflight` gate -> `ci.yml`) is the standout architectural decision: it decouples the expensive Magento install from every run, gives reproducibility, and degrades gracefully (skip-not-fail) when images are absent. Documented in ADRs and the workflow header comments. This is senior infrastructure judgement, reviewable.

## Overall

Architecturally sound and pedagogically valuable. The gaps are not structural - they are gate/currency gaps (audit automation, doc shape, promotion-tracking) rather than design defects. The pattern implementation itself is a good exemplar.
