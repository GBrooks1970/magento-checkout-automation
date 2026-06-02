# 0001. Use the Screenplay pattern over Page Objects

**Status:** Accepted
**Date:** 2026-06-01

## Context

The suite drives a multi-step, state-dependent checkout. Page Objects are the default pattern for
UI automation, but they tend to grow into large classes that mix locators, navigation, and
assertions. As a journey gains steps, Page Objects accumulate coupling, and the test reads as a
sequence of method calls rather than a description of intent.

The portfolio sets out to demonstrate architecture, not scripting. The pattern choice is the first
place that distinction shows.

## Decision

Use the Screenplay pattern. Actors perform Tasks through Abilities and ask Questions. Tasks are
composed from lower-level Interactions and read like the Gherkin steps that drive them.

## Consequences

Tests describe what an actor does, in domain language, which keeps the step definitions thin and
the intent legible. Composition replaces inheritance, so behaviour is reused by assembling small
Tasks rather than extending base page classes.

The trade-off is a steeper initial learning curve and more files for a given behaviour than a Page
Object would need. For a small script this is overhead; for a journey of this shape, the
readability and low coupling pay it back. The pattern is also less familiar to some reviewers,
which is why this record exists.

## Concrete comparison

**Page Object approach** — a typical checkout Page Object after a few features have been added:

```typescript
class CheckoutPage {
    async fillShipping(data: ShippingData) { /* ... */ }
    async selectFlatRate() { /* ... */ }
    async submitPayment() { /* ... */ }
    async getOrderNumber() { /* ... */ }
    async getSubtotal() { /* ... */ }
    // grows: addValidationAssertions(), retryIfStale(), handlePopup()...
}

// Step definition
When('I proceed through checkout', async () => {
    await checkoutPage.fillShipping(testData);
    await checkoutPage.selectFlatRate();
    await checkoutPage.submitPayment();
});
```

The class accumulates responsibilities. The step definition knows about intermediate steps that
are not the concern of the scenario it belongs to.

**Screenplay approach** — the same behaviour, as implemented in this project:

```typescript
// src/tasks/CompleteCheckout.ts
export const CompleteCheckout = {
    withValidDetails: () =>
        Task.where('#actor completes checkout with valid details',
            ProvideShippingDetails.valid(),
            SelectShippingMethod.flatRate(),
            ProvidePaymentDetails.checkMoneyOrder(),
            PlaceTheOrder.now(),
        ),
};

// src/step-definitions/checkout.steps.ts
When('I complete checkout with valid details', async () => {
    await actorCalled('User').attemptsTo(
        ProceedToCheckout.fromCart(),
        CompleteCheckout.withValidDetails(),
    );
});
```

`CompleteCheckout` composes four Tasks. Each Task is independently testable and reusable. The step
definition expresses intent, not mechanics. Adding a new checkout variant (e.g. a different
shipping method) is a new Task — not an extension of an existing class.
