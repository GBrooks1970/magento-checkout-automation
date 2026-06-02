import { Task, Wait } from '@serenity-js/core';
import { Click, isVisible } from '@serenity-js/web';
import { CheckoutPage } from '../interactions/CheckoutPage';

export const SelectShippingMethod = {
    flatRate: () =>
        Task.where('#actor selects the Flat Rate shipping method',
            Wait.until(CheckoutPage.flatRateOption, isVisible()),
            Click.on(CheckoutPage.flatRateOption),
            Click.on(CheckoutPage.shippingMethodNextButton),
        ),
};
