/**
 * Renderer for the declinepayment test method.
 *
 * Clones the stock Check/Money-Order renderer wholesale: it gives this method
 * the exact, proven, placeable checkout behaviour of checkmo (the Place Order
 * button enables the same way, billing handling is identical), differing only
 * by method code. getCode() resolves to 'declinepayment', so placing the order
 * hits our gateway command, which declines. (Any mailing-address text falls
 * back to checkmo's config — cosmetic and irrelevant to the test.) Extending the
 * bare default renderer left the Place Order button disabled because the billing
 * address was never applied; reusing checkmo's renderer avoids that. See ADR-0005.
 */
define([
    'Magento_OfflinePayments/js/view/payment/method-renderer/checkmo-method'
], function (Component) {
    'use strict';

    return Component.extend({});
});
