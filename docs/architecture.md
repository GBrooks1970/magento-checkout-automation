# Magento Checkout Automation — Architecture Guide

**Version:** 1
**Last Updated:** 2026-06-02

---

## 1. Overview

- **Purpose:** Demonstrate senior test-automation architecture against the Magento Luma storefront guest checkout journey, using Spec-Driven Development, BDD, and the Screenplay pattern.
- **Surface type:** UI — Magento Luma storefront (Knockout.js checkout)
- **Language / Framework:** TypeScript + Serenity/JS 3.43 + Playwright 1.60 + Cucumber 11
- **Test target:** `BASE_URL` env var — defaults to `https://magento.softwaretestingboard.com` (SSL issue as of 2026-06-02; see `docs/backlog.md` for the open live-target decision)
- **Automation entry point:** `npm test` — runs Cucumber with `--tags "not @deferred"`

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
- **Hooks:** `src/hooks/browser.hooks.ts` — Playwright browser lifecycle per scenario
- **API client:** `src/api/MagentoApiClient.ts` — Magento REST V1 (stub; Background steps currently use UI verification)
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
│   └── payment-failure.feature        # @deferred — requires Docker + test gateway
├── src/
│   ├── serenity.config.ts             # Crew configuration (reporters, ArtifactArchiver)
│   ├── hooks/
│   │   └── browser.hooks.ts           # Playwright Browser launched in Before; closed in After
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
│   │   └── ValidationMessage.ts
│   ├── api/
│   │   └── MagentoApiClient.ts        # REST V1 client stub — full wiring in Docker CI phase
│   ├── actors/                        # Reserved — actor setup handled via hooks
│   └── step-definitions/
│       ├── background.steps.ts        # Given steps (product availability, guest context, cart)
│       ├── checkout.steps.ts          # When/Then for checkout journey
│       ├── cart.steps.ts              # When/Then for cart management
│       └── validation.steps.ts        # When/Then for validation scenarios
├── docs/
│   ├── adr/                           # Architecture Decision Records (0001–0004)
│   ├── templates/                     # Document templates for this project
│   ├── implementation-logs/           # Per-session development logs
│   ├── reports/                       # Serenity BDD output (runtime — gitignored)
│   ├── architecture.md                # This file
│   ├── screenplay-guide.md
│   ├── qa-strategy.md
│   ├── backlog.md
│   └── gherkin-style-guide.md
├── .github/workflows/ci.yml           # CI skeleton — pending live target decision
├── docker-compose.yml                 # Docker skeleton — pending live target decision
├── cucumber.js                        # Cucumber profile — paths, tags, format, ts-node
├── tsconfig.json                      # CommonJS, ES2020, strict
├── package.json
└── package-lock.json
```

---

## 4. Runtime Sequence

What happens when `npm test` runs:

1. Cucumber discovers `features/**/*.feature`, skipping `@deferred` tagged files
2. `ts-node/register` (loaded via `requireModule`) compiles TypeScript on-the-fly
3. `src/serenity.config.ts` is required — configures ArtifactArchiver, SerenityBDDReporter, ConsoleReporter
4. `src/hooks/browser.hooks.ts` is required — registers `Before` and `After` hooks
5. Per scenario: `Before` hook launches Chromium; calls `engage(Cast.where(...))` equipping the actor with `BrowseTheWebWithPlaywright`
6. Cucumber matches Gherkin steps to step definitions in `src/step-definitions/`
7. Step definitions call `actorCalled('User').attemptsTo(Task...)` or `Ensure.that(Question, matcher)`
8. Tasks decompose to Interactions (`Click`, `Enter`, `Navigate`, `Wait`, `Select`) against Playwright via Serenity/JS web
9. `Wait.until(element, isVisible())` guards every async Knockout.js transition
10. `After` hook closes the browser; the actor is dismissed
11. `ArtifactArchiver` writes Serenity JSON artifacts to `docs/reports/`
12. `SerenityBDDReporter` emits structured BDD events; `npm run test:report` converts to HTML living documentation

---

## 5. Magento-Specific Constraints

| Area | Constraint | Reason | Decision |
|---|---|---|---|
| KO.js async checkout | `Wait.until(element, isVisible())` on every step transition; no hard waits | Each checkout step re-renders asynchronously after XHR | ADR-0004 |
| Indexer and cache | CI must run `bin/magento indexer:reindex` and `cache:flush` before tests | Product and price changes are not visible on the storefront until reindexed | ADR-0003 |
| Payment testing | `payment-failure.feature` is `@deferred` | Requires a controllable test gateway that can deterministically decline a card; not achievable on a public sandbox | See feature file header |
| Test data setup | API-driven via `MagentoApiClient.ts` | UI-based product setup is slow and brittle under Magento's EAV model | ADR-0003 |
| Assertion currency | Subtotals use `includes(expectedAmount)` | Currency symbol in displayed price varies by locale; bare-number comparison avoids locale fragility | `docs/gherkin-style-guide.md` |
| Scope leakage | Test data must be scoped to a dedicated website/store view | Magento configuration, pricing, and catalogue all scope to store view | Mitigated via API setup |
| State field | Country must be selected before state dropdown renders | State is a dependent KO.js component; `Wait.until(stateSelect, isVisible())` required between the two selects | `src/tasks/ProvideShippingDetails.ts` |

---

## 6. Known Issues / Technical Debt

- **Live test target unresolved** — `softwaretestingboard.com` returns SSL error 526 as of 2026-06-02. Docker Magento is the recommended resolution. See `docs/backlog.md` Item #1.
- **API client is a stub** — Background steps verify product availability via UI navigation rather than REST API. Full `MagentoApiClient` wiring is a backlog item (Item #3).
- **ADR examples not yet populated** — The four ADRs have content but their "skeleton" expansion markers reference concrete code examples not yet added. See `docs/backlog.md` Item #5.
- **CI workflow non-functional** — `.github/workflows/ci.yml` and `docker-compose.yml` are skeletons. Unblocked by the live target decision (backlog Item #1).
- **Gherkin style guide worked example pending** — `docs/gherkin-style-guide.md` has a placeholder for the before/after refactor. See `docs/backlog.md` Item #6.
