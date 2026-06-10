# 0003. Set up test data through the API, assert through the UI

**Status:** Accepted
**Date:** 2026-06-01

## Context

Every checkout scenario needs a known starting state: a product that exists at a known price,
sometimes a pre-seeded cart. Building that state through the UI is slow, fragile, and irrelevant
to what the test is actually checking. Magento's EAV data model makes UI-based product setup
especially painful — creating a product through the admin UI involves dozens of fields and several
page loads.

## Decision

Set up and tear down test data through the Magento REST API, and reserve the UI for the behaviour
under test. The API ability resolves the Background steps (product availability, guest context,
pre-seeded cart); the UI ability drives the journey and makes the assertions.

## Consequences

This is the highest-value pattern the portfolio demonstrates. Tests become faster and more stable
because setup no longer depends on rendering and clicking through unrelated pages. The split also
keeps each test focused: state via API, behaviour via UI.

The trade-off is two integration surfaces to maintain — API and UI — and a dependency on the API
staying in step with the storefront. Magento's caching and indexing mean data created via API is
not visible to the storefront until a reindex and cache flush, which CI must handle. That trap is
documented and is part of what the suite exists to show.

## Concrete detail

**API client location:** `src/api/MagentoApiClient.ts`

**Magento REST V1 base URL:** `${BASE_URL}/rest/V1`

**Authentication:** admin bearer token. The client resolves one once per run
(`MagentoApi.authenticate()`, called from the `BeforeAll` hook): it prefers an explicit
`MAGENTO_ADMIN_TOKEN`, otherwise mints one via `POST /rest/V1/integration/admin/token` from
`MAGENTO_ADMIN_USERNAME` / `MAGENTO_ADMIN_PASSWORD` (default `admin` / `Password123!` on the
Docker test target). The token is sent as `Authorization: Bearer <token>` per request. On Magento
2.4.x the token endpoint is blocked until admin 2FA is disabled — see
`docs/admin-api-token-guide.md`.

**Background step pattern (implemented):**

```gherkin
# features/guest-checkout.feature
Background:
  Given a product "Push It Messenger Bag" priced at "45.00" is available
  And I am browsing the storefront as a guest
```

```typescript
// src/step-definitions/background.steps.ts
Given('a product {string} priced at {string} is available',
  async (productName: string, price: string) => {
    await actorCalled('User').attemptsTo(
        MagentoApi.verifyProductIsAvailable(productName, Number.parseFloat(price)),
    );
});
```

**REST endpoint used** (note: Magento expects the camelCase `filterGroups` / `conditionType`
search-criteria keys):

```
GET /rest/V1/products?searchCriteria[filterGroups][0][filters][0][field]=name
                     &searchCriteria[filterGroups][0][filters][0][value]=Push%20It%20Messenger%20Bag
                     &searchCriteria[filterGroups][0][filters][0][conditionType]=eq
Authorization: Bearer <token>
```

**Response shape** (asserted by `verifyProductIsAvailable`):

```jsonc
{
  "items": [
    { "sku": "24-WB04", "name": "Push It Messenger Bag", "price": 45 /* … */ }
  ],
  "total_count": 1
}
```

The task asserts: HTTP `200`; `total_count > 0` (a no-match search is still `200`, so the count is
what proves existence); `items[0].name` equals the requested name; and `items[0].price` equals the
expected price. Verified 2026-06-06 against the Docker store for *Push It Messenger Bag* (sku
`24-WB04`, price 45) and *Fusion Backpack* (sku `24-MB02`, price 59).

**CI indexer/cache requirement:**

```bash
# Must run before any test execution in CI
bin/magento indexer:reindex
bin/magento cache:flush
```

Products created or modified via the REST API are not visible on the storefront until the
catalogue and price indexers have run and the full-page cache has been flushed. Skipping this
step is the single most common cause of "product not found" flakiness in Magento automation suites.

**Status:** Implemented 2026-06-06 (backlog Item #3). The Background product-availability step is
API-driven — `MagentoApi.verifyProductIsAvailable` queries the REST catalogue API and asserts the
product exists at the expected price; the UI fallback has been removed. The actor is granted both
`BrowseTheWebWithPlaywright` and `CallAnApi` abilities in `src/hooks/browser.hooks.ts`.

**Amendment (2026-06-10, review finding R-03):** the pre-seeded-cart half of this decision was
UI-driven until 2026-06-10 — the `I have "..." in my cart` Background step clicked through the
Add to Cart journey. It now seeds via the REST guest-cart endpoints
(`POST /V1/guest-carts` + `/items`), bound to the browser session through the
`Portfolio_CartSeed` test-fixture adopt endpoint. The binding problem and the fixture-module
decision are recorded in [ADR-0006](0006-api-guest-cart-seeding.md).
