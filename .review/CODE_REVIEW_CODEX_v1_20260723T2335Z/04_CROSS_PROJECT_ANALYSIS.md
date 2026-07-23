# Cross-Cutting Analysis

[<- Previous: Project Review](03_PROJECT_REVIEWS/PROJECT_001_Checkout_Automation_Suite.md) | [Back to Index](00_CODE_REVIEW_CODEX_v1_20260723T2335Z.md) | [Next: Recommendations ->](05_RECOMMENDATIONS.md)

**Reviewer:** AI assistant (OpenAI Codex, GPT-5)
**Date:** 2026-07-23T23:35Z

This single-repository analysis examines boundaries between specifications, TypeScript runtime,
Magento fixtures, Docker/CI, and documentation.

## Tool-Agnostic Tests

- Gherkin describes shopper outcomes without Serenity/Playwright syntax, so the specifications
  could drive another automation framework.
- The suite's execution semantics are not tool-agnostic: actor lifecycle, Questions, artifact
  generation, and visibility behaviour depend deliberately on Serenity/JS.
- This is an appropriate split. Framework portability belongs at the specification boundary, not
  in duplicated adapter layers that YAGNI would not justify.

## Code-Agnostic Tests

- Feature files are independent of TypeScript and PHP implementation language.
- The deterministic decline and cart-adopt mechanics are Magento-specific, but the Gherkin speaks
  in shopper/cart language rather than module APIs.
- `payment details for a card that will be declined` slightly overstates the current fixture,
  which has no card form; the ADR explains the abstraction and keeps the specification readable.

## Single Source of Truth

- `docs/backlog.md` is the authoritative work-state record and correctly reports zero outstanding
  items.
- `src/config/wait-durations.ts` successfully centralises explicit wait ceilings.
- Product identity remains duplicated between Gherkin names, API lookup, and the hard-coded URL
  slug map. Keeping that map is reasonable while only two products exist.
- Scenario counts are duplicated between README, QA strategy, backlog, and CI's aggregated JSON
  count. The exact-count guard is strong, but docs need a reconciliation check.

## API Contract Compliance

- Magento REST calls use the documented `/rest/V1` surfaces for admin tokens, product search, and
  guest carts.
- Inputs are JSON-encoded or URL-encoded, response status is checked, and no real token is stored.
- There is no OpenAPI document in this repository; N/A for ownership because Magento owns the API.
  Typed response validation is deliberately shallow and could be strengthened with runtime schema
  checks if the surface grows.
- Cart adoption is not RESTful: it is a test-only GET with a side effect. ADR-0006 and default-off
  configuration make that exception explicit.

## Screenplay Parity

- Tasks express shopper intent; Interactions/page areas contain mechanics; Questions expose state;
  step definitions remain thin.
- API setup partly uses Serenity REST Tasks and partly native `fetch`. The split is understandable
  (hook/setup convenience versus actor reporting) but yields different error/reporting styles.
- `NoteCachedCartCounter` is a custom Interaction and `StabiliseCheckoutRoute` a low-level
  Interaction; both are appropriate placements.
- `CartTotalQuantity` is a good example of repairing an oracle without changing the business
  specification.

## Batch File Design

N/A - the repository ships no batch scripts. Shell logic lives in GitHub Actions and Docker
configuration.

- Multiline workflow shell is well commented and uses `pipefail` where a masked pipeline failure
  previously caused an empty database image.
- The Serenity guard correctly enables `nullglob` before counting JSON files.
- No reusable script tests the workflow shell fragments locally; extracting guards into scripts
  would improve testability.

## Documentation Alignment

- README, backlog v8, registry, licence, handover v20, and current SHA agree on resting status and
  the exploratory-engine caveat.
- Architecture and Screenplay guides remain at their June model and conflict with July code.
- QA strategy accurately captures current wait policy but misstates smoke read-only safety and
  future quarantine vocabulary.
- Historical update notes in the backlog are clearly dated; they are not treated as current-state
  contradictions.

## Logging Alignment

- Serenity's ConsoleReporter is correctly the only narrative stdout path; Cucumber's sole stdout
  formatter rule is protected in code and CI.
- Recovery and soft cart-counter signals use stderr, preventing report formatter displacement.
- Recovery messages have stable `[MAG-15 ... recovery]` prefixes suitable for machine checks.
- CI does not yet turn that prefix into a durable promotion artifact or counter; promotion remains
  manual log inspection.

## Test Coverage Metrics

- 4 feature files, 9 Scenario declarations, one 3-row Scenario Outline, 12 expanded scenarios.
- 7 smoke scenarios; 5 order/decline scenarios excluded from smoke.
- 0 deferred scenarios; 2 exploratory browser engines; 1 required engine.
- 0 unit/component test scripts and no executable coverage threshold.
- Latest current-SHA CI: Chromium full-suite job passed, Firefox full-suite job passed, WebKit
  full-suite job failed, Pages deployed the Chromium artifact.

---

[<- Previous: Project Review](03_PROJECT_REVIEWS/PROJECT_001_Checkout_Automation_Suite.md) | [Back to Index](00_CODE_REVIEW_CODEX_v1_20260723T2335Z.md) | [Next: Recommendations ->](05_RECOMMENDATIONS.md)
