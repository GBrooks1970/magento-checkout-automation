# Architecture Assessment

[<- Back to Index](00_CODE_REVIEW_CLAUDE_Fable_5_v1_20260706T1048Z.md) | [Next: Migration Plans ->](07_MIGRATION_PLANS.md)

**Reviewer:** AI assistant (CLAUDE Fable 5)
**Date:** 2026-07-06T10:48Z

## Test Pyramid

- The repo is deliberately E2E-heavy: 12 UI-driving scenarios, no unit or
  component layer. For a portfolio whose subject *is* E2E architecture against
  a third-party platform, this inversion is a documented scope choice, not an
  accident - the README bounds the repo to one journey.
- The API-driven Backgrounds function as a thin integration layer: every
  scenario fails fast at the API if its data assumption is wrong, before any
  UI cost is paid ([background.steps.ts](../../src/step-definitions/background.steps.ts)).
- Gap, stated honestly: pure functions such as `resolveMode()` in
  [src/config/screenshots.ts](../../src/config/screenshots.ts) and
  `targetIsLocalhost()` in
  [MagentoApiClient.ts](../../src/api/MagentoApiClient.ts) are unit-testable
  but untested; their env-matrix behaviour was verified manually (backlog #12
  records six combinations). Low value at current size; would matter if the
  config surface grows.

## SOLID Principles

- **SRP:** strong - each Task does one journey step; Questions read one value;
  selectors live in one layer; the two PHP modules each do exactly one fixture
  job.
- **OCP:** the crew assembly extends by composition
  (`...(photo ? [photo] : [])` in
  [serenity.config.ts](../../src/serenity.config.ts) line 25); adding a
  payment method means adding a label selector and a Task variant, not
  modifying existing ones.
- **LSP/ISP:** largely N/A in a functional-composition codebase; the
  interfaces used (`StageCrewMember`, `ObserverInterface`,
  `HttpGetActionInterface`, `CommandInterface`) are implemented per contract.
- **DIP:** the suite depends on Serenity abstractions (`PageElement`,
  abilities) rather than raw Playwright handles; the PHP controller depends on
  Magento service contracts (`CartRepositoryInterface`,
  `MaskedQuoteIdToQuoteIdInterface`), not concrete models.

## KISS

- The repo consistently prefers the boring solution: tag filters over CLI path
  arguments, a config-gated GET endpoint over a bespoke auth scheme, a
  two-entry slug map over a lookup service, `curl` warm-up loops over a
  bespoke priming harness.
- Where complexity exists (the three-step `Before` reset, the bake pipeline's
  guards), it is complexity that a named failure demanded, with the failure
  cited.

## YAGNI

- Good discipline: the unused `CompleteCheckout` composite flagged in backlog
  #11 has actually been pruned; screenshots/trace/cross-browser were held as
  proposals until explicitly promoted rather than speculatively built.
- The retained-but-never-invoked `DeclineCommand` is a conscious YAGNI
  exception argued on gateway-contract completeness grounds in its header
  (ADR-0005 note) - acceptable because the alternative is a silent success on
  any future code path that does invoke authorize/sale.

## REST + OpenAPI

- Correct consumption of Magento REST V1 (token, products search with encoded
  `searchCriteria`, guest-carts) with status checks and descriptive errors on
  every call.
- The adopt endpoint's REST violation (GET side effect) is documented,
  config-gated, and 404-camouflaged on non-test stores - the right shape for a
  test fixture.
- No OpenAPI spec is published; N/A - the repo consumes a third party's API
  and exposes none of its own beyond the fixture route.

## ISTQB Strategies

- **Equivalence partitioning / boundary-ish coverage:** the quantity outline
  (1, 2, 3 with expected subtotals) exercises the multiplication boundary
  minimally; sad paths partition checkout input into missing-details and
  invalid-email classes.
- **Use case testing:** the suite is organised around a single end-to-end use
  case with alternates (decline, validation failure) - textbook.
- **State transition testing:** implicit in the multi-step checkout
  (address -> method -> payment -> confirmation) with non-advancement asserted
  as the negative transition ("I should not be able to advance to payment").
- Decision tables are N/A at this scope. The qa-strategy doc maps the risk
  reasoning; techniques are applied where they earn their keep rather than
  performed for coverage theatre.

## Pedagogical Comments

- The best-in-portfolio dimension of this repo: comments teach the *why* at
  the exact point of temptation (why not to move the browser launch back into
  `Before`, why the cookie clear must come last, why `setDefaultTimeout` does
  not bound Serenity waits, why the payment radio can never be visible).
- Workflow files carry the same standard - `bake.yml` and `ci.yml` read as
  annotated case studies of the failures they prevent.
- The one gap is trivial (a stale doc path in a comment,
  [Risk 6](02_RISKS_AND_ISSUES.md#risk-6)).

---

[<- Previous: Recommendations](05_RECOMMENDATIONS.md) | [Back to Index](00_CODE_REVIEW_CLAUDE_Fable_5_v1_20260706T1048Z.md) | [Next: Migration Plans ->](07_MIGRATION_PLANS.md)
