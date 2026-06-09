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
            // Reuse the offline Check/Money-Order template: it is a simple
            // no-fields method template that is known to serve and bind
            // correctly in this baked store (checkmo renders with it). The core
            // Magento_Checkout/payment/default template 404s here, and a
            // hand-written copy risks subtle KO binding errors. getCode() still
            // resolves to 'declinepayment', so the radio/label carry that id.
            // See ADR-0005 / backlog #2.
            template: 'Magento_OfflinePayments/payment/checkmo'
        }
    });
});
