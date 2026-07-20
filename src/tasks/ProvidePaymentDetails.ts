import { Task, Wait } from '@serenity-js/core';
import { Click, isVisible } from '@serenity-js/web';
import { CheckoutPage } from '../interactions/CheckoutPage';
import { waitFor } from '../config/wait-durations';

export const ProvidePaymentDetails = {
    checkMoneyOrder: () =>
        // The payment step renders via AJAX after the shipping-method "Next", so wait
        // beyond Serenity's 5 s default (the same cold-render gap that bit AddToCart, #10).
        // Act on the visible label, never the hidden radio (see CheckoutPage #11).
        Task.where('#actor selects Check / Money Order as the payment method',
            Wait.upTo(waitFor.asynchronousUpdate).until(CheckoutPage.checkMoneyOrderLabel, isVisible()),
            Click.on(CheckoutPage.checkMoneyOrderLabel),
        ),

    // Selects the always-declining test method (Portfolio_DeclinePayment, ADR-0005).
    // The Gherkin says "a card that will be declined" — the mechanic is selecting the
    // method that declines; there is no card form (it is an offline-style gateway).
    declined: () =>
        Task.where('#actor selects the test payment method that will be declined',
            Wait.upTo(waitFor.asynchronousUpdate).until(CheckoutPage.declinePaymentLabel, isVisible()),
            Click.on(CheckoutPage.declinePaymentLabel),
        ),
};
