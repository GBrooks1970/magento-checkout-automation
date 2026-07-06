# PROJECT 001: Checkout Automation Suite (magento-checkout-automation)

[<- Back to Index](../00_CODE_REVIEW_CLAUDE_Fable_5_v1_20260706T1048Z.md) | [Next: Cross-Project Analysis ->](../04_CROSS_PROJECT_ANALYSIS.md)

**Reviewer:** AI assistant (CLAUDE Fable 5)
**Date:** 2026-07-06T10:48Z

This is a single-project repository; per the template's single-repository
customisation, this is the only project review file. It covers the test suite,
the two in-repo Magento fixture modules, and the Docker/CI infrastructure that
carries them.

## Stack and intent (established from README.md and package.json)

Cucumber 11.3.0 + Serenity/JS 3.43.2 + Playwright 1.60.0, TypeScript strict via
ts-node, targeting a Dockerised Magento 2.4.8 (Luma) storefront. Intent: a
bounded, reviewer-ready demonstration of senior automation architecture -
one guest-checkout journey, API-driven setup, Screenplay implementation,
living documentation.

## Architecture and design patterns

- **Screenplay is implemented faithfully, not nominally.** Actors are engaged
  per scenario with two abilities (`BrowseTheWebWithPlaywright`, `CallAnApi`)
  in [src/hooks/browser.hooks.ts](../../../src/hooks/browser.hooks.ts) (lines
  87-92); Tasks (`src/tasks/`, 10 files) compose web interactions and read like
  the Gherkin that drives them; Questions (`src/questions/`, 4 files) are thin
  `Text.of`/`describedAs` wrappers; selectors are confined to
  `src/interactions/` (3 page modules). No Page Object leakage into steps.
- **Step definitions are genuinely thin glue** - almost every step is a single
  `actorCalled('User').attemptsTo(...)` call
  ([src/step-definitions/checkout.steps.ts](../../../src/step-definitions/checkout.steps.ts)).
  The two exceptions (`ensureCartCount` with its reload-then-poll strategy and
  the R-08 soft-signal interaction in
  [cart.steps.ts](../../../src/step-definitions/cart.steps.ts) lines 544-578)
  are documented responses to a real customer-data refresh race, not pattern
  erosion.
- **The two PHP fixture modules are the architectural highlight.**
  `Portfolio_DeclinePayment` forces a deterministic decline via a
  `sales_model_service_quote_submit_before` observer
  ([DeclineOrder.php](../../../app/code/Portfolio/DeclinePayment/Observer/DeclineOrder.php))
  with the never-invoked gateway command retained and explained for contract
  completeness ([DeclineCommand.php](../../../app/code/Portfolio/DeclinePayment/Gateway/Command/DeclineCommand.php),
  header comment). `Portfolio_CartSeed` closes a genuine core-Magento gap
  (no API to bind a guest quote to a storefront session) with a config-gated
  GET endpoint that 404s unless `cartseed/general/active` is set
  ([Adopt.php](../../../app/code/Portfolio/CartSeed/Controller/Cart/Adopt.php)
  lines 76-79) - the "GET with a side effect" trade-off is stated in the file
  header rather than hidden.

## Code quality and maintainability

- `npx tsc --noEmit` clean under `strict: true`
  ([tsconfig.json](../../../tsconfig.json)); no `any`-escape hatches observed
  in the suite code.
- Comment discipline is exceptional: non-obvious choices cite the CI run, live
  DOM probe, or backlog item that motivated them (e.g. the `about:blank` park
  before `clearCookies()` citing CI run 27295894167,
  [browser.hooks.ts](../../../src/hooks/browser.hooks.ts) lines 69-77; the
  decline-message scope citing run 27295475559,
  [CheckoutPage.ts](../../../src/interactions/CheckoutPage.ts) lines 395-405).
- Naming and layout follow the documented layer conventions; there are no dead
  files (the previously flagged unused `CompleteCheckout` composite has been
  pruned from `src/tasks/`).
- Minor: stale comment path in
  [src/config/screenshots.ts](../../../src/config/screenshots.ts) line 14
  (see [Risk 6](../02_RISKS_AND_ISSUES.md#risk-6)).

## Test coverage and approach

- 12 scenarios / 94 Gherkin steps across 4 feature files (counts verified by
  dry-run and static count - see [ANNEX/METRICS.md](../ANNEX/METRICS.md)):
  happy-path order, cart total, quantity outline (x3), 4 cart-management
  scenarios, 2 validation sad paths, 1 deterministic payment decline.
- **Deferred/quarantined coverage: none remaining.** The only ever-quarantined
  scenario (`payment-failure.feature`, formerly `@deferred`) was activated
  2026-06-09 and runs in CI; the `not @deferred` filter in
  [cucumber.js](../../../cucumber.js) (line 22) is now a no-op kept as the
  quarantine mechanism. Planned-but-unimplemented coverage is exactly what the
  backlog says it is: Item #13 (trace/video on failure) and #14 (cross-browser
  matrix) are READY TO START and nothing in the repo pretends otherwise;
  proposals 0004-0007 remain explicitly proposal-stage in
  [docs/planning/proposals/](../../../docs/planning/proposals/README.md).
- **Isolation and lifecycle:** browser launched once per run (`BeforeAll`),
  per-scenario state reset in `Before` with a three-step ordered teardown
  (storage clear on-origin, park on `about:blank` to abort in-flight requests,
  cookies cleared last and deliberately un-caught) - each ordering constraint
  is evidence-cited. This is the strongest isolation story in the portfolio
  because it was earned against a real leak (cart counts 3-where-2, 8-where-1,
  backlog #10).
- **Waits:** all condition-based; per-wait ceilings (15-20 s) sized to the
  documented KO.js render costs; Cucumber step ceiling 60 s sits above the sum
  of chained waits ([browser.hooks.ts](../../../src/hooks/browser.hooks.ts)
  lines 10-16). No sleeps anywhere.
- **Data setup and auth:** product preconditions verified via the REST
  catalogue API; cart preconditions seeded via guest-cart REST + the adopt
  endpoint; admin token resolved once per run, with the well-known test
  credentials gated to localhost targets only
  ([MagentoApiClient.ts](../../../src/api/MagentoApiClient.ts) lines 43-86,
  review R-09). No secrets in the tree: `auth.json` is gitignored
  ([.gitignore](../../../.gitignore) line 30) and the hard-coded
  `admin`/`Password123!` pair is a baked, disposable test-store credential,
  documented as such in README and workflows.

## Documentation quality

- Seven ADRs with alternatives and concrete code; priority-scored backlog with
  per-item evidence trails; 5 implementation logs; runbook
  (`docs/docker-magento-setup.md`) that records its own first-bring-up snags;
  strategy docs versioned. The one material inconsistency is the README Status
  vs backlog Items #13/#14 ([Risk 2](../02_RISKS_AND_ISSUES.md#risk-2)).
- The feature manifest ([features/_manifest.md](../../../features/_manifest.md))
  documents the naming exception and the shared-step economy - a nice touch
  most suites lack.

## Strengths

- Evidence-first engineering culture: nearly every guard, wait, and selector is
  traceable to a named failure.
- CI defence in depth (preflight image gate, warm-up with status assertions,
  Serenity-JSON guard, publish-on-failure policy documented in the README so it
  reads as intended behaviour).
- Deterministic, secret-free payment failure - a hard problem solved in-repo
  and fully documented (ADR-0005).

## Weaknesses

- Dev-dependency audit debt (1 high, 5 moderate -
  [Risk 1](../02_RISKS_AND_ISSUES.md#risk-1)).
- README status drift ([Risk 2](../02_RISKS_AND_ISSUES.md#risk-2)); missing
  licence ([Risk 3](../02_RISKS_AND_ISSUES.md#risk-3)).
- Single-engine (Chromium-only) coverage until Item #14 lands - a known,
  backlogged gap, not a silent one.

---

[<- Previous: Risks and Issues](../02_RISKS_AND_ISSUES.md) | [Back to Index](../00_CODE_REVIEW_CLAUDE_Fable_5_v1_20260706T1048Z.md) | [Next: Cross-Project Analysis ->](../04_CROSS_PROJECT_ANALYSIS.md)
