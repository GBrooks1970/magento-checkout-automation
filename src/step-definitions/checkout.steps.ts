import { When, Then } from '@cucumber/cucumber';
import { actorCalled, Duration, Wait } from '@serenity-js/core';
import { Ensure, includes, isPresent, not } from '@serenity-js/assertions';
import { isVisible } from '@serenity-js/web';
import { PaymentError } from '../questions/PaymentError';
import { AddToCart } from '../tasks/AddToCart';
import { ProceedToCheckout } from '../tasks/ProceedToCheckout';
import { ProvideShippingDetails } from '../tasks/ProvideShippingDetails';
import { SelectShippingMethod } from '../tasks/SelectShippingMethod';
import { ProvidePaymentDetails } from '../tasks/ProvidePaymentDetails';
import { PlaceTheOrder } from '../tasks/PlaceTheOrder';
import { OrderSummary } from '../questions/OrderSummary';
import { CheckoutPage } from '../interactions/CheckoutPage';

When('I add {string} to my cart', async (productName: string) => {
    await actorCalled('User').attemptsTo(
        AddToCart.product(productName),
    );
});

When('I add {string} to my cart with quantity {int}', async (productName: string, quantity: number) => {
    await actorCalled('User').attemptsTo(
        AddToCart.productWithQuantity(productName, quantity),
    );
});

When('I proceed to checkout', async () => {
    await actorCalled('User').attemptsTo(
        ProceedToCheckout.fromCart(),
    );
});

When('I provide valid shipping details', async () => {
    await actorCalled('User').attemptsTo(
        ProvideShippingDetails.valid(),
    );
});

When('I select a shipping method', async () => {
    await actorCalled('User').attemptsTo(
        SelectShippingMethod.flatRate(),
    );
});

When('I provide valid payment details', async () => {
    await actorCalled('User').attemptsTo(
        ProvidePaymentDetails.checkMoneyOrder(),
    );
});

When('I place the order', async () => {
    await actorCalled('User').attemptsTo(
        PlaceTheOrder.now(),
    );
});

Then('I should see an order confirmation', async () => {
    await actorCalled('User').attemptsTo(
        Ensure.that(CheckoutPage.confirmationContainer, isVisible()),
    );
});

Then('the confirmation should include an order number', async () => {
    await actorCalled('User').attemptsTo(
        Ensure.that(CheckoutPage.orderNumber, isVisible()),
    );
});

Then('the order summary subtotal should be {string}', async (expectedSubtotal: string) => {
    // The order summary is Knockout.js-rendered and updates asynchronously after
    // the shipping method is selected, so poll until the subtotal settles on the
    // expected value rather than reading it once (it can be empty/stale on a cold
    // CI render — backlog #10/#11).
    await actorCalled('User').attemptsTo(
        Wait.upTo(Duration.ofSeconds(20)).until(OrderSummary.subtotal(), includes(expectedSubtotal)),
    );
});

// ── Payment failure (backlog #2 / ADR-0005) ────────────────────────────────
When('I provide payment details for a card that will be declined', async () => {
    await actorCalled('User').attemptsTo(
        ProvidePaymentDetails.declined(),
    );
});

When('I attempt to place the order', async () => {
    await actorCalled('User').attemptsTo(
        PlaceTheOrder.attemptExpectingDecline(),
    );
});

Then('the order should not be placed', async () => {
    // No success page ever renders when the gateway declines.
    await actorCalled('User').attemptsTo(
        Ensure.that(CheckoutPage.confirmationContainer, not(isVisible())),
    );
});

Then('I should see a payment failure message', async () => {
    // The decline message was already waited for in attemptExpectingDecline; assert its text.
    await actorCalled('User').attemptsTo(
        Ensure.that(PaymentError.text(), includes('declined')),
    );
});

Then('I should remain on the checkout page with my cart intact', async () => {
    // Still on the payment step (not redirected to a success page), and the Order
    // Summary block still shows the cart — i.e. the quote was not consumed into an
    // order. Wait briefly to ride out the KO re-render after the decline error.
    await actorCalled('User').attemptsTo(
        Wait.upTo(Duration.ofSeconds(10)).until(CheckoutPage.paymentSection, isVisible()),
        Ensure.that(CheckoutPage.orderSummaryBlock, isVisible()),
    );
});
