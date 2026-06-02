# 0004. Use Playwright as the UI driver, over Cypress

**Status:** Accepted
**Date:** 2026-06-01

## Context

The checkout is built on Knockout.js: asynchronous, with state changes that depend on network
responses. The chief source of flakiness on a surface like this is waiting on the wrong thing.
The driver choice affects how cleanly the suite can wait on network and state rather than on time.

Both Playwright and Cypress are credible. Cypress has an excellent developer experience and a
strong community. Its architecture — running inside the browser event loop — makes multi-origin
flows and deep network interception more awkward.

## Decision

Use Playwright (v1.60). Its multi-context handling and network interception are stronger for this
surface, and it integrates cleanly with Serenity/JS.

## Consequences

The suite can intercept and wait on the network calls the KO.js checkout depends on, which is the
route to a genuinely non-flaky E2E suite. Playwright's auto-waiting reduces the temptation to
reach for hard waits.

The trade-off is giving up Cypress's in-browser developer experience and its time-travel debugger.
Neither is decisive for a CI-first portfolio suite. This is a fit decision, not a verdict that one
tool is better than the other; each is the right choice for a different shape of problem.

## Concrete detail

**Installed version:** `@playwright/test` 1.60.0, `playwright` (peer) 1.60.0

**The KO.js wait pattern — what this decision enables:**

Every step in the Magento checkout triggers an asynchronous KO.js re-render. The correct pattern
is to wait on element visibility after each action, not on elapsed time.

```typescript
// src/tasks/SelectShippingMethod.ts — the Playwright-enabled pattern
export const SelectShippingMethod = {
    flatRate: () =>
        Task.where('#actor selects the Flat Rate shipping method',
            Wait.until(CheckoutPage.flatRateOption, isVisible()),  // wait for KO.js render
            Click.on(CheckoutPage.flatRateOption),
            Click.on(CheckoutPage.shippingMethodNextButton),
        ),
};
```

Compare the anti-pattern — a time-based wait that would be tempting in any driver but is
particularly easy to slip into without Playwright's auto-waiting:

```typescript
// Anti-pattern — never do this
await page.waitForTimeout(2000);  // arbitrary wait masking a KO.js race condition
await page.click('input[value="flatrate_flatrate"]');
```

Playwright's `isVisible()` (via Serenity/JS `Wait.until`) polls until the element is present and
visible, without a fixed delay. The test is as fast as the application, not as slow as the timeout.

**Network interception (future use):**
Playwright's `page.route()` API allows intercepting specific XHR calls the checkout makes, which
enables deterministic control over async state transitions. This is the mechanism that will support
the deferred payment failure scenario once a Docker instance is in place.

**Serenity/JS integration:**
`BrowseTheWebWithPlaywright` from `@serenity-js/playwright` wraps a Playwright `Browser` instance.
All web Interactions (`Click`, `Enter`, `Navigate`, `Wait`, `Select`) delegate to Playwright
through this ability, keeping the test code framework-agnostic at the Task and Question level.
