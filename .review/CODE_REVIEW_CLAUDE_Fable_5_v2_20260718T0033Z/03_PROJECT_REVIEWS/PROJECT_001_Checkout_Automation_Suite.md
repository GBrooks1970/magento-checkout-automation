# PROJECT_001: Checkout Automation Suite

[<- Back to Index](../00_CODE_REVIEW_CLAUDE_Fable_5_v2_20260718T0033Z.md) | [Next: Cross-Project Analysis ->](../04_CROSS_PROJECT_ANALYSIS.md)

**Reviewer:** AI assistant (CLAUDE Fable 5)
**Date:** 2026-07-18T00:33Z

Single-project repository: this is the only project review (template single-repository note).

## Architecture and design patterns

- Faithful Screenplay implementation across the whole vertical: 4 feature files -> 4 thin
  step-definition modules -> 10 Tasks -> 3 Interaction (PageElement) modules -> 5 Questions,
  with abilities granted per scenario in [src/hooks/browser.hooks.ts](src/hooks/browser.hooks.ts)
  (lines 125-181). No Page Object leakage; locators live only in `src/interactions/`.
- The API layer ([src/api/MagentoApiClient.ts](src/api/MagentoApiClient.ts)) cleanly separates
  plain-async precondition helpers (`skuForProduct`, `createGuestCart`, `addItemToGuestCart` -
  called from Given steps) from the Screenplay `Task` (`verifyProductIsAvailable`) that
  participates in the Serenity narrative. "API setup, UI assertion" (ADR-0003/0006) is genuinely
  realised: cart seeding goes through REST plus the in-repo `Portfolio_CartSeed` adopt endpoint
  ([src/tasks/AdoptSeededCart.ts](src/tasks/AdoptSeededCart.ts)), not UI clicking.
- Two small in-repo Magento PHP modules (`app/code/Portfolio/DeclinePayment`,
  `app/code/Portfolio/CartSeed`) are test fixtures baked into the store image - deterministic
  payment failure without a PSP (ADR-0005) and guest-quote session binding that core Magento
  lacks (ADR-0006). This is the repo's most distinctive senior-judgement evidence.
- The new trace/video capability (backlog #13) is architected as a strictly additive second hook
  path: `TRACE=on-failure` switches to per-scenario isolated contexts
  (`BrowseTheWebWithPlaywright.usingPage`) because `recordVideo` is context-creation-time only,
  while the default path - and its carefully-tuned cart-isolation reset - is untouched
  ([src/hooks/browser.hooks.ts](src/hooks/browser.hooks.ts) (lines 37-73)).

## Code quality and maintainability

- `strict: true` TypeScript, clean `npx tsc --noEmit` (verified). Consistent file-per-concept
  layout; no dead `CompleteCheckout` any more (pruned in an earlier cycle).
- Waits are all explicit, bounded, and justified in comments; the only global timeout is
  Cucumber's step ceiling at 60s, documented against the sum of chained waits
  ([src/hooks/browser.hooks.ts](src/hooks/browser.hooks.ts) (lines 76-82)).
- The `After` trace finalisation correctly sequences stop-tracing -> capture video handle ->
  close context (flushes video) -> rename-or-delete
  ([src/hooks/browser.hooks.ts](src/hooks/browser.hooks.ts) (lines 190-222)); module-level
  `tracedContext`/`tracedPage` state is safe because Cucumber runs scenarios serially in-process.
- Minor: the slug map duplication noted in [Risk 6](../02_RISKS_AND_ISSUES.md); env-var parsing
  is duplicated-but-consistent across `screenshots.ts`, `browser.hooks.ts` (`HEADLESS`, `TRACE`,
  `BROWSER`) - a tiny `env.ts` helper would centralise defaults, but YAGNI applies at this size.

## Test coverage and approach

- 9 scenarios + 1x3 outline = 12 runtime scenarios / 94 steps covering: happy-path order,
  cart totals, quantity outline (boundary-flavoured 1/2/3), cart add/add-multiple/update/remove,
  two negative checkout-validation scenarios, and a deterministic payment decline. Dry-run
  binding verified for both profiles (12 and 7) during this review.
- Tag strategy is coherent and enforced by profile, not path filters: `@placesOrder` and
  `@usesDeclineModule` partition store-mutating and module-dependent scenarios;
  `smoke` = `not @deferred and not @placesOrder and not @usesDeclineModule` is genuinely
  store-safe ([cucumber.js](cucumber.js) (lines 26-43)). No `@deferred` scenarios remain - the
  quarantine mechanism is retained but empty, with the rationale comment updated in
  [features/payment-failure.feature](features/payment-failure.feature) (lines 1-6).
- The suite is E2E-only by design (see [06_ARCHITECTURE_ASSESSMENT.md](../06_ARCHITECTURE_ASSESSMENT.md)
  on the test pyramid); the API layer partially compensates by pushing setup below the UI.
- Engine coverage is now three browsers in CI, but with WebKit red and untracked
  ([Risk 3](../02_RISKS_AND_ISSUES.md)).

## Documentation quality

- Outstanding in depth and honesty: seven ADRs with alternatives and concrete code, a
  battle-tested Docker runbook, an admin-token guide, a Gherkin style guide with a real
  refactor example, and a backlog that reads as a defensible engineering log.
- Currently let down at the summary surfaces: backlog header/Status/Summary rows, README Status,
  and CHANGELOG all lag the 2026-07-17 reality, and PR #37 has no implementation log
  ([Risk 1](../02_RISKS_AND_ISSUES.md)).

## Strengths

- Real store, real orders, real decline handling - no mocked storefront anywhere; the two
  fixture modules solve genuine Magento gaps in-repo with zero secrets or network dependencies.
- Every past incident is converted into an executable guard or a warning comment at the exact
  point of temptation (formatter slot, hook lifecycle, cookie-clear ordering, image-tag policy,
  scenario-count guard).
- Security-conscious defaults: localhost-only credential fallback with fail-fast refusal
  ([src/api/MagentoApiClient.ts](src/api/MagentoApiClient.ts) (lines 76-83)); gitignored
  `auth.json`; 0 audit vulnerabilities.

## Weaknesses

- Documentation summary-surface drift is now a demonstrated recurring habit, not a one-off
  (Risk 1).
- The publish pipeline can still ship an empty report on infrastructure failure (Risk 2).
- Cross-engine ambition currently outruns cross-engine engineering: matrix wired, timings not
  portable, follow-up untracked (Risk 3).

---

[<- Previous: Risks and Issues](../02_RISKS_AND_ISSUES.md) | [Back to Index](../00_CODE_REVIEW_CLAUDE_Fable_5_v2_20260718T0033Z.md) | [Next: Cross-Project Analysis ->](../04_CROSS_PROJECT_ANALYSIS.md)
