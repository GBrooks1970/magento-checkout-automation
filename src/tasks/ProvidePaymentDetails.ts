import { Duration, Task, Wait } from '@serenity-js/core';
import { Click, isVisible } from '@serenity-js/web';
import { CheckoutPage } from '../interactions/CheckoutPage';

export const ProvidePaymentDetails = {
    checkMoneyOrder: () =>
        // The payment step renders via AJAX after the shipping-method "Next", so wait
        // beyond Serenity's 5 s default (the same cold-render gap that bit AddToCart, #10).
        // Act on the visible label, never the hidden radio (see CheckoutPage #11).
        Task.where('#actor selects Check / Money Order as the payment method',
            Wait.upTo(Duration.ofSeconds(15)).until(CheckoutPage.checkMoneyOrderLabel, isVisible()),
            Click.on(CheckoutPage.checkMoneyOrderLabel),
        ),
};
