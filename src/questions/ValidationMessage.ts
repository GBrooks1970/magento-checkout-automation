import { Text } from '@serenity-js/web';
import { CheckoutPage } from '../interactions/CheckoutPage';

export const ValidationMessage = {
    text: () =>
        Text.of(CheckoutPage.firstValidationMessage)
            .describedAs('validation message text'),
};
