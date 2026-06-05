import { Text } from '@serenity-js/web';
import { CheckoutPage } from '../interactions/CheckoutPage';

/**
 * The checkout Order Summary sidebar — the surface where Luma exposes order totals.
 * (The order-success page renders no totals, so the subtotal is verified here, at the
 * payment step, before the order is placed.) See backlog #11.
 */
export const OrderSummary = {
    subtotal: () =>
        Text.of(CheckoutPage.orderSummarySubtotal).describedAs('order summary subtotal'),
};
