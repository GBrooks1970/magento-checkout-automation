# 0003. Set up test data through the API, assert through the UI

Status: Accepted

## Context

Every checkout scenario needs a known starting state: a product that exists at a
known price, sometimes a pre-seeded cart. Building that state through the UI is
slow, fragile, and irrelevant to what the test is actually checking. Magento's
EAV data model makes UI-based product setup especially painful.

## Decision

Set up and tear down test data through the Magento REST API, and reserve the UI
for the behaviour under test. The API ability resolves the Background steps
(product availability, guest context, pre-seeded cart); the UI ability drives the
journey and makes the assertions.

## Consequences

This is the highest-value pattern the portfolio demonstrates. Tests become faster
and more stable because setup no longer depends on rendering and clicking through
unrelated pages. The split also keeps each test focused: state via API, behaviour
via UI.

The trade-off is two integration surfaces to maintain, API and UI, and a
dependency on the API staying in step with the storefront. Magento's caching and
indexing mean data created via API is not visible to the storefront until a
reindex and cache flush, which CI must handle. That trap is documented and is
part of what the suite exists to show.

> Skeleton. Link to the REST client in `src/api/` and list the endpoints used
> once implemented.
