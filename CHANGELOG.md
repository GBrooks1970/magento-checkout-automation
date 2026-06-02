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
