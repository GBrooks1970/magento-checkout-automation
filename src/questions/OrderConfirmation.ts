import { Text } from '@serenity-js/web';
import { CheckoutPage } from '../interactions/CheckoutPage';

export const OrderConfirmation = {
    orderNumber: () =>
        Text.of(CheckoutPage.orderNumber).describedAs('order number on confirmation page'),

    subtotal: () =>
        Text.of(CheckoutPage.orderSubtotal).describedAs('order subtotal on confirmation page'),
};
