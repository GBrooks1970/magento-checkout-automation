# QA Strategy — Magento Checkout Automation

**Version:** 1
**Last Updated:** 2026-06-02

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
| `features/guest-checkout.feature` | 3 (1 scenario outline × 3 rows) | Happy path: add to cart → shipping → payment → confirmation; cart total | — | Active |
| `features/cart-management.feature` | 4 | Add single product, add multiple products, update quantity, remove item | — | Active |
| `features/checkout-validation.feature` | 2 | Reject checkout with missing fields; reject with invalid email | — | Active |
| `features/payment-failure.feature` | 1 | Declined card reported to shopper; cart intact | `@deferred` | Excluded until Docker CI |

**Total active scenarios:** 9 (plus 2 more via the quantity outline)
**Deferred scenarios:** 1

---

## 3. Automation Gates

Gates that must pass before a merge is accepted:

1. **TypeScript type check** — `npx tsc --noEmit` — zero errors
2. **Active scenario suite** — `npm test` (`--tags "not @deferred"`) — all scenarios pass
3. **Serenity BDD report generated** — `npm run test:report` — no report generation errors

Once CI is configured (see backlog Item #1), the GitHub Actions workflow will enforce these gates on every pull request.

---

## 4. Metrics and Reporting

- **Run artifacts:** Serenity BDD JSON written to `docs/reports/` by `ArtifactArchiver` on every run
- **Living documentation:** `npm run test:report` converts JSON to HTML; publishing via GitHub Pages is a backlog item (Item #4)
- **Flake monitoring:** The `@deferred` tag quarantines scenarios that cannot run reliably without a controllable payment gateway. Any scenario that begins flaking under normal conditions should be tagged `@pending` with a comment explaining the instability trigger
- **Baseline:** All 9+ active scenarios must pass on every run against the live target; zero tolerance for intermittent failures once the target is stable

---

## 5. Risk-Based Focus

| Tier | Area | Risk | Mitigation |
|---|---|---|---|
| High | Knockout.js checkout async | Steps fire before KO.js has re-rendered, causing element-not-found or stale-element errors | `Wait.until(element, isVisible())` on every step transition; zero hard waits — see `docs/screenplay-guide.md` |
| High | Magento indexer / cache | Products created or modified via API are not visible on the storefront until `indexer:reindex` and `cache:flush` run | CI startup sequence must include both commands before any test run |
| High | Live test target availability | Current default URL (`softwaretestingboard.com`) has an SSL error; suite cannot run | Docker Magento is the resolution — see `docs/backlog.md` Item #1 |
| Medium | Async order processing | Order state (e.g. "Pending") may not be set immediately after placement on Commerce edition | Poll or wait on order state; avoid immediate state assertions |
| Medium | API / UI parity lag | Test data created via REST API not yet visible when the first UI step fires | Ensure reindex + cache flush runs between API setup and UI navigation |
| Medium | Layered caching | Pass-then-fail on identical input usually means stale FPC, block cache, or Varnish | Flush Varnish and Magento cache in CI before test run |
| Low | Store/website scope | Product prices and configuration scope to store view; cross-scope leakage can cause price assertion failures | Use dedicated test products scoped to the test store view |
| Low | EAV data model | UI-based product creation is slow and brittle | API-driven setup only — no UI product creation in the test suite |

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

### CI (Docker — pending)

```bash
# Step 1: Start the Magento Docker stack
docker-compose up -d

# Step 2: Wait for Magento to be ready (health check)
# [to be documented once docker-compose.yml is finalised]

# Step 3: Flush caches and reindex
docker exec magento bin/magento indexer:reindex
docker exec magento bin/magento cache:flush

# Step 4: Run the active suite
BASE_URL=http://localhost:8080 npm test

# Step 5: Publish Serenity report (GitHub Pages)
npm run test:report
```

See `docs/backlog.md` Item #1 for the open Docker CI decision.

---

## 7. Open Improvements

1. **Resolve live test target** — Docker Magento vs public sandbox decision is open and blocks all CI progress (see `docs/backlog.md` Item #1)
2. **Activate `payment-failure.feature`** — requires Docker + configurable test payment gateway; tagged `@deferred` until that is in place (backlog Item #2)
3. **Wire API-driven Background steps** — `src/api/MagentoApiClient.ts` is scaffolded; Background steps currently fall back to UI product verification (backlog Item #3)
4. **Publish living documentation** — configure GitHub Pages to serve `docs/reports/` after each CI run (backlog Item #4)
5. **Complete ADR concrete examples** — four ADRs have content but their worked examples (before/after code snippets) are placeholders (backlog Item #5)
6. **Finish Gherkin style guide worked example** — `docs/gherkin-style-guide.md` has a placeholder refactor example (backlog Item #6)
