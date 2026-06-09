/**
 * Renderer for the declinepayment test method. Extends the stock default
 * payment renderer — no card form, just a selectable method with a Place Order
 * button. getCode() resolves to 'declinepayment', so the radio/label carry that
 * id. Placing the order hits the normal place-order action; the server-side
 * gateway command then declines it. See ADR-0005.
 */
define([
    'Magento_Checkout/js/view/payment/default'
], function (Component) {
    'use strict';

    return Component.extend({
        defaults: {
            template: 'Magento_Checkout/payment/default'
        }
    });
});
