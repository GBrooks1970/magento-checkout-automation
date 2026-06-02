import { Duration, Task, Wait } from '@serenity-js/core';
import { Click, Navigate, isVisible } from '@serenity-js/web';
import { CartPage } from '../interactions/CartPage';
import { CheckoutPage } from '../interactions/CheckoutPage';

// The checkout page is a heavy Knockout.js bundle: on first load the email input can
// take well over Serenity's default 5 s Wait.until ceiling to render, especially against
// a live store. Wait on visibility (never on elapsed time) but allow a realistic ceiling.
// See backlog #10.
const CHECKOUT_RENDER = Duration.ofSeconds(20);

export const ProceedToCheckout = {
    fromCart: () =>
        Task.where('#actor proceeds to checkout from the cart',
            Navigate.to(CartPage.url()),
            Wait.until(CartPage.proceedToCheckoutButton, isVisible()),
            Click.on(CartPage.proceedToCheckoutButton),
            Wait.upTo(CHECKOUT_RENDER).until(CheckoutPage.emailInput, isVisible()),
        ),
};
