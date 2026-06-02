<!--
  AUDIENCE: Engineers and AI agents assessing or extending test coverage for this project.
  PURPOSE:  Define what is tested, why, how coverage is measured, and what is explicitly out of scope.
  LOCATION: docs/qa-strategy.md
  TEMPLATE: docs/templates/qa-strategy.template.md
-->

# QA Strategy — [REQUIRED: Project Name]

**Version:** [REQUIRED: N]
**Last Updated:** [REQUIRED: YYYY-MM-DD]

---

## 1. Objectives

[REQUIRED: 2–4 numbered objectives specific to this project. What does this test suite guarantee?]

1. [REQUIRED: objective 1]
2. [REQUIRED: objective 2]

---

## 2. Test Inventory

[REQUIRED: One row per feature file or test concern. Include scope, implementation path, tags, and run frequency.]

| Feature / Concern | Scope | Feature file | Tags | Frequency |
|---|---|---|---|---|
| [REQUIRED: e.g. Guest checkout] | [REQUIRED: e.g. happy path, order confirmation] | `features/guest-checkout.feature` | — | Every run |
| [REQUIRED: e.g. Cart management] | [REQUIRED: scope] | `features/cart-management.feature` | — | Every run |
| [REQUIRED: e.g. Checkout validation] | [REQUIRED: scope] | `features/checkout-validation.feature` | — | Every run |
| Payment failure | Declined card handling | `features/payment-failure.feature` | `@deferred` | Excluded until Docker CI |

---

## 3. Automation Gates

[REQUIRED: Ordered list of quality gates that MUST pass before a merge is accepted.]

1. [REQUIRED: e.g. TypeScript type check — `npx tsc --noEmit`]
2. [REQUIRED: e.g. Active scenario suite — `npm test -- --tags "not @deferred"`]
3. [OPTIONAL: e.g. Serenity BDD report generated without error]

---

## 4. Metrics and Reporting

[REQUIRED: How pass/fail counts, flake, and living documentation are tracked.]

- **Run Metrics:** [REQUIRED: e.g. Serenity BDD JSON written to `docs/reports/`; HTML published via GitHub Pages]
- **Flake Monitoring:** [REQUIRED: e.g. retry strategy; `@deferred` quarantine tag for unstable scenarios]
- **Living Documentation:** [REQUIRED: e.g. Serenity BDD report URL once GitHub Pages is configured]

---

## 5. Risk-Based Focus

[REQUIRED: Identify the highest-risk test areas and their mitigations. See also docs/adr/ for
 architectural decisions driven by these risks.]

| Tier | Area | Risk | Mitigation |
|---|---|---|---|
| High | Knockout.js checkout async | Flaky steps due to Magento's KO.js rendering | Wait on network/state; never use hard waits |
| High | Magento indexer / cache | Product changes not visible until reindex + flush | CI must run `indexer:reindex` and `cache:flush` before tests |
| Medium | Public sandbox availability | Target URL may be unavailable or return SSL errors | Docker Magento instance planned (see docs/backlog.md) |
| Medium | Async order processing | Order state inconsistent immediately after placement | Poll or wait on order state |
| Low | Scope / data leakage | Test data leaking across Magento store views | Dedicated test data setup via API |

---

## 6. Execution Recipes

[REQUIRED: Commands a developer needs to run tests locally and in CI.]

### Local Developer Loop

```bash
# Install dependencies (first time)
npm install

# Run all active scenarios (excludes @deferred)
npm test

# Run headfully for debugging
HEADLESS=false npm test

# Run a specific feature
npx cucumber-js --profile default features/guest-checkout.feature
```

### CI

[REQUIRED: Once the CI target is resolved, document the Docker startup sequence and GitHub Actions
 workflow path here. See docs/backlog.md for the open CI target decision.]

```bash
# Placeholder — Docker Magento CI sequence to be documented once instance is provisioned
# npm test -- --tags "not @deferred"
```

---

## 7. Open Improvements

[REQUIRED: Known coverage gaps or quality improvements not yet implemented.
 Link to docs/backlog.md items where applicable.]

1. [REQUIRED: e.g. Resolve live test target — Docker Magento vs public sandbox (see backlog.md)]
2. [REQUIRED: e.g. Activate payment-failure.feature once Docker gateway is available]
3. [OPTIONAL: e.g. Add API-driven product setup/teardown in Background steps]
