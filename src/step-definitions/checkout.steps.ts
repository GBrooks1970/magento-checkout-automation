import { When, Then } from '@cucumber/cucumber';
import { actorCalled } from '@serenity-js/core';
import { Ensure, includes, isPresent } from '@serenity-js/assertions';
import { isVisible } from '@serenity-js/web';
import { AddToCart } from '../tasks/AddToCart';
import { ProceedToCheckout } from '../tasks/ProceedToCheckout';
import { ProvideShippingDetails } from '../tasks/ProvideShippingDetails';
import { SelectShippingMethod } from '../tasks/SelectShippingMethod';
import { ProvidePaymentDetails } from '../tasks/ProvidePaymentDetails';
import { PlaceTheOrder } from '../tasks/PlaceTheOrder';
import { CompleteCheckout } from '../tasks/CompleteCheckout';
import { OrderConfirmation } from '../questions/OrderConfirmation';
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

When('I complete checkout with valid details', async () => {
    await actorCalled('User').attemptsTo(
        ProceedToCheckout.fromCart(),
        CompleteCheckout.withValidDetails(),
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

Then('the order subtotal should be {string}', async (expectedSubtotal: string) => {
    await actorCalled('User').attemptsTo(
        Ensure.that(OrderConfirmation.subtotal(), includes(expectedSubtotal)),
    );
});
