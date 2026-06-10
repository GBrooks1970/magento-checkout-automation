# 0006. Seed guest carts through the REST API, bound to the session by a test-fixture endpoint

**Status:** Accepted
**Date:** 2026-06-10

## Context

ADR-0003 commits this suite to "API setup, UI assertion", and the 2026-06-10 code review (finding
R-03) called out that the cart half of that claim was overstated: the Background step
`I have "..." in my cart with quantity N` seeded the cart by navigating the product page and
clicking Add to Cart — the exact UI journey the docs said Backgrounds never take. The user decided
to implement the API path rather than re-scope the claim.

Magento's REST API makes the first half easy and the second half impossible with core alone:

- `POST /rest/V1/guest-carts` creates an empty guest quote and returns its **masked id**
  (anonymous — no token needed).
- `POST /rest/V1/guest-carts/{maskedId}/items` fills it by SKU.
- **But no core API attaches that quote to a storefront session.** The session→quote link lives
  server-side in `checkout/session`, and the only core re-binding surface
  (`PUT /rest/V1/guest-carts/{id}`) assigns the cart to a logged-in *customer*, which would change
  the persona of the whole journey (these are guest-checkout scenarios). This binding gap is the
  reason the seeding was UI-driven in the first place.

## Decision

Seed through the REST guest-cart endpoints, and close the binding gap with a second in-repo
test-fixture module — the same philosophy as `Portfolio_DeclinePayment` (ADR-0005):

**`Portfolio_CartSeed`** exposes one frontend endpoint,
`GET /cartseed/cart/adopt?id=<maskedQuoteId>`, which resolves the masked id
(`MaskedQuoteIdToQuoteIdInterface`), loads the active quote, and calls
`checkoutSession->replaceQuote($quote)` — so the **browser that makes the request** adopts the
seeded cart into its session. The suite drives it with a plain browser navigation
(`AdoptSeededCart.withId(maskedId)`), because the binding must happen against the browser's own
session cookie; a node-side fetch would bind a throwaway session.

The Background step is therefore: resolve SKU from the product name (catalogue API) → create
guest cart → add item → navigate to the adopt endpoint → return to the storefront. The first
storefront page load refetches all customer-data sections (the `Before` hook clears local
storage), so the mini-cart counter reflects the adopted cart without explicit section
invalidation.

`AddToCart` — the UI journey — remains the implementation of the `When I add ... to my cart`
steps, where adding to the cart **is the behaviour under test** rather than setup. That is the
ADR-0003 split applied precisely.

## Consequences

The "API setup, UI assertion" claim is now true of every Background step, and the five scenarios
that seed a cart no longer spend their setup in the most flake-exposed UI path (the add-to-cart
success-message wait existed precisely because setup ran it so often).

The costs, accepted deliberately:

- **A second test-fixture module baked into the store image** — any change to it requires a
  `bake.yml` re-run, like ADR-0005's module.
- **A GET endpoint with a side effect** — wrong for a real feature, right for a fixture the suite
  drives by navigation. It is gated by `cartseed/general/active` (default **off**, so the route
  404s anywhere the bake/runbook has not explicitly enabled it): an open quote-swap endpoint
  would let any visitor adopt any masked cart id, so the flag must never be set on a non-test
  store.
- **Two fixture modules to keep honest** — both documented in-code and by ADR, with the runtime
  mechanism stated where future readers will look first (a lesson from review finding R-05).

## Alternatives considered

1. **Re-scope the ADR-0003 claim to the as-built UI seeding** — defensible and cheaper (the
   review offered it as the honest alternative), but rejected by the user in favour of
   completing the pattern.
2. **Customer carts via `PUT /V1/guest-carts/{id}`** — core-only, but converts the journey from
   guest to logged-in customer, invalidating the guest-checkout specification.
3. **Browser-mediated POST to the `checkout/cart/add` frontend controller** — no module or
   re-bake needed, but it is the storefront controller (form key, layout side effects), i.e.
   headless UI rather than API setup; it would make the claim technically true and spiritually
   false.
