import { Duration, Task, Wait } from '@serenity-js/core';
import { Click, isVisible } from '@serenity-js/web';
import { CheckoutPage } from '../interactions/CheckoutPage';

// The shipping-method step is Knockout.js-rendered after the address step and
// can take well over Serenity's 5 s default Wait ceiling on a cold CI store.
const CHECKOUT_RENDER = Duration.ofSeconds(20);

export const SelectShippingMethod = {
    flatRate: () =>
        Task.where('#actor selects the Flat Rate shipping method',
            Wait.upTo(CHECKOUT_RENDER).until(CheckoutPage.flatRateOption, isVisible()),
            Click.on(CheckoutPage.flatRateOption),
            Click.on(CheckoutPage.shippingMethodNextButton),
        ),
};
