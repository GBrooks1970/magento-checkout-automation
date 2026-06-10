# PROJECT 001 - Test Automation Suite (features/ + src/)

[<- Back to Index](../00_CODE_REVIEW_CLAUDE_v1_20260610T1127Z.md) | [Next: PROJECT 002 ->](PROJECT_002_DeclinePayment_Module.md)

**Reviewer:** AI assistant (CLAUDE Fable 5)

The Cucumber + Serenity/JS + Playwright Screenplay implementation: 4 feature files (12 scenarios, 94 steps), 10 Tasks, 6 Questions, 3 PageElement modules, 4 step-definition modules, 1 hooks module, 1 API client.

- **Architecture and design patterns:** Textbook Screenplay layering with strict altitude discipline - step definitions are pure delegation ([checkout.steps.ts](../../src/step-definitions/checkout.steps.ts)), Tasks compose Interactions in domain language, selectors live exclusively in `interactions/`. The factory-object style (`const AddToCart = { product: (name) => Task.where(...) }`) is consistent across all ten Tasks. The one structural blemish is unused machinery: `CompleteCheckout` and two Questions exist without callers (finding R-07).

- **Async and wait strategy (the suite's core competency):** Every Knockout.js transition waits on element state with an explicit ceiling - `Wait.upTo(15-20 s)` - never elapsed time, and the distinction between Serenity's 5 s `Wait.until` default and Cucumber's step timeout is understood and documented at each site (e.g. [AddToCart.ts](../../src/tasks/AddToCart.ts) (lines 5-10), [ProvideShippingDetails.ts](../../src/tasks/ProvideShippingDetails.ts) (lines 5-7)). The occlusion-aware `isVisible()` lesson (assert attributes, act on visible labels) is applied consistently: `aria-invalid` for the email check ([validation.steps.ts](../../src/step-definitions/validation.steps.ts) (lines 29-41)), `label[for="checkmo"]` instead of the hidden radio ([CheckoutPage.ts](../../src/interactions/CheckoutPage.ts) (lines 44-52)).

- **Test isolation and browser lifecycle:** Launch once in `BeforeAll`, engage a fresh cast per `Before`, reset the shared context state (cookies + local/sessionStorage) instead of recreating it - with a do-not-revert warning citing the defect log ([browser.hooks.ts](../../src/hooks/browser.hooks.ts) (lines 20-77)). This is the correct resolution of a real diagnosed defect (backlog #8/#10). Residual fragility: the approach leans on observed v3 context-reuse behaviour while package.json carries caret ranges (finding R-04), and nothing asserts a clean cart at scenario start.

- **Gherkin quality:** Scenarios are genuinely declarative and business-readable; money is bare-number and subtotal-only by documented policy; tags (`@placesOrder`, the retired `@deferred`) carry operational meaning backed by profiles in [cucumber.js](../../cucumber.js). Two nits: the Background ordering in [checkout-validation.feature](../../features/checkout-validation.feature) (lines 7-9) seeds the cart *before* "I am browsing the storefront as a guest", making the browse step a semantic no-op; and the cart-seeding Given is UI-driven despite documented claims otherwise (finding R-03).

- **API layer:** [MagentoApiClient.ts](../../src/api/MagentoApiClient.ts) is small and purposeful - token resolved once per run with an error message that teaches the 2FA gotcha (lines 60-67), product verification asserts status, count, name, and price with a comment explaining why `total_count` matters. Step glue grants both `BrowseTheWeb` and `CallAnApi` to the same actor, demonstrating dual abilities cleanly.

- **Test coverage and approach:** The happy path, cart algebra (add/multi/update/remove), two sad paths, a quantity outline asserting computed subtotals at a real Magento surface, and a deterministic payment decline - a well-chosen, bounded set for the stated one-journey scope. Coverage gaps are deliberate and documented (no tax/shipping, no registered-customer flows, no admin); the only undocumented gap is that nothing asserts the *empty-cart-to-start* invariant the isolation fix depends on.

- **Documentation in code:** Comment density and quality are the differentiator - nearly every wait ceiling, selector choice, and lifecycle decision carries its rationale and a backlog/ADR pointer. One stale comment (30 s vs 60 s, [AddToCart.ts](../../src/tasks/AddToCart.ts) (line 7)).

- **Verification status:** `npx tsc --noEmit` clean and 12/12 scenarios / 94/94 steps bound on dry-run, both verified during this review. Full execution not performed here; the 12/12 CI green claim rests on [backlog.md](../../docs/backlog.md) (line 301) and the badge.

---

[<- Previous: Risks and Issues](../02_RISKS_AND_ISSUES.md) | [Back to Index](../00_CODE_REVIEW_CLAUDE_v1_20260610T1127Z.md) | [Next: PROJECT 002 ->](PROJECT_002_DeclinePayment_Module.md)
