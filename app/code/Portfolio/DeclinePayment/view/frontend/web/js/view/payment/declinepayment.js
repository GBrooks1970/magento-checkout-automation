/**
 * Registers the declinepayment method renderer with the checkout's renderer list,
 * so the method appears in the one-page checkout payment step. See ADR-0005.
 */
define([
    'uiComponent',
    'Magento_Checkout/js/model/payment/renderer-list'
], function (Component, rendererList) {
    'use strict';

    rendererList.push({
        type: 'declinepayment',
        component: 'Portfolio_DeclinePayment/js/view/payment/method-renderer/declinepayment-method'
    });

    return Component.extend({});
});
