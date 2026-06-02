<!--
  AUDIENCE: Engineers and AI agents implementing or extending Screenplay components in this project.
  PURPOSE:  Document the Serenity/JS Screenplay implementation — actor lifecycle, abilities,
            tasks, questions, hooks, and Magento-specific patterns.
  LOCATION: docs/screenplay-guide.md
  TEMPLATE: docs/templates/screenplay-guide.template.md
-->

# Screenplay Guide — [REQUIRED: Project Name]

**Version:** [REQUIRED: N]
**Last Updated:** [REQUIRED: YYYY-MM-DD]

This guide covers the Serenity/JS Screenplay implementation for this project.
For the rationale behind choosing Screenplay over Page Objects, see
[`docs/adr/0001-use-screenplay-over-page-objects.md`](../adr/0001-use-screenplay-over-page-objects.md).

---

## Actor Lifecycle

**Location:** `src/hooks/browser.hooks.ts`

[REQUIRED: Describe how the Actor is created, configured, and disposed per scenario.]

The actor is created on first call to `actorCalled('User')` within a scenario.
A Cucumber `Before` hook launches a Playwright `Browser` instance and calls `engage(Cast.where(...))`,
equipping every actor with `BrowseTheWebWithPlaywright`. A corresponding `After` hook closes the browser.

```typescript
// src/hooks/browser.hooks.ts (simplified)
Before(async () => {
    browser = await chromium.launch({ headless: ... });
    engage(Cast.where(actor => actor.whoCan(BrowseTheWebWithPlaywright.using(browser))));
});

After(async () => { await browser.close(); });
```

**Critical constraints:**
- `Cast.where` accepts a synchronous function only — async browser launch lives in the `Before` hook
- Do not call `actorCalled` outside of a Cucumber step or hook
- Do not construct actors manually — always use `actorCalled('User')`

---

## Abilities

| Ability | Location | Integration |
|---|---|---|
| `BrowseTheWebWithPlaywright` | `@serenity-js/playwright` | Wraps a Playwright `Browser`; provides page navigation and element interaction |
| `CallAnApi` | `@serenity-js/rest` | [REQUIRED: document once wired for API-driven Background steps] |

**Registration pattern:**
```typescript
// In the Before hook:
engage(Cast.where(actor =>
    actor.whoCan(BrowseTheWebWithPlaywright.using(browser))
));
```

---

## Tasks

| Task | Location | Notes |
|---|---|---|
| `AddToCart` | `src/tasks/AddToCart.ts` | Navigates to product page; waits for success message before returning |
| `BrowseStorefront` | `src/tasks/BrowseStorefront.ts` | Navigates to `BASE_URL` as a guest |
| `ProceedToCheckout` | `src/tasks/ProceedToCheckout.ts` | Navigates to cart, clicks Proceed, waits for email field |
| `ProvideShippingDetails` | `src/tasks/ProvideShippingDetails.ts` | Fills shipping form; variants: `valid()`, `withEmail(email)`, `incomplete()` |
| `SelectShippingMethod` | `src/tasks/SelectShippingMethod.ts` | Selects Flat Rate; clicks Next |
| `ProvidePaymentDetails` | `src/tasks/ProvidePaymentDetails.ts` | Selects Check/Money Order |
| `PlaceTheOrder` | `src/tasks/PlaceTheOrder.ts` | Clicks Place Order; waits for confirmation container |
| `CompleteCheckout` | `src/tasks/CompleteCheckout.ts` | Compound: shipping + method + payment + place |
| `UpdateCartQuantity` | `src/tasks/UpdateCartQuantity.ts` | Navigates to cart; updates qty input; clicks Update |
| `RemoveFromCart` | `src/tasks/RemoveFromCart.ts` | Navigates to cart; clicks delete; waits for empty-cart message |

All tasks are `async/await` via Serenity/JS `Task.where(description, ...activities)`.

---

## Questions

| Question | Location | Returns |
|---|---|---|
| `CartItemCount()` | `src/questions/CartItemCount.ts` | `QuestionAdapter<string>` — the raw counter text (e.g. `"2"`) |
| `CartSubtotal()` | `src/questions/CartSubtotal.ts` | `QuestionAdapter<string>` — price text including currency symbol (e.g. `"$45.00"`) |
| `OrderConfirmation.orderNumber()` | `src/questions/OrderConfirmation.ts` | `QuestionAdapter<string>` — order number text |
| `OrderConfirmation.subtotal()` | `src/questions/OrderConfirmation.ts` | `QuestionAdapter<string>` — order subtotal text |
| `ValidationMessage.text()` | `src/questions/ValidationMessage.ts` | `QuestionAdapter<string>` — first visible validation message |

**Assertion pattern:** subtotals use `includes(expectedAmount)` rather than `equals` to handle
the currency symbol prefix (e.g. `"$45.00"` includes `"45.00"`).

---

## Hooks and Fixtures

| Hook | Trigger | Action |
|---|---|---|
| `Before` (no tag) | Every scenario | Launches Chromium; engages Cast with `BrowseTheWebWithPlaywright` |
| `After` (no tag) | Every scenario | Closes the browser |

---

## Magento-Specific Patterns

- **Never use hard waits.** The Knockout.js checkout renders asynchronously. Always `Wait.until(element, isVisible())`.
- **Product URL slugs** are mapped in `src/interactions/StorefrontPage.ts`. Add entries for new products there.
- **Country → state dependency:** After `Select.option('United States').from(countrySelect)`, the state dropdown renders dynamically. Use `Wait.until(stateSelect, isVisible())` before selecting a state.
- **Cart subtotal location changes** between the mini-cart (`span.counter-number`) and the cart totals block (`.cart-totals .subtotal .price`). Use the correct element per context.
- **Shipping method selector** (`button[data-role="opc-continue"]`) may need adjustment if the demo store uses a different attribute. Verify against the live target.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `TimeoutExpiredError` waiting for shipping form | Checkout URL not reached, or KO.js still loading | Check `BASE_URL` is correct; increase `defaultNavigationTimeout` in `browser.hooks.ts` |
| State dropdown never becomes visible | Country not yet selected, or KO.js async render pending | Confirm `Select.option(country)` completed before waiting on state |
| `Cast.where` async error at startup | Browser launch attempted inside `Cast.where` | Browser launch must be in the `Before` hook, not in Cast |
| Subtotal assertion fails with exact match | Currency symbol present in displayed price | Use `includes(expectedAmount)` not `equals` |
| All scenarios fail with `BASE_URL` unreachable | Target Magento instance is down | See docs/backlog.md — live URL decision is open |
