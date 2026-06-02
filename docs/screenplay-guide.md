# Screenplay Guide — Magento Checkout Automation

**Version:** 1
**Last Updated:** 2026-06-02

This guide covers the Serenity/JS Screenplay implementation for this project.
For the rationale behind choosing Screenplay over Page Objects, see
[`docs/adr/0001-use-screenplay-over-page-objects.md`](adr/0001-use-screenplay-over-page-objects.md).
For the rationale behind using Serenity/JS rather than hand-rolling Screenplay, see
[`docs/adr/0002-use-serenity-js.md`](adr/0002-use-serenity-js.md).

---

## Actor Lifecycle

**Location:** `src/hooks/browser.hooks.ts`

The actor is created on the first call to `actorCalled('User')` within a scenario.
A Cucumber `Before` hook launches a Playwright `Browser` and calls `engage(Cast.where(...))`,
equipping every actor with `BrowseTheWebWithPlaywright`. A corresponding `After` hook closes
the browser at scenario end, discarding the actor.

```typescript
// src/hooks/browser.hooks.ts
let browser: Browser;

Before(async () => {
    browser = await chromium.launch({ headless: ... });
    engage(Cast.where(actor =>
        actor.whoCan(BrowseTheWebWithPlaywright.using(browser))
    ));
});

After(async () => { await browser.close(); });
```

**Why hooks, not `configure({ actors: ... })`:**
`Cast.where` accepts a synchronous function only. Playwright's `chromium.launch()` is async.
The browser launch therefore lives in the `Before` hook; `configure()` in `serenity.config.ts`
handles only the reporter crew.

**Critical constraints:**
- Do not construct actors manually — always use `actorCalled('User')`
- Do not call `actorCalled` outside a Cucumber step or hook
- The actor name `'User'` matches the first-person Gherkin voice used in all feature files

---

## Abilities

| Ability | Package | Location | Status |
|---|---|---|---|
| `BrowseTheWebWithPlaywright` | `@serenity-js/playwright` | Configured in `src/hooks/browser.hooks.ts` | Active |
| `CallAnApi` | `@serenity-js/rest` | Scaffolded in `src/api/MagentoApiClient.ts` | Stub — Background steps use UI fallback |

**Registration pattern:**
```typescript
engage(Cast.where(actor =>
    actor.whoCan(BrowseTheWebWithPlaywright.using(browser))
));
```

Once the API client is fully wired, Background steps will add `CallAnApi.at(BASE_URL)` to the actor
so product setup and verification happen via the Magento REST API rather than UI navigation.

---

## Interactions (Page Elements)

Page elements are defined as `PageElement` / `PageElements` objects in `src/interactions/`.
They are passed to framework Interactions (`Click`, `Enter`, `Wait`, `Select`) inside Tasks.

| File | Page area | Key elements |
|---|---|---|
| `src/interactions/StorefrontPage.ts` | Product page | `addToCartButton`, `quantityInput`, `successMessage`; `urlFor(productName)` slug map |
| `src/interactions/CartPage.ts` | Cart page | `subtotal`, `itemCounter`, `proceedToCheckoutButton`, `emptyCartMessage`, `quantityInputFor(name)`, `deleteButtonFor(name)` |
| `src/interactions/CheckoutPage.ts` | Checkout (all steps) | Shipping fields, `shippingNextButton`, `flatRateOption`, `checkMoneyOrderOption`, `placeOrderButton`, `confirmationContainer`, `orderNumber`, `firstValidationMessage` |

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
| `PlaceTheOrder.now()` | `src/tasks/PlaceTheOrder.ts` | Click Place Order; wait for confirmation container |
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
| `OrderConfirmation.orderNumber()` | `src/questions/OrderConfirmation.ts` | Order number text | `isVisible()` on element |
| `OrderConfirmation.subtotal()` | `src/questions/OrderConfirmation.ts` | Order subtotal text, e.g. `"$90.00"` | `includes("90.00")` |
| `ValidationMessage.text()` | `src/questions/ValidationMessage.ts` | First visible validation message text | `isVisible()` on element |

**Why `includes` for money:** The Luma store displays `$45.00`; the Gherkin spec states `"45.00"`.
Using `includes` keeps assertions currency-symbol-agnostic and locale-safe. Grand totals are never
asserted — only subtotals, which are price × quantity and unaffected by shipping or tax configuration.

---

## Hooks and Fixtures

| Hook | File | Trigger | Action |
|---|---|---|---|
| `Before` (no tag filter) | `src/hooks/browser.hooks.ts` | Every scenario | Launches Chromium (headless by default); calls `engage(Cast.where(...))` |
| `After` (no tag filter) | `src/hooks/browser.hooks.ts` | Every scenario | Closes the browser; actor is dismissed by Serenity |

Both hooks are registered by Cucumber when `src/hooks/browser.hooks.ts` is loaded via the `require`
array in `cucumber.js`. The browser is shared across all steps within a scenario but is replaced
fresh for each new scenario.

---

## Magento-Specific Patterns

**Knockout.js async waits**
Every step that changes checkout state must wait for the next element to become visible before
proceeding. Never use hard waits (`setTimeout`, `page.waitForTimeout`). The correct pattern:

```typescript
Click.on(CheckoutPage.shippingNextButton),
Wait.until(CheckoutPage.flatRateOption, isVisible()),  // KO.js renders step 2
Click.on(CheckoutPage.flatRateOption),
```

**Country → state dependency**
The state/region dropdown is a Knockout.js component that renders only after a country is selected.
Always call `Wait.until(CheckoutPage.stateSelect, isVisible())` between the country and state selects:

```typescript
Select.option('United States').from(CheckoutPage.countrySelect),
Wait.until(CheckoutPage.stateSelect, isVisible()),
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
| `TimeoutExpiredError` on shipping form | `BASE_URL` unreachable, or KO.js still loading | Confirm `BASE_URL` is correct; check the live target status in `docs/backlog.md` |
| State dropdown never becomes visible | Country selection not complete before wait fires | Confirm `Select.option(country)` is the last activity before `Wait.until(stateSelect, ...)` |
| `Cast.where` async error | Browser launch inside `Cast.where` synchronous callback | Browser launch must be in the `Before` hook; `Cast.where` is synchronous-only in Serenity/JS v3 |
| Subtotal assertion fails | Currency symbol present in displayed price | Use `includes(expectedAmount)` — not `equals` — for all money assertions |
| All scenarios fail with connection refused | `BASE_URL` default is unreachable | Set `BASE_URL` env var to a working Magento instance; see `docs/backlog.md` |
| `Select.option(state)` throws not found | State name mismatch with Magento region data | Verify the exact state name shown in the dropdown on the live store |
