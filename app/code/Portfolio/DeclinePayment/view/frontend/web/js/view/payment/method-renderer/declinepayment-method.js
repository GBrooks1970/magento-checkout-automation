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
            // Own template, bundled in this module — the core
            // Magento_Checkout/payment/default template does not serve in the
            // baked store (404), which silently dropped the method. See ADR-0005.
            template: 'Portfolio_DeclinePayment/payment/declinepayment'
        }
    });
});
