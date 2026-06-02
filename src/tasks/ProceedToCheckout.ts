import { Task, Wait } from '@serenity-js/core';
import { Click, Navigate, isVisible } from '@serenity-js/web';
import { CartPage } from '../interactions/CartPage';
import { CheckoutPage } from '../interactions/CheckoutPage';

export const ProceedToCheckout = {
    fromCart: () =>
        Task.where('#actor proceeds to checkout from the cart',
            Navigate.to(CartPage.url()),
            Wait.until(CartPage.proceedToCheckoutButton, isVisible()),
            Click.on(CartPage.proceedToCheckoutButton),
            Wait.until(CheckoutPage.emailInput, isVisible()),
        ),
};
