# Changelog

All notable changes to magento-checkout-automation will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added

- Added `docs/templates/` containing seven amended project-specific document templates:
  `decision-record`, `qa-strategy`, `screenplay-guide`, `stack-architecture`, `backlog`,
  `implementation-log`, and `changelog`
- Added populated live docs: `docs/architecture.md`, `docs/screenplay-guide.md`,
  `docs/qa-strategy.md`, `docs/backlog.md`
- Added `CHANGELOG.md`
- Added `docs/implementation-logs/2026-06-02_phases-1-3.md` recording the Phase 1–3 session

- Added `docs/implementation-logs/2026-06-02_live-smoke-test.md` recording the first live run against a public Magento sandbox (Magebit), validating the methodology and identifying new blockers
- Added backlog Items #8 (browser-lifecycle defect — fixed), #9 (order-scenario tagging + smoke profile — done), and #10 (live-run selector/timeout drift), discovered by the live smoke test
- Added `@placesOrder` tag to the two order-placing scenarios in `features/guest-checkout.feature`
- Added a `smoke` profile to `cucumber.js` (`tags: 'not @deferred and not @placesOrder'`) for safe read-only runs against shared stores
- Added a `test:smoke` npm script (`cucumber-js --profile smoke`) (backlog Item #7)
- Added `docs/docker-magento-setup.md` — the Dockerised Magento bring-up runbook (Composer auth, create-project with Luma sample data, `setup:install`, `sampledata:deploy`, reindex, cache flush, run), documenting the Adobe Marketplace auth-keys requirement, the ~30-minute/≥6 GB cost, and first-bring-up validation risks (backlog Item #1)

- Added `docker/nginx/default.conf` — a test-target nginx vhost that serves Magento over plain HTTP on `:8000` (host `:8080`), overriding the upstream image's HTTP→HTTPS redirect so `BASE_URL=http://localhost:8080` works without self-signed-cert handling. Bind-mounted by `docker-compose.yml` (backlog Item #1)
- Added `auth.json` to `.gitignore` — Magento Marketplace Composer credentials must never be committed (backlog Item #1)

- Added `src/questions/OrderSummary.ts` and a `the order summary subtotal should be "…"` step — the guest-checkout quantity outline now verifies the subtotal on the checkout Order Summary sidebar (the only Luma 2.4.8 surface that exposes order totals), asserted at the payment step before the order is placed (backlog Item #11)
- Added `CheckoutPage.checkMoneyOrderLabel` and `CheckoutPage.orderSummarySubtotal` PageElements; first full `@placesOrder` end-to-end run is green — 4/4 scenarios, 40/40 steps, placing real orders against the Docker store (backlog Item #11)

### Changed

- Changed `docker-compose.yml` — replaced the unpinned skeleton with a pinned, healthchecked infrastructure stack derived from Mark Shust's docker-magento v53.0.0 (nginx 1.28, PHP 8.4-FPM, MariaDB 11.4, Valkey 8.1, OpenSearch 3, RabbitMQ 4.2), storefront on `:8080`, developer-only services and host mounts dropped. The `app` service bind-mounts the HTTP vhost override. **Validated end-to-end on 2026-06-03**: brings up a working Magento 2.4.8 store with 2040 Luma products (backlog Item #1)
- Changed `docs/docker-magento-setup.md` — rewritten from a theoretical plan into the **validated** bring-up procedure: corrected version pin to 2.4.8, documented the project-root `auth.json` requirement for `sampledata:deploy`, the Git-Bash path-mangling workaround, the `nginx.conf` copy step, and recorded the test-isolation defect surfaced by the first clean-store run (backlog Items #1, #10)
- Changed `docs/backlog.md` — Item #1 marked validated (store stands up green); Item #10 updated: the cart-count "8" is a real cross-scenario test-isolation bug, not shared-demo contamination as previously assumed
- Changed `.github/workflows/ci.yml` — reconciled with the real compose service names (`phpfpm`/`app`, not `magento`), added Composer-auth and install steps referencing the runbook and `MAGENTO_PUBLIC_KEY`/`MAGENTO_PRIVATE_KEY` secrets, and set `BASE_URL=http://localhost:8080` for the run (backlog Item #1)
- Changed cart/checkout selectors and assertions to match live Luma 2.4.8, taking smoke from 5 to 42 of 44 steps (5 of 7 scenarios green) against the Docker store (backlog Item #10): cart subtotal `.totals.sub .price` (+ the subtotal step now views the cart first); cart-row quantity/delete scoped via the product photo link `a[title=…]` and `tbody.cart.item` (the delete link is in a sibling `tr.item-actions`); count assertions poll with `Wait.until` to ride out the async cart-counter refresh; "should not advance to payment" asserts the payment section is not visible rather than the flaky email-field visibility. The two checkout-validation "see a validation message" scenarios remain open pending a spec decision (documented in the backlog and the setup runbook)
- Changed `docs/docker-magento-setup.md` — added the `checkout/cart_link/use_qty=1` configuration step (header cart counter shows total quantity, matching the "cart should contain N items" semantics)

- Changed `README.md` — replaced the "Running the suite" placeholder with documented run paths: the live read-only smoke (`BASE_URL=https://magento2-demo.magebit.com npm run test:smoke`, including the tag-scoping safety note and a Windows PowerShell variant) and the Docker full-suite path; added the `npx playwright install chromium` step, a "Continuous integration" section, and an updated "Status" reflecting the validated live methodology (backlog Item #7)

- Changed `src/hooks/browser.hooks.ts` — launch the browser once in `BeforeAll` and close it in `AfterAll`, keeping `engage(Cast.where(...))` per-scenario in `Before`. Fixes a lifecycle defect where only the first scenario per run passed and all others failed at first navigation with "Target page, context or browser has been closed" (backlog Item #8)
- Changed `src/interactions/CartPage.ts` — `proceedToCheckoutButton` now uses `button[data-role="proceed-to-checkout"]` instead of the ambiguous `button.action.primary.checkout`, which also matched the header mini-cart button and caused a Playwright strict-mode violation on live Luma (backlog Item #10)
- Changed `src/interactions/CheckoutPage.ts` — `placeOrderButton` scoped to `.payment-method-content` to remove the same latent selector ambiguity (backlog Item #10)
- Changed `src/hooks/browser.hooks.ts` — added `setDefaultTimeout(30 s)` so live Magento steps (network + Knockout.js re-renders) no longer hit Cucumber's 5 s default (backlog Item #10)
- Changed `src/tasks/ProceedToCheckout.ts` — checkout email-field wait raised to `Wait.upTo(20 s)` for the heavy Knockout.js checkout render (backlog Item #10)
- Changed `docs/adr/0002-use-serenity-js.md` — corrected the browser-hook example and accompanying note, which previously showed the per-`Before` launch/close pattern (proven defective by Item #8) and asserted it was canonical; now shows the launch-once `BeforeAll`/`Before`/`AfterAll` pattern (backlog Item #5)

- Changed `docs/gherkin-style-guide.md` — replaced the before/after worked-example placeholder with a real refactor: a bloated imperative scenario rewritten into the actual `Complete a guest order with valid details` scenario, with commentary mapping each change to a documented principle (backlog Item #6)

- Changed `src/tasks/ProvidePaymentDetails.ts` — selects Check / Money Order via the visible `label[for="checkmo"]` rather than the radio input, which Luma renders zero-size/`display:none` (never `isVisible()`); waits `upTo(15 s)` for the AJAX-rendered payment step (backlog Item #11)
- Changed `src/tasks/PlaceTheOrder.ts` — waits `upTo(20 s)` for the order confirmation, since placing the order is an AJAX submit followed by a redirect that exceeds Serenity's 5 s default (backlog Item #11)
- Changed `src/interactions/CheckoutPage.ts` — fixed `orderNumber` to `.checkout-success p span` (Luma renders the id as `Your order # is: <span>…</span>`; there is no `.order-number` element) and replaced the unsatisfiable success-page `orderSubtotal` with `orderSummarySubtotal` reading the checkout Order Summary (the success page carries no totals) (backlog Item #11)
- Changed `features/guest-checkout.feature` — rewrote the "Order multiple quantities" outline into explicit checkout steps that assert the subtotal on the Order Summary at the payment step before placing the order (backlog Item #11)

---

## [0.3.0] — 2026-06-02

Screenplay layer implementation — all tasks, interactions, questions, and step definitions.

### Added

- Added `src/interactions/StorefrontPage.ts`, `CartPage.ts`, `CheckoutPage.ts` — PageElement definitions for the product, cart, and checkout pages
- Added `src/tasks/AddToCart.ts`, `BrowseStorefront.ts`, `CompleteCheckout.ts`, `PlaceTheOrder.ts`, `ProceedToCheckout.ts`, `ProvidePaymentDetails.ts`, `ProvideShippingDetails.ts`, `RemoveFromCart.ts`, `SelectShippingMethod.ts`, `UpdateCartQuantity.ts`
- Added `src/questions/CartItemCount.ts`, `CartSubtotal.ts`, `OrderConfirmation.ts`, `ValidationMessage.ts`
- Added `src/hooks/browser.hooks.ts` — Playwright browser launched and torn down per scenario via Cucumber `Before`/`After` hooks; resolves `Cast.where` synchronous constraint
- Added `src/api/MagentoApiClient.ts` — Magento REST V1 client stub for product verification; Background steps use UI fallback pending live target
- Added `src/step-definitions/background.steps.ts`, `checkout.steps.ts`, `cart.steps.ts`, `validation.steps.ts`

### Changed

- Changed `src/serenity.config.ts` — moved actor setup to `browser.hooks.ts`; crew now uses `createSerenityBDDReporter()` factory and `ArtifactArchiver`; exports `BASE_URL`
- Changed `cucumber.js` — added `src/hooks/**/*.ts` to `require` array; removed `formatOptions.serenityConfig` (redundant with require)

---

## [0.2.0] — 2026-06-02

Serenity/JS project initialisation and line-ending normalisation.

### Added

- Added `package.json` with `@serenity-js/*` v3.43, `@cucumber/cucumber` v11, `@playwright/test` v1.60, `typescript` v5.9, `ts-node` v10 dependencies
- Added `tsconfig.json` — CommonJS, ES2020, strict mode
- Added `cucumber.js` — default profile wiring `features/` and `src/step-definitions/`; `@deferred` excluded
- Added `src/serenity.config.ts` — initial crew and actor configuration
- Added `.gitattributes` — enforces LF line endings across all text files

---

## [0.1.0] — 2026-06-01

Repository scaffold and Gherkin specifications — SDD evidence baseline.

### Added

- Added `features/guest-checkout.feature` — happy path, cart total, quantity outline (3 scenarios)
- Added `features/cart-management.feature` — add, add multiple, update quantity, remove (4 scenarios)
- Added `features/checkout-validation.feature` — missing fields, invalid email (2 scenarios)
- Added `features/payment-failure.feature` — declined card (`@deferred`, 1 scenario)
- Added `features/_manifest.md` — feature file index
- Added `docs/adr/0001-use-screenplay-over-page-objects.md`
- Added `docs/adr/0002-use-serenity-js.md`
- Added `docs/adr/0003-api-driven-test-data-setup.md`
- Added `docs/adr/0004-playwright-over-cypress.md`
- Added `docs/adr/README.md` — ADR index
- Added `docs/gherkin-style-guide.md`
- Added `docs/reports/.gitkeep`
- Added `src/README.md` and Screenplay layer folder scaffolding
- Added `.github/workflows/ci.yml` — CI skeleton (pending live target decision)
- Added `docker-compose.yml` — Docker skeleton (pending live target decision)
- Added `.gitignore` — Node, Playwright, and Serenity ignores
- Added `README.md` — project rationale, methodology, tooling, and layout

<!--
  CHANGELOG RULES:
  - Entries MUST be written in the past tense, imperative voice: "Added X" not "Adds X"
  - NEVER edit or delete past entries
  - Breaking changes MUST be flagged with **BREAKING:** at the start of the entry
-->
