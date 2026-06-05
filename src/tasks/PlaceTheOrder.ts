import { Duration, Task, Wait } from '@serenity-js/core';
import { Click, isVisible } from '@serenity-js/web';
import { CheckoutPage } from '../interactions/CheckoutPage';

export const PlaceTheOrder = {
    now: () =>
        // Placing the order is an AJAX submit followed by a redirect to the success page;
        // on a cold run this runs past Serenity's 5 s default, so wait up to 20 s for the
        // confirmation to land (backlog #11).
        Task.where('#actor places the order',
            Wait.upTo(Duration.ofSeconds(15)).until(CheckoutPage.placeOrderButton, isVisible()),
            Click.on(CheckoutPage.placeOrderButton),
            Wait.upTo(Duration.ofSeconds(20)).until(CheckoutPage.confirmationContainer, isVisible()),
        ),
};
