import { Task, Wait } from '@serenity-js/core';
import { Click, isVisible } from '@serenity-js/web';
import { CheckoutPage } from '../interactions/CheckoutPage';

export const ProvidePaymentDetails = {
    checkMoneyOrder: () =>
        Task.where('#actor selects Check / Money Order as the payment method',
            Wait.until(CheckoutPage.checkMoneyOrderOption, isVisible()),
            Click.on(CheckoutPage.checkMoneyOrderOption),
        ),
};
