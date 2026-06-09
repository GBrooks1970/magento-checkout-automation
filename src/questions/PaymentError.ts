import { Text } from '@serenity-js/web';
import { CheckoutPage } from '../interactions/CheckoutPage';

/**
 * The decline message Magento surfaces on the checkout when the payment gateway
 * throws (here, the Portfolio_DeclinePayment test method — see ADR-0005).
 */
export const PaymentError = {
    text: () =>
        Text.of(CheckoutPage.paymentErrorMessage).describedAs('payment decline message text'),
};
