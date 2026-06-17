# 0005. Deterministic payment failure via a custom always-decline module

**Status:** Accepted
**Date:** 2026-06-08

## Context

`features/payment-failure.feature` asserts that a declined payment is reported to the shopper and
leaves the cart intact. It was quarantined (`@deferred`) because Magento Open Source 2.4.8 ships only
**offline** payment methods (Check/Money Order, Bank Transfer, etc.) — none of which can fail. A real
decline needs a payment method that rejects the transaction on demand.

The constraint that dominates the choice: the CI suite is **pre-baked, self-contained, and was
deliberately made non-flaky**. `ci.yml` pulls public GHCR images and needs no secrets or external
network at test time (see the bake-once/pull-many design behind backlog #4). Several rounds of work
went into eliminating cold-store flakiness. Any payment solution must not reintroduce a network
dependency, a CI secret, or a cross-origin iframe.

## Decision

Add a tiny in-repo Magento module, **`Portfolio_DeclinePayment`** (payment code `declinepayment`), a
declared **test fixture**: an offline-style method (no card form) that declines every transaction with
no PSP, no network call, and no credentials. The decline is forced by an **observer on
`sales_model_service_quote_submit_before`** that throws a `LocalizedException` when the method is
`declinepayment` — this aborts the order deterministically and leaves the cart intact. The module is
copied into the store and enabled during `bake.yml`, so it ships inside the pre-baked images. It
coexists with `checkmo` (the happy-path method, untouched), so the order-placing suite is unaffected.

## Status

Accepted. This activates `payment-failure.feature` (the `@deferred` tag is removed) and closes the
last open credibility-checklist item (quarantine strategy demonstrated → now also *exercised*).

## Consequences

- The payment-failure scenario is **fully deterministic** — the observer throws every time, so there is
  no magic-card, sandbox-uptime, or network variability to flake on. It runs in the `default` CI profile.
- **No new secret or external dependency** enters CI, preserving the non-flaky, self-contained design.
- The store image must be **re-baked** whenever the module changes (it is baked in, like the 2FA-disable
  and qty-counter config). The product-count and dump-size guards still protect the bake.
- Trade-off: this is **not** a real payment-processor integration. It proves the *storefront's* decline
  handling (error shown, order not created, cart intact) — which is exactly what the scenario asserts —
  but it does not exercise a real PSP's authorization flow. That is an acceptable scope for a portfolio
  test fixture and is stated plainly here so the boundary is not mistaken.
- The module is itself a portfolio artifact: it demonstrates extending Magento with a custom payment
  method (registration, gateway adapter, frontend renderer, and an order-placement observer).

## Concrete detail — as built

Getting a custom method to render *and* place an order in Luma's Knockout.js one-page checkout took
several iterations against the live store (diagnosed with a throwaway Playwright probe, then deleted).
The decisions that stuck:

- **Decline mechanism: an observer, not the gateway `authorize` command.** The method is a gateway
  adapter (so it is a valid, available payment method), but offline-style order placement never invoked
  its `authorize` command — the order *succeeded*. The reliable trigger is the
  `sales_model_service_quote_submit_before` observer (`Observer/DeclineOrder.php`), which throws for
  `declinepayment` during quote submission and aborts the order every time. The gateway
  `DeclineCommand` (wired into the command pool in `etc/di.xml`) is therefore **inert at runtime** and
  is retained only for **gateway-contract completeness** — so any future code path that *does* invoke
  `authorize`/`sale` declines consistently rather than silently succeeding. It is kept deliberately,
  not dropped (see the `DeclineCommand.php` and `di.xml` docblocks).
- **Renderer: clone checkmo's.** The frontend method-renderer extends
  `Magento_OfflinePayments/js/view/payment/method-renderer/checkmo-method` and reuses its template.
  A bare default renderer rendered the method but left the Place Order button disabled (no billing
  address applied → `isPlaceOrderActionAllowed` false); the core `Magento_Checkout/payment/default`
  template also 404'd in the baked store. Cloning checkmo's proven, placeable renderer avoids both.
- **No `static-content:deploy` in the bake.** Tried, but unnecessary — the module's JS and checkmo's
  template both serve on-demand (default mode) — and it coincided with a cart customer-data refresh
  regression, so it was removed.
- **Selectors verified by probe:** the decline message renders as `.message-error` in the checkout's
  message region (not under `.checkout-payment-method`); the Place Order button must be scoped to
  `.payment-method._active` once more than one method is enabled.

## Alternatives Considered

- **Braintree sandbox** (bundled in Magento) — the most authentic option (a real PSP, real magic
  decline cards). Rejected because it requires sandbox credentials as a CI secret, makes live calls to
  Braintree's sandbox (an external dependency that can be slow or down), and renders card fields in a
  cross-origin Hosted Fields iframe — all of which cut against the just-achieved non-flaky, secret-free
  CI. Strongest authenticity, worst fit for this suite's constraints.
- **Stripe sandbox** (via `stripe/stripe-magento2`) — same network/secret/iframe drawbacks as Braintree,
  plus a composer install into the baked image. Rejected for the same reasons.
- **Playwright network interception** (`page.route()` to force the place-order XHR to return an error —
  floated in ADR-0004) — deterministic and dependency-free, but it fakes the *response* rather than
  exercising a genuine server-side decline, and it couples the test to Magento's exact place-order
  request/response shape, which is brittle across versions. The custom module produces a real decline
  through Magento's own payment pipeline, which is both more honest and more stable.
