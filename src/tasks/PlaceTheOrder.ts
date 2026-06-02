import { Task, Wait } from '@serenity-js/core';
import { Click, isVisible } from '@serenity-js/web';
import { CheckoutPage } from '../interactions/CheckoutPage';

export const PlaceTheOrder = {
    now: () =>
        Task.where('#actor places the order',
            Wait.until(CheckoutPage.placeOrderButton, isVisible()),
            Click.on(CheckoutPage.placeOrderButton),
            Wait.until(CheckoutPage.confirmationContainer, isVisible()),
        ),
};
