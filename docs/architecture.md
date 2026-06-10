# Magento Checkout Automation — Architecture Guide

**Version:** 2
**Last Updated:** 2026-06-10

---

## 1. Overview

- **Purpose:** Demonstrate senior test-automation architecture against the Magento Luma storefront guest checkout journey, using Spec-Driven Development, BDD, and the Screenplay pattern.
- **Surface type:** UI — Magento Luma storefront (Knockout.js checkout)
- **Language / Framework:** TypeScript + Serenity/JS 3.43 + Playwright 1.60 + Cucumber 11
- **Test target:** `BASE_URL` env var — defaults to `http://localhost:8080`, the local Dockerised Magento 2.4.8 store (pre-baked GHCR images locally and in CI — see `docs/docker-magento-setup.md`).
- **Automation entry point:** `npm test` — runs Cucumber with `--tags "not @deferred"` (no scenario currently carries the tag; the full suite of 12 scenarios runs)

---

## 2. Project Composition

### Test Target (Subject Application)

The subject application is the Magento Open Source (Luma theme) storefront. It is an external application, not owned by this repository.

- **URL:** Configured via `BASE_URL` environment variable
- **Sample data:** Luma sample products assumed pre-loaded (`Push It Messenger Bag`, `Fusion Backpack`)
- **Key surface:** Guest checkout — shipping address → shipping method → payment → order confirmation
- **Async renderer:** Knockout.js — the checkout re-renders after each step via XHR; all waits must be on element state or network, never on time

### Test Runtime

- **Feature files:** `features/**/*.feature` — discovered by Cucumber; `@deferred` excluded
- **Step definitions:** `src/step-definitions/**/*.ts` — thin glue between Gherkin and Tasks
- **Screenplay interactions:** `src/interactions/` — PageElement definitions per page area
- **Screenplay tasks:** `src/tasks/` — composed activities
- **Screenplay questions:** `src/questions/` — state assertions
- **Hooks:** `src/hooks/browser.hooks.ts` — browser launched once per run (`BeforeAll`); per-scenario state reset (cookies + storage) in `Before` for cart isolation
- **API client:** `src/api/MagentoApiClient.ts` — Magento REST V1; Background steps verify product preconditions through it (admin token resolved once per run, ADR-0003)
- **Serenity config:** `src/serenity.config.ts` — crew: ArtifactArchiver, SerenityBDDReporter, ConsoleReporter

### Tooling

| Command | Purpose |
|---|---|
| `npm test` | Run the active suite (excludes `@deferred`) |
| `npx tsc --noEmit` | TypeScript type check |
| `HEADLESS=false npm test` | Run with visible browser for debugging |
| `npm run test:report` | Generate Serenity BDD HTML report from JSON artifacts |

---

## 3. Folder Map

```
magento-checkout-automation/
├── features/                          # Gherkin specifications — committed before implementation (SDD)
│   ├── _manifest.md                   # Feature file index and coverage notes
│   ├── guest-checkout.feature         # Happy path: add to cart → order confirmation
│   ├── cart-management.feature        # Add, update quantity, remove
│   ├── checkout-validation.feature    # Required fields, invalid email
│   └── payment-failure.feature        # Active — deterministic decline via Portfolio_DeclinePayment (ADR-0005)
├── src/
│   ├── serenity.config.ts             # Crew configuration (reporters, ArtifactArchiver)
│   ├── hooks/
│   │   └── browser.hooks.ts           # Browser launched once (BeforeAll); per-scenario state reset (Before)
│   ├── interactions/                  # PageElement definitions per page area
│   │   ├── StorefrontPage.ts          # Product page elements + URL slug map
│   │   ├── CartPage.ts                # Cart page elements
│   │   └── CheckoutPage.ts            # Checkout steps: shipping, method, payment, confirmation
│   ├── tasks/                         # Screenplay Tasks
│   │   ├── AddToCart.ts
│   │   ├── BrowseStorefront.ts
│   │   ├── CompleteCheckout.ts        # Compound: shipping + method + payment + place
│   │   ├── PlaceTheOrder.ts
│   │   ├── ProceedToCheckout.ts
│   │   ├── ProvidePaymentDetails.ts
│   │   ├── ProvideShippingDetails.ts  # Variants: valid(), withEmail(e), incomplete()
│   │   ├── RemoveFromCart.ts
│   │   ├── SelectShippingMethod.ts
│   │   └── UpdateCartQuantity.ts
│   ├── questions/                     # Screenplay Questions
│   │   ├── CartItemCount.ts
│   │   ├── CartSubtotal.ts
│   │   ├── OrderConfirmation.ts
│   │   ├── OrderSummary.ts            # Checkout Order Summary subtotal (asserted at the payment step)
│   │   ├── PaymentError.ts            # Decline message (payment-failure scenario)
│   │   └── ValidationMessage.ts
│   ├── api/
│   │   └── MagentoApiClient.ts        # REST V1 client — admin token + product verification (ADR-0003)
│   ├── actors/                        # Reserved — actor setup handled via hooks
│   └── step-definitions/
│       ├── background.steps.ts        # Given steps (product availability, guest context, cart)
│       ├── checkout.steps.ts          # When/Then for checkout journey
│       ├── cart.steps.ts              # When/Then for cart management
│       └── validation.steps.ts        # When/Then for validation scenarios
├── docs/
│   ├── adr/                           # Architecture Decision Records (0001–0005)
│   ├── templates/                     # Document templates for this project
│   ├── implementation-logs/           # Per-session development logs
│   ├── reports/                       # Serenity BDD output (runtime — gitignored)
│   ├── architecture.md                # This file
│   ├── screenplay-guide.md
│   ├── qa-strategy.md
│   ├── backlog.md
│   └── gherkin-style-guide.md
├── app/code/Portfolio/DeclinePayment/ # In-repo Magento test-fixture module — deterministic decline (ADR-0005)
├── .github/workflows/
│   ├── ci.yml                         # e2e: pull pre-baked images → start store → warm-up → suite → Pages
│   └── bake.yml                       # Manual: install Magento once, push store-app/store-db images to GHCR
├── docker-compose.yml                 # Full local stack (nginx, phpfpm, mariadb, valkey, opensearch, rabbitmq)
├── docker-compose.ci.yml              # Overlay swapping in the pre-baked GHCR images
├── Dockerfile.store-app               # Pre-baked image definitions (built by bake.yml)
├── Dockerfile.store-db
├── cucumber.js                        # Cucumber profile — paths, tags, format, ts-node
├── tsconfig.json                      # CommonJS, ES2020, strict
├── package.json
└── package-lock.json
```

---

## 4. Runtime Sequence

What happens when `npm test` runs:

1. Cucumber discovers `features/**/*.feature`, skipping `@deferred` tagged files (none currently carry the tag)
2. `ts-node/register` (loaded via `requireModule`) compiles TypeScript on-the-fly
3. `src/serenity.config.ts` is required — configures ArtifactArchiver, SerenityBDDReporter, ConsoleReporter
4. `src/hooks/browser.hooks.ts` is required — registers `BeforeAll`, `Before` and `AfterAll` hooks
5. Once per run: `BeforeAll` launches Chromium and resolves the admin API token (`MagentoApi.authenticate()`)
6. Per scenario: `Before` resets browser state (cookies + local/session storage — cart isolation), then calls `engage(Cast.where(...))` equipping the actor with `BrowseTheWebWithPlaywright` and `CallAnApi`
7. Cucumber matches Gherkin steps to step definitions in `src/step-definitions/`
8. Step definitions call `actorCalled('User').attemptsTo(Task...)` or `Ensure.that(Question, matcher)`
9. Tasks decompose to Interactions (`Click`, `Enter`, `Navigate`, `Wait`, `Select`) against Playwright via Serenity/JS web
10. `Wait.upTo(15–20 s).until(element, isVisible())` guards every async Knockout.js transition (Serenity's bare `Wait.until` 5 s default is too short for cold KO.js renders)
11. Once per run: `AfterAll` closes the browser
12. `ArtifactArchiver` writes Serenity JSON artifacts to `docs/reports/`
13. `SerenityBDDReporter` emits structured BDD events; `npm run test:report` converts to HTML living documentation (published to GitHub Pages by CI)

---

## 5. Magento-Specific Constraints

| Area | Constraint | Reason | Decision |
|---|---|---|---|
| KO.js async checkout | `Wait.until(element, isVisible())` on every step transition; no hard waits | Each checkout step re-renders asynchronously after XHR | ADR-0004 |
| Indexer and cache | CI must run `bin/magento indexer:reindex` and `cache:flush` before tests | Product and price changes are not visible on the storefront until reindexed | ADR-0003 |
| Payment testing | `payment-failure.feature` runs against the in-repo `Portfolio_DeclinePayment` module | A real gateway sandbox would add secrets, network dependency and a cross-origin iframe; the custom module declines deterministically with none of those | ADR-0005 |
| Test data setup | API-driven via `MagentoApiClient.ts` | UI-based product setup is slow and brittle under Magento's EAV model | ADR-0003 |
| Assertion currency | Subtotals use `includes(expectedAmount)` | Currency symbol in displayed price varies by locale; bare-number comparison avoids locale fragility | `docs/gherkin-style-guide.md` |
| Scope leakage | Test data must be scoped to a dedicated website/store view | Magento configuration, pricing, and catalogue all scope to store view | Mitigated via API setup |
| State field | Country must be selected before state dropdown renders | State is a dependent KO.js component; `Wait.until(stateSelect, isVisible())` required between the two selects | `src/tasks/ProvideShippingDetails.ts` |

---

## 6. Known Issues / Technical Debt

All items the v1 of this guide listed here are resolved (see `docs/backlog.md` for the full
record): the Dockerised Magento 2.4.8 target replaced the dead public sandbox (Item #1), the
API-driven Background is live (Item #3), all five ADRs carry concrete examples (Item #5), CI is
fully wired with pre-baked GHCR images and a green badge (Item #4), and the Gherkin style guide's
worked example is complete (Item #6).

Remaining debt, deliberately accepted and recorded:

- **Cart seeding in Backgrounds is UI-driven** — product preconditions are API-verified, but
  `I have "..." in my cart` reuses the `AddToCart` UI journey rather than the guest-cart REST
  endpoints. Resolution (implement API seeding, or re-scope ADR-0003's claim) is pending.
