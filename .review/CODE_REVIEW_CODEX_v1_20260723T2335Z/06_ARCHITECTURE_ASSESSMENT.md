# Architecture Assessment

[<- Previous: Recommendations](05_RECOMMENDATIONS.md) | [Back to Index](00_CODE_REVIEW_CODEX_v1_20260723T2335Z.md) | [Next: Migration Plans ->](07_MIGRATION_PLANS.md)

**Reviewer:** AI assistant (OpenAI Codex, GPT-5)
**Date:** 2026-07-23T23:35Z

## Test Pyramid

**Assessment: Partial alignment.**

- The repository intentionally concentrates on E2E checkout risk and has a suitable number of
  business journeys for a portfolio reference.
- API setup reduces UI setup time but is not a separate API assertion layer; it remains part of
  each E2E scenario.
- There are no fast unit or component tests for substantial policy and fixture logic.
- Recommended shape: a small, numerous TypeScript policy-test base; targeted Magento fixture
  integration tests; retain the current 12 E2E scenarios at the top.

## SOLID Principles

### Single Responsibility

Strong overall. Tasks, Questions, page areas, API client, configuration policy, and hooks are
separated. `browser.hooks.ts` now owns browser launch, isolation, trace capture, actor engagement,
and cleanup; extracting trace lifecycle would reduce its expanding responsibility.

### Open/Closed

Task variants and central wait policies extend common behaviour without editing Gherkin.
`productSlugs` requires source edits for every new product, but adding abstraction before a third
product would be premature.

### Liskov Substitution

N/A - the project uses composition and framework interfaces rather than a custom inheritance
hierarchy. Browser engines are not fully substitutable by design: Chromium is strict while
exploratory engines allow recovery. That asymmetry is explicit and observable.

### Interface Segregation

Abilities are narrow and appropriate. The broad exported `MagentoApi` object combines auth,
catalogue lookup, guest-cart mutation, and Serenity Task creation; separate interfaces would help
unit tests but are not yet required by scale.

### Dependency Inversion

Screenplay Tasks depend on Serenity abstractions rather than native Playwright in most places.
`StabiliseCheckoutRoute` and hooks intentionally cross into native Playwright for capabilities the
higher layer does not expose. The API client directly depends on global `fetch` and environment
state, which makes its safety/error branches harder to isolate.

## KISS

- Feature wording is compact and business-readable.
- Central wait tiers are simpler than scattered engine conditionals.
- Exact report-count and image preflight guards are longer than average, but each comment records
  a real failure and the implementation remains linear.
- The most significant KISS issue is duplicated historical narrative in code and docs; current
  rules should be stated once and old evidence linked.

## YAGNI

- Unused composite Tasks and Questions were pruned rather than retained for hypothetical reuse.
- Optional accessibility, visual, freshness, and performance proposals remain outside the backlog.
- The hard-coded two-product slug map is acceptable until scope expands.
- Do not add a framework-neutral abstraction layer; add only the fast tests needed for current
  branching policy.

## REST and OpenAPI

- Core Magento REST endpoints are used coherently and inputs are encoded.
- Product search uses exact-name filtering and validates count, name, and price.
- The cart-adopt route is intentionally non-RESTful and test-only; its default-off configuration
  is essential.
- N/A for OpenAPI ownership: Magento owns the API contract. Runtime schema validation could still
  protect this client from unexpected response shapes.

## ISTQB Strategies

- **Use-case testing:** strong end-to-end coverage of guest checkout and cart management.
- **Equivalence partitioning:** valid details, incomplete details, invalid email, successful
  payment, and deterministic decline are represented.
- **Boundary value analysis:** quantity 1 is a useful lower boundary, with 2 and 3 showing scaling;
  zero, maximum, and invalid quantities are not covered.
- **State transition testing:** cart empty/populated/updated/removed and checkout
  shipping/payment/success/decline states are exercised.
- **Decision tables:** not explicit. Shipping/payment combinations are deliberately narrow because
  the fixture store controls one intended route.
- **Risk-based testing:** strong emphasis on Knockout async behaviour, cached cart state, payment
  failure, report completeness, and cross-browser promotion evidence.

## Pedagogical Value

- Excellent evidence-based comments explain why a non-obvious implementation exists.
- ADRs and implementation logs expose trade-offs and discarded approaches.
- Feature files remain readable despite sophisticated infrastructure.
- Stale current-state guides now reduce teaching accuracy; Risk 7 should be treated as portfolio
  quality work, not cosmetic editing.
- Adding a small lower-layer suite would let the repository teach the test pyramid it currently
  assesses only in prose.

## Overall Architecture Rating

**Strong reference E2E architecture with a top-heavy test pyramid.** The system is cohesive,
observable, and evidence-led. Improvements should harden boundaries and feedback loops rather than
replace the Screenplay or CI design.

---

[<- Previous: Recommendations](05_RECOMMENDATIONS.md) | [Back to Index](00_CODE_REVIEW_CODEX_v1_20260723T2335Z.md) | [Next: Migration Plans ->](07_MIGRATION_PLANS.md)
