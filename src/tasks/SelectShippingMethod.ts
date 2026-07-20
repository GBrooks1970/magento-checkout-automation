import { Task, Wait } from '@serenity-js/core';
import { Click, isVisible } from '@serenity-js/web';
import { CheckoutPage } from '../interactions/CheckoutPage';
import { waitFor } from '../config/wait-durations';

// The shipping-method step is Knockout.js-rendered after the address step and
// can take well over Serenity's 5 s default Wait ceiling on a cold CI store.
export const SelectShippingMethod = {
    flatRate: () =>
        Task.where('#actor selects the Flat Rate shipping method',
            Wait.upTo(waitFor.complexRender).until(CheckoutPage.flatRateOption, isVisible()),
            Click.on(CheckoutPage.flatRateOption),
            Click.on(CheckoutPage.shippingMethodNextButton),
        ),
};
