# Screenplay Guide — Magento Checkout Automation

**Version:** 2
**Last Updated:** 2026-06-10

This guide covers the Serenity/JS Screenplay implementation for this project.
For the rationale behind choosing Screenplay over Page Objects, see
[`docs/adr/0001-use-screenplay-over-page-objects.md`](adr/0001-use-screenplay-over-page-objects.md).
For the rationale behind using Serenity/JS rather than hand-rolling Screenplay, see
[`docs/adr/0002-use-serenity-js.md`](adr/0002-use-serenity-js.md).

---

## Actor Lifecycle

**Location:** `src/hooks/browser.hooks.ts`

The actor is created on the first call to `actorCalled('User')` within a scenario.
The browser is launched **once for the whole run** in a Cucumber `BeforeAll` hook; a `Before`
hook resets the shared browser state (cookies + local/session storage, for per-scenario cart
isolation) and calls `engage(Cast.where(...))`, equipping every actor with
`BrowseTheWebWithPlaywright` and `CallAnApi`. An `AfterAll` hook closes the browser at the end
of the run.

```typescript
// src/hooks/browser.hooks.ts
let browser: Browser;

BeforeAll(async () => {
    browser = await chromium.launch({ headless: ... });
    await MagentoApi.authenticate();      // admin token, once per run (ADR-0003)
});

Before(async () => {
    // reset cookies + local/session storage on the reused context — a Magento
    // guest cart is keyed on the session cookie, so without this carts
    // accumulate across scenarios (backlog #10)
    engage(Cast.where(actor =>
        actor.whoCan(
            BrowseTheWebWithPlaywright.using(browser),
            CallAnApi.at(BASE_URL),
        )
    ));
});

AfterAll(async () => { await browser.close(); });
```

**Do NOT launch the browser per scenario.** An earlier version of these hooks launched in
`Before` and closed in `After`; only the first scenario in a run passed — every subsequent one
failed at its first navigation with "Target page, context or browser has been closed" (backlog
#8, `docs/implementation-logs/2026-06-02_live-smoke-test.md` §3.2). `src/hooks/browser.hooks.ts`
carries a do-not-revert warning.

**Why hooks, not `configure({ actors: ... })`:**
`Cast.where` accepts a synchronous function only. Playwright's `chromium.launch()` is async.
The launch therefore lives in `BeforeAll` (once per run) while engagement stays in `Before`
(per scenario); `configure()` in `serenity.config.ts` handles only the reporter crew.

**Critical constraints:**
- Do not construct actors manually — always use `actorCalled('User')`
- Do not call `actorCalled` outside a Cucumber step or hook
- The actor name `'User'` matches the first-person Gherkin voice used in all feature files

---

## Abilities

| Ability | Package | Location | Status |
|---|---|---|---|
| `BrowseTheWebWithPlaywright` | `@serenity-js/playwright` | Configured in `src/hooks/browser.hooks.ts` | Active |
| `CallAnApi` | `@serenity-js/rest` | Configured in `src/hooks/browser.hooks.ts`; client logic in `src/api/MagentoApiClient.ts` | Active — Background steps verify products via REST V1 (ADR-0003) |

**Registration pattern:**
```typescript
engage(Cast.where(actor =>
    actor.whoCan(
        BrowseTheWebWithPlaywright.using(browser),
        CallAnApi.at(BASE_URL),
    )
));
```

The Background step `Given a product "..." priced at "..." is available` calls
`MagentoApi.verifyProductIsAvailable(name, price)` against `/rest/V1/products` — no UI
navigation. The admin bearer token is resolved once per run in `BeforeAll`
(`MAGENTO_ADMIN_TOKEN` if set, otherwise minted from admin credentials — see
`docs/admin-api-token-guide.md`).

---

## Interactions (Page Elements)

Page elements are defined as `PageElement` / `PageElements` objects in `src/interactions/`.
They are passed to framework Interactions (`Click`, `Enter`, `Wait`, `Select`) inside Tasks.

| File | Page area | Key elements |
|---|---|---|
| `src/interactions/StorefrontPage.ts` | Product page | `addToCartButton`, `quantityInput`, `successMessage`; `urlFor(productName)` slug map |
| `src/interactions/CartPage.ts` | Cart page | `subtotal`, `itemCounter`, `proceedToCheckoutButton`, `emptyCartMessage`, `quantityInputFor(name)`, `deleteButtonFor(name)` |
| `src/interactions/CheckoutPage.ts` | Checkout (all steps) | Shipping fields, `shippingNextButton`, `flatRateOption`, `checkMoneyOrderLabel`, `declinePaymentLabel`, `placeOrderButton`, `paymentErrorMessage`, `confirmationContainer`, `orderNumber`, `orderSummarySubtotal` |

---

## Tasks

All Tasks use `Task.where(description, ...activities)` and are `async` via Serenity/JS.
The `#actor` token in descriptions is replaced at runtime with the actor's name.

| Task | Location | Description |
|---|---|---|
| `AddToCart.product(name)` | `src/tasks/AddToCart.ts` | Navigate to product page; click Add to Cart; wait for success message |
| `AddToCart.productWithQuantity(name, qty)` | `src/tasks/AddToCart.ts` | As above; clears qty field, enters new value before clicking |
| `BrowseStorefront.asGuest()` | `src/tasks/BrowseStorefront.ts` | Navigate to `BASE_URL` |
| `ProceedToCheckout.fromCart()` | `src/tasks/ProceedToCheckout.ts` | Navigate to cart page; click Proceed; wait for email field |
| `ProvideShippingDetails.valid()` | `src/tasks/ProvideShippingDetails.ts` | Fill shipping form with default test data; click Next |
| `ProvideShippingDetails.withEmail(email)` | `src/tasks/ProvideShippingDetails.ts` | As above with a specified email address |
| `ProvideShippingDetails.incomplete()` | `src/tasks/ProvideShippingDetails.ts` | Enter email only; click Next to trigger validation |
| `SelectShippingMethod.flatRate()` | `src/tasks/SelectShippingMethod.ts` | Wait for Flat Rate option; click it; click Next |
| `ProvidePaymentDetails.checkMoneyOrder()` | `src/tasks/ProvidePaymentDetails.ts` | Select Check / Money Order payment method |
| `ProvidePaymentDetails.declined()` | `src/tasks/ProvidePaymentDetails.ts` | Select the always-declining test method (`Portfolio_DeclinePayment`, ADR-0005) |
| `PlaceTheOrder.now()` | `src/tasks/PlaceTheOrder.ts` | Click Place Order; wait for confirmation container |
| `PlaceTheOrder.attemptExpectingDecline()` | `src/tasks/PlaceTheOrder.ts` | Click Place Order; wait for the decline error message, not the success page |
| `CompleteCheckout.withValidDetails()` | `src/tasks/CompleteCheckout.ts` | Compound: `ProvideShippingDetails.valid()` → `SelectShippingMethod.flatRate()` → `ProvidePaymentDetails.checkMoneyOrder()` → `PlaceTheOrder.now()` |
| `UpdateCartQuantity.of(name, qty)` | `src/tasks/UpdateCartQuantity.ts` | Navigate to cart; clear and set quantity; click Update |
| `RemoveFromCart.product(name)` | `src/tasks/RemoveFromCart.ts` | Navigate to cart; click delete button; wait for empty-cart message |

---

## Questions

Questions return `QuestionAdapter<string>` from `Text.of(element)`. They are passed directly to
`Ensure.that(question, matcher)` in step definitions.

| Question | Location | Returns | Assertion pattern |
|---|---|---|---|
| `CartItemCount()` | `src/questions/CartItemCount.ts` | Counter text, e.g. `"2"` | `equals(String(n))` |
| `CartSubtotal()` | `src/questions/CartSubtotal.ts` | Price text including symbol, e.g. `"$45.00"` | `includes("45.00")` |
| `OrderSummary.subtotal()` | `src/questions/OrderSummary.ts` | Checkout Order Summary subtotal, e.g. `"$90.00"` | `includes("90.00")` — asserted at the payment step, before placing the order |
| `PaymentError.text()` | `src/questions/PaymentError.ts` | Decline error message text | `includes('declined')` (payment-failure scenario) |

Order confirmation is asserted directly on `CheckoutPage.orderNumber` + `isVisible()`, and
validation on the email field's `aria-invalid` attribute — the once-planned `OrderConfirmation`
and `ValidationMessage` Questions were pruned as unused (review R-07).

**Why `includes` for money:** The Luma store displays `$45.00`; the Gherkin spec states `"45.00"`.
Using `includes` keeps assertions currency-symbol-agnostic and locale-safe. Grand totals are never
asserted — only subtotals, which are price × quantity and unaffected by shipping or tax configuration.

---

## Hooks and Fixtures

| Hook | File | Trigger | Action |
|---|---|---|---|
| `BeforeAll` | `src/hooks/browser.hooks.ts` | Once per run | Launches Chromium (headless by default); resolves the admin API token (`MagentoApi.authenticate()`) |
| `Before` (no tag filter) | `src/hooks/browser.hooks.ts` | Every scenario | Resets browser state (clears cookies + local/session storage — per-scenario cart isolation, backlog #10); calls `engage(Cast.where(...))` |
| `AfterAll` | `src/hooks/browser.hooks.ts` | Once per run | Closes the browser |

All hooks are registered by Cucumber when `src/hooks/browser.hooks.ts` is loaded via the `require`
array in `cucumber.js`. The browser (and its single Playwright context, under Serenity/JS v3's
`using(browser)` wiring) is shared across the whole run; per-scenario isolation comes from the
`Before` state reset, not from a fresh browser. The file also sets the Cucumber step timeout
(`setDefaultTimeout(60 s)`) — note that Serenity's `Wait.until` has its own independent 5 s
default, so KO.js renders need explicit `Wait.upTo(15–20 s)` (see Magento-Specific Patterns).

---

## Magento-Specific Patterns

**Knockout.js async waits**
Every step that changes checkout state must wait for the next element to become visible before
proceeding. Never use hard waits (`setTimeout`, `page.waitForTimeout`) — and never rely on
Serenity's bare `Wait.until(...)`, whose **hardcoded 5 s default ceiling** is routinely exceeded
by KO.js renders on a cold store (this caused real CI flakes — session-notes v10 §2). The correct
pattern is an explicit ceiling:

```typescript
Click.on(CheckoutPage.shippingNextButton),
Wait.upTo(Duration.ofSeconds(15))
    .until(CheckoutPage.flatRateOption, isVisible()),  // KO.js renders step 2
Click.on(CheckoutPage.flatRateOption),
```

**Country → state dependency**
The state/region dropdown is a Knockout.js component that renders only after a country is selected.
Always wait for it between the country and state selects:

```typescript
Select.option('United States').from(CheckoutPage.countrySelect),
Wait.upTo(Duration.ofSeconds(15)).until(CheckoutPage.stateSelect, isVisible()),
Select.option('Michigan').from(CheckoutPage.stateSelect),
```

**Product URL slugs**
Product page URLs are mapped by name in `src/interactions/StorefrontPage.ts`. Add an entry to the
`productSlugs` map when introducing a new product to the suite:

```typescript
const productSlugs: Record<string, string> = {
    'Push It Messenger Bag': 'push-it-messenger-bag',
    'Fusion Backpack': 'fusion-backpack',
};
```

**Shipping method selector**
The `shippingMethodNextButton` uses the selector `button[data-role="opc-continue"]`. This may
require adjustment depending on the Magento theme version. Verify against the live target.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `TimeoutExpiredError` on shipping form | `BASE_URL` unreachable, or KO.js still loading | Confirm the store is up (`curl http://localhost:8080/`); cold KO.js renders need the `Wait.upTo` ceilings above |
| State dropdown never becomes visible | Country selection not complete before wait fires | Confirm `Select.option(country)` is the last activity before `Wait.until(stateSelect, ...)` |
| `Cast.where` async error | Browser launch inside `Cast.where` synchronous callback | Browser launch must be in the `BeforeAll` hook; `Cast.where` is synchronous-only in Serenity/JS v3 |
| Only the first scenario passes; rest fail with "browser has been closed" | Browser launched/closed per scenario (the backlog #8 defect) | Launch once in `BeforeAll`, close in `AfterAll`; never per scenario |
| Cart counts accumulate across scenarios (e.g. expected 1, got 8) | Per-scenario state reset missing — guest cart keyed on session cookie leaks | Keep the `Before` hook's cookie + storage reset (backlog #10) |
| Subtotal assertion fails | Currency symbol present in displayed price | Use `includes(expectedAmount)` — not `equals` — for all money assertions |
| All scenarios fail with connection refused | The local Docker store is not running (`BASE_URL` defaults to `http://localhost:8080`) | `docker compose -f docker-compose.yml -f docker-compose.ci.yml up -d --wait` — see `docs/docker-magento-setup.md` |
| `Select.option(state)` throws not found | State name mismatch with Magento region data | Verify the exact state name shown in the dropdown on the live store |
