import { Task, Wait } from '@serenity-js/core';
import { Click, isVisible } from '@serenity-js/web';
import { CheckoutPage } from '../interactions/CheckoutPage';
import { waitFor } from '../config/wait-durations';

export const PlaceTheOrder = {
    now: () =>
        // Placing the order is an AJAX submit followed by a redirect to the success page;
        // on a cold run this runs past Serenity's 5 s default, so wait up to 20 s for the
        // confirmation to land (backlog #11).
        Task.where('#actor places the order',
            Wait.upTo(waitFor.asynchronousUpdate).until(CheckoutPage.placeOrderButton, isVisible()),
            Click.on(CheckoutPage.placeOrderButton),
            Wait.upTo(waitFor.complexRender).until(CheckoutPage.confirmationContainer, isVisible()),
        ),

    // The decline path: the gateway throws, so no success page ever appears. Click
    // Place Order and wait for the decline message instead of the confirmation —
    // using PlaceTheOrder.now() here would (correctly) time out waiting for a
    // confirmation that never comes. The order stays unplaced and the cart intact;
    // the Then steps assert that. See backlog #2 / ADR-0005.
    attemptExpectingDecline: () =>
        Task.where('#actor attempts to place the order, expecting a decline',
            Wait.upTo(waitFor.asynchronousUpdate).until(CheckoutPage.placeOrderButton, isVisible()),
            Click.on(CheckoutPage.placeOrderButton),
            Wait.upTo(waitFor.complexRender).until(CheckoutPage.paymentErrorMessage, isVisible()),
        ),
};
