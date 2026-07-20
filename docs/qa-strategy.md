# QA Strategy — Magento Checkout Automation

**Version:** 2
**Last Updated:** 2026-06-10

---

## 1. Objectives

1. Demonstrate a non-flaky, API-setup + UI-assertion E2E suite against the most complex surface on the Magento storefront — the Knockout.js guest checkout.
2. Show that BDD feature files are a specification first and an automation harness second — evidenced by the commit history (specs committed before step definitions).
3. Document and mitigate the Magento-specific traps (async rendering, indexer/cache lag, scope leakage) that cause flakiness in naive implementations.
4. Produce living documentation from test runs that a portfolio reviewer can read without running the suite.

---

## 2. Test Inventory

| Feature file | Scenarios | Scope | Tags | CI status |
|---|---|---|---|---|
| `features/guest-checkout.feature` | 5 (2 + a 3-row quantity outline) | Happy path: add to cart → shipping → payment → confirmation; subtotal checks | `@placesOrder` on the order-placing scenarios | Active |
| `features/cart-management.feature` | 4 | Add single product, add multiple products, update quantity, remove item | — | Active |
| `features/checkout-validation.feature` | 2 | Reject checkout with missing fields; reject with invalid email | — | Active |
| `features/payment-failure.feature` | 1 | Declined card reported to shopper; cart intact | — (`@deferred` removed 2026-06-09) | Active — deterministic decline via `Portfolio_DeclinePayment` (ADR-0005) |

**Total active scenarios:** 12 (94 steps — the figure CI runs green: 12/12, 94/94)
**Deferred scenarios:** 0
**Smoke subset:** the `smoke` profile (`not @deferred and not @placesOrder and not @usesDeclineModule`)
runs the 7 read-only scenarios — safe against shared, non-resettable stores.

---

## 3. Automation Gates

Gates that must pass before a merge is accepted:

1. **TypeScript type check** — `npx tsc --noEmit` — zero errors
2. **Active scenario suite** — `npm test` (`--tags "not @deferred"`) — all scenarios pass
3. **Serenity BDD report generated** — `npm run test:report` — no report generation errors

The `e2e` GitHub Actions workflow (`.github/workflows/ci.yml`) enforces these gates on every push
to `main` and on every pull request, running the full suite against the pre-baked Dockerised store.

---

## 4. Metrics and Reporting

- **Run artifacts:** Serenity BDD JSON written to `docs/reports/` by `ArtifactArchiver` on every run
- **Living documentation:** `npm run test:report` converts JSON to HTML; CI publishes it to GitHub Pages on every `main` run — https://gbrooks1970.github.io/magento-checkout-automation/
- **Flake monitoring:** The `@deferred` tag quarantines scenarios that cannot yet run reliably; it was used to hold `payment-failure.feature` out of every run until the deterministic decline module existed (removed 2026-06-09 — the quarantine demonstration in full). Any scenario that begins flaking under normal conditions should be tagged `@pending` with a comment explaining the instability trigger
- **Baseline:** All 12 active scenarios must pass on every run against the Dockerised target; zero tolerance for intermittent failures

### Screenshots in the report

The Serenity report can embed browser screenshots, captured by the `Photographer` crew member
(`src/config/screenshots.ts`, wired in `src/serenity.config.ts`). They are **configurable by
environment** via `SCREENSHOTS` (`off` | `failures` | `all`):

- **Local default: on (every interaction)** — local runs are exploratory and the illustrated report
  is the point; no env var needed.
- **CI default: off** — CI publishes the report on every green `main` push, so capturing every
  interaction would bloat the published Pages artifact and slow the cold store. CI's signal is the
  badge; screenshots there are a deliberate debugging aid. Recommended CI opt-in: `SCREENSHOTS=failures`
  on the PR leg, leaving the every-push published report lean.

Screenshots are **artifacts, not assertions** — a capture failure is logged and never fails a step,
so the non-flaky guarantee is preserved. The `Photographer` is a crew member, not a Cucumber
formatter, so it does not compete for the single stdout formatter slot (see §3 and ADR-0002). See
`docs/adr/0007-screenshots-in-reports.md` and `docs/planning/proposals/0001-screenshots-in-test-reports.md`.

---

## 5. Risk-Based Focus

| Tier | Area | Risk | Mitigation |
|---|---|---|---|
| High | Knockout.js checkout async | Steps fire before KO.js has re-rendered, causing element-not-found or stale-element errors | Semantic, engine-aware `Wait.until(...)` ceilings; scroll present-but-off-viewport controls before visibility assertions; zero fixed delays — see `src/config/wait-durations.ts` and `docs/screenplay-guide.md` |
| High | Magento indexer / cache | Products created or modified via API are not visible on the storefront until `indexer:reindex` and `cache:flush` run | CI startup sequence must include both commands before any test run |
| High | Live test target availability | The original public sandbox died (SSL 526); shared demos are nondeterministic | Resolved: Dockerised Magento 2.4.8 store, pre-baked as GHCR images for CI — see `docs/docker-magento-setup.md` |
| Medium | Async order processing | Order state (e.g. "Pending") may not be set immediately after placement on Commerce edition | Poll or wait on order state; avoid immediate state assertions |
| Medium | API / UI parity lag | Test data created via REST API not yet visible when the first UI step fires | Ensure reindex + cache flush runs between API setup and UI navigation |
| Medium | Layered caching | Pass-then-fail on identical input usually means stale FPC, block cache, or Varnish | Flush Varnish and Magento cache in CI before test run |
| Low | Store/website scope | Product prices and configuration scope to store view; cross-scope leakage can cause price assertion failures | Use dedicated test products scoped to the test store view |
| Low | EAV data model | UI-based product creation is slow and brittle | API-driven setup only — no UI product creation in the test suite |

### Engine-aware wait policy

All explicit wait ceilings come from `src/config/wait-durations.ts`; tasks and step definitions
select a semantic tier rather than embedding an engine-specific number. These are maximum polling
ceilings, never fixed sleeps: a satisfied condition returns immediately.

| Engine | Responsive UI | Async update | Complex render | Route transition | Cucumber step |
|---|---:|---:|---:|---:|---:|
| Chromium | 15 s | 25 s | 30 s | 15 s | 90 s |
| Firefox | 20 s | 30 s | 45 s | 10 s | 120 s |
| WebKit | 25 s | 45 s | 60 s | 10 s | 180 s |

Chromium is the strict required gate. Firefox and WebKit can recover from an observed stuck
cart-to-checkout transition; WebKit also performs a clean canonical reload after reaching checkout
because its first Knockout bootstrap can remain permanently stuck. Every such fallback writes a
`[MAG-15 ... recovery]` message to stderr. Promote an exploratory engine only after its fallback is
no longer needed and three consecutive eligible weekly/main CI runs finish 12/12 with zero MAG-15
recovery messages; promote one engine at a time (backlog #15).

### Settled-state count assertions

Cart count assertions are **settled-state assertions by design** (review R-08): the
header counter is refreshed by an asynchronous customer-data fetch that can remain stale
or empty after a cart mutation, particularly in Firefox. It is therefore an observability
signal, not a sound hard oracle. The `my cart should contain {int} item(s)` step logs that
cached counter as a **soft signal** (a stderr warning on mismatch, never a failure), then
navigates to the cart and sums the server-rendered line-item quantity inputs for its hard
assertion. This tests the Gherkin's total-item semantics against authoritative cart state
without hiding the product-side counter race — see `src/questions/CartTotalQuantity.ts`
and `src/step-definitions/cart.steps.ts` (backlog #15).

---

## 6. Execution Recipes

### Local developer loop

```bash
# Install dependencies (first time or after package.json changes)
npm install

# Run the full active suite
npm test

# Run with visible browser for step-by-step debugging
HEADLESS=false npm test

# Run a single feature file
npx cucumber-js --profile default features/guest-checkout.feature

# TypeScript type check only
npx tsc --noEmit

# Generate Serenity BDD HTML report from last run's JSON artifacts
npm run test:report
```

### CI (the `e2e` workflow, as implemented)

What `.github/workflows/ci.yml` actually runs (no Magento secrets needed — the
pre-baked images carry the installed store and test credentials):

```bash
# Step 0: Derive GHCR_OWNER (lowercased github.repository_owner — R-06c); the
# overlay interpolates it, so a fork's CI pulls the fork's own namespace
export GHCR_OWNER=gbrooks1970

# Step 1: Pull the pre-baked store images (built by bake.yml under a unique
# :2.4.8-b<run_number> tag; docker-compose.ci.yml pins the tag in force, and
# ci.yml resolves the references from that overlay via `compose config --images`)
docker pull ghcr.io/${GHCR_OWNER}/magento-checkout-automation/magento-store-app:2.4.8-b<run_number>
docker pull ghcr.io/${GHCR_OWNER}/magento-checkout-automation/magento-store-db:2.4.8-b<run_number>

# Step 2: Start the stack — the CI overlay swaps in the pre-baked images;
# --wait blocks on healthchecks (DB restores its dump; OpenSearch ~50s boot)
docker compose -f docker-compose.yml -f docker-compose.ci.yml up -d --wait

# Step 3: Smoke-check and WARM UP the store — the pre-baked store boots with an
# empty full-page cache and cold OPcache; priming homepage, product pages and
# cart pays the first-render penalty outside any assertion
curl -sf http://localhost:8080/ -o /dev/null
# (two passes over /, both product pages, /checkout/cart — see ci.yml)

# Step 4: Run the active suite (includes @placesOrder — the store is disposable)
BASE_URL=http://localhost:8080 npm test

# Step 5: Render the Serenity report and deploy to GitHub Pages (main only)
npm run test:report
```

Reindex/cache-flush steps are unnecessary at runtime: the baked image snapshots an
already-indexed store, and no test mutates catalogue data. The indexer/cache requirement
documented in §5 applies when *baking* the image (`bake.yml`), not when running the suite.

---

## 7. Open Improvements

All six improvements this section listed in v1 are complete (live Docker target, payment-failure
activation, API-driven Background, published living documentation, ADR examples, style-guide
worked example) — `docs/backlog.md` records each with its resolution and validation evidence.
The last open item, **API-driven cart seeding**, closed on 2026-06-10: the
`I have "..." in my cart` Background step now seeds through the REST guest-cart endpoints and
binds the quote to the browser session via the `Portfolio_CartSeed` adopt endpoint (ADR-0006).

Nothing is currently open in this section.
