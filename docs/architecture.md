# Magento Checkout Automation — Architecture Guide

**Version:** 3
**Last Updated:** 2026-08-03

---

## 1. Overview

- **Purpose:** Demonstrate senior test-automation architecture against the Magento Luma storefront guest checkout journey, using Spec-Driven Development, BDD, and the Screenplay pattern.
- **Surface type:** UI — Magento Luma storefront (Knockout.js checkout)
- **Language / Framework:** TypeScript + Serenity/JS 3.43 + Playwright 1.60 + Cucumber 12 (exact pinned versions live in `package.json` — not restated here to avoid drift)
- **Browser engine:** selected by the `BROWSER` env var (`chromium` default / `firefox` / `webkit`); Chromium is the required CI gate, Firefox/WebKit run non-blocking on `main`/schedule (see `qa-strategy.md`)
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
- **Serenity config:** `src/serenity.config.ts` — crew: ArtifactArchiver, SerenityBDDReporter, ConsoleReporter, plus a Photographer added only when screenshots are enabled (`SCREENSHOTS`; default ON locally, OFF in CI — see `src/config/screenshots.ts`, ADR-0007)
- **Wait policy:** `src/config/wait-durations.ts` — engine-aware wait tiers and the per-engine Cucumber step timeout, defined once as ceilings (not fixed delays) and consumed everywhere; the concrete numbers live there and in `screenplay-guide.md`, not duplicated here

### Tooling

| Command | Purpose |
|---|---|
| `npm test` | Run the active suite (excludes `@deferred`) |
| `npm run test:smoke` | Non-ordering 7-scenario subset (state-mutating; needs a resettable target) |
| `npm run test:unit` | Fast `node:test` policy/decision units — no live store |
| `npm run verify` | Gate: `tsc --noEmit` → `test:unit` → default + smoke dry-runs |
| `npm run audit:ci` | Dependency-audit gate (SEC-01) — parses `npm audit --json` by content |
| `npx tsc --noEmit` | TypeScript type check |
| `npm run test:report` | Generate Serenity BDD HTML report from JSON artifacts |

Selected via environment: `BROWSER=chromium\|firefox\|webkit` (engine), `SCREENSHOTS=off\|failures\|all` (Photographer; default ON local / OFF CI), `TRACE=on-failure` (per-scenario trace+video, retained on failure), `HEADLESS=false` (visible browser), `BASE_URL` (target store).

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
│   ├── serenity.config.ts             # Crew configuration (reporters, ArtifactArchiver, optional Photographer)
│   ├── config/                        # Pure, side-effect-free policy modules (unit-tested — see test/)
│   │   ├── wait-durations.ts          # Engine-aware wait tiers + per-engine Cucumber step timeout (backlog #15)
│   │   ├── screenshots.ts             # SCREENSHOTS mode → optional Photographer crew member (ADR-0007)
│   │   ├── artifact-retention.ts      # Trace/video retain-on-failure decisions (CODEX-06)
│   │   ├── route-recovery.ts          # Per-engine checkout-route recovery policy (MAG-15, CODEX-06)
│   │   ├── target-host.ts             # BASE_URL localhost-safety check (R-09)
│   │   └── product-slugs.ts           # Deterministic product-name → URL-slug map
│   ├── hooks/
│   │   ├── browser.hooks.ts           # Engine launched once (BeforeAll); per-scenario reset (Before); TRACE isolated-context path
│   │   └── artifact-slug.ts           # Scenario-name → filesystem-safe artifact slug
│   ├── interactions/                  # PageElement definitions per page area
│   │   ├── StorefrontPage.ts          # Product page elements + URL slug map
│   │   ├── CartPage.ts                # Cart page elements
│   │   ├── CheckoutPage.ts            # Checkout steps: shipping, method, payment, confirmation
│   │   └── StabiliseCheckoutRoute.ts  # Engine-aware checkout-route recovery interaction (MAG-15)
│   ├── tasks/                         # Screenplay Tasks
│   │   ├── AddToCart.ts
│   │   ├── AdoptSeededCart.ts         # Binds the API-seeded guest cart to the session (ADR-0006)
│   │   ├── BrowseStorefront.ts
│   │   ├── PlaceTheOrder.ts
│   │   ├── ProceedToCheckout.ts
│   │   ├── ProvidePaymentDetails.ts
│   │   ├── ProvideShippingDetails.ts  # Variants: valid(), withEmail(e), incomplete()
│   │   ├── RemoveFromCart.ts
│   │   ├── SelectShippingMethod.ts
│   │   └── UpdateCartQuantity.ts
│   ├── questions/                     # Screenplay Questions
│   │   ├── CartItemCount.ts           # Distinct line-item count (server-rendered rows)
│   │   ├── CartTotalQuantity.ts       # Summed cart quantity from the server-rendered rows (not the header counter)
│   │   ├── CartSubtotal.ts
│   │   ├── OrderSummary.ts            # Checkout Order Summary subtotal (asserted at the payment step)
│   │   └── PaymentError.ts            # Decline message (payment-failure scenario)
│   ├── api/
│   │   └── MagentoApiClient.ts        # REST V1 client — admin token + product verification (ADR-0003)
│   ├── actors/                        # Reserved — actor setup handled via hooks
│   └── step-definitions/
│       ├── background.steps.ts        # Given steps (product availability, guest context, cart)
│       ├── checkout.steps.ts          # When/Then for checkout journey
│       ├── cart.steps.ts              # When/Then for cart management
│       └── validation.steps.ts        # When/Then for validation scenarios
├── test/
│   └── unit/                          # Fast node:test policy/decision units (via ts-node) — no live store (CODEX-05/06)
├── scripts/
│   └── audit-ci.mjs                   # Dependency-audit gate: parses `npm audit --json` by content (SEC-01)
├── docs/
│   ├── adr/                           # Architecture Decision Records (0001–0007)
│   ├── templates/                     # Document templates for this project
│   ├── implementation-logs/           # Per-session development logs
│   ├── reports/                       # Serenity BDD output (runtime — gitignored)
│   ├── architecture.md                # This file
│   ├── screenplay-guide.md
│   ├── qa-strategy.md
│   ├── backlog.md
│   └── gherkin-style-guide.md
├── app/code/Portfolio/                # In-repo Magento test-fixture modules
│   ├── DeclinePayment/                #   deterministic decline (ADR-0005)
│   └── CartSeed/                      #   API-seeded-cart session binding (ADR-0006)
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
5. Once per run: `BeforeAll` launches the engine selected by `BROWSER` (`resolveBrowserType()`, default Chromium) and resolves the admin API token (`MagentoApi.authenticate()`). The Cucumber step timeout is set once from the engine's tier (`setDefaultTimeout(cucumberStepTimeoutMilliseconds)`)
6. Per scenario: `Before` resets browser state (cookies + local/session storage — cart isolation), then calls `engage(Cast.where(...))` equipping the actor with `BrowseTheWebWithPlaywright` and `CallAnApi`. **Default (TRACE unset):** all scenarios share the reset context, byte-for-byte the pre-existing path. **`TRACE=on-failure`:** each scenario instead gets a freshly-created isolated context+page (`usingPage`) recording a trace+video, retained only on failure and deleted on pass (see `src/config/artifact-retention.ts`)
7. Cucumber matches Gherkin steps to step definitions in `src/step-definitions/`
8. Step definitions call `actorCalled('User').attemptsTo(Task...)` or `Ensure.that(Question, matcher)`
9. Tasks decompose to Interactions (`Click`, `Enter`, `Navigate`, `Wait`, `Select`) against Playwright via Serenity/JS web; the exploratory engines additionally recover a stalled checkout route via `StabiliseCheckoutRoute` (Chromium never recovers — a broken button must fail the required gate; see `src/config/route-recovery.ts`, MAG-15)
10. Waits are ceilings drawn from the engine-aware tiers in `src/config/wait-durations.ts` (`waitFor.responsiveUi` / `asynchronousUpdate` / `complexRender`), returning as soon as the Knockout.js condition is met — never fixed sleeps. The concrete per-engine seconds live in that module and `screenplay-guide.md`; they are not restated here
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
API-driven Background is live (Item #3), all ADRs carry concrete examples (Item #5), CI is
fully wired with pre-baked GHCR images and a green badge (Item #4), and the Gherkin style guide's
worked example is complete (Item #6). The last recorded debt — UI-driven cart seeding in the
Backgrounds — was closed on 2026-06-10: cart preconditions now go through the REST guest-cart
endpoints, bound to the browser session by the `Portfolio_CartSeed` test-fixture endpoint
(ADR-0006).
