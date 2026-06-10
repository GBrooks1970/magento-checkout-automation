import { By, PageElement } from '@serenity-js/web';
import { BASE_URL } from '../serenity.config';

export const CheckoutPage = {
    url: (): string => `${BASE_URL}/checkout`,

    // Shipping address step
    emailInput: PageElement.located(By.css('#customer-email'))
        .describedAs('email input'),
    firstNameInput: PageElement.located(By.css('input[name="firstname"]'))
        .describedAs('first name input'),
    lastNameInput: PageElement.located(By.css('input[name="lastname"]'))
        .describedAs('last name input'),
    streetAddressInput: PageElement.located(By.css('input[name="street[0]"]'))
        .describedAs('street address input'),
    cityInput: PageElement.located(By.css('input[name="city"]'))
        .describedAs('city input'),
    stateSelect: PageElement.located(By.css('select[name="region_id"]'))
        .describedAs('state / region select'),
    postcodeInput: PageElement.located(By.css('input[name="postcode"]'))
        .describedAs('postcode input'),
    countrySelect: PageElement.located(By.css('select[name="country_id"]'))
        .describedAs('country select'),
    phoneInput: PageElement.located(By.css('input[name="telephone"]'))
        .describedAs('phone number input'),
    shippingNextButton: PageElement.located(By.css('button.action.continue.primary'))
        .describedAs('Next button on shipping address step'),

    // Shipping method step
    flatRateOption: PageElement.located(By.css('input[value="flatrate_flatrate"]'))
        .describedAs('Flat Rate shipping option'),
    shippingMethodNextButton: PageElement.located(By.css('.action.primary[data-role="opc-continue"]'))
        .describedAs('Next button on shipping method step'),

    // Payment step
    // The payment-method section is in the DOM but hidden (display:none) until the
    // shipping step is completed; its visibility is a reliable "advanced to payment"
    // signal (more so than the email field, which the post-submit loader transiently
    // hides). See backlog #10.
    paymentSection: PageElement.located(By.css('.checkout-payment-method'))
        .describedAs('payment method section'),
    // Luma renders the real payment radio as a zero-size, display:none input (offsetParent
    // is null) and overlays a styled label — so the radio is never `isVisible()`. With a
    // single payment method Magento auto-selects checkmo, but we click the *visible label*
    // to be explicit and to stay correct if more methods are ever configured. Validated by
    // live DOM probe on the Docker store (backlog #11): the radio reports visible=false,
    // `label[for="checkmo"]` reports visible=true. Same class of issue as the invalid-email
    // field (#10) — assert/act on what Magento actually keeps visible.
    checkMoneyOrderLabel: PageElement.located(By.css('label[for="checkmo"]'))
        .describedAs('Check / Money Order payment label'),
    // The always-declining test method (Portfolio_DeclinePayment, code
    // `declinepayment`; see ADR-0005). Same hidden-radio / visible-label pattern
    // as checkmo above — act on the label, not the radio.
    declinePaymentLabel: PageElement.located(By.css('label[for="declinepayment"]'))
        .describedAs('Test Declining Payment label'),
    // The decline message Magento surfaces on the checkout when the order is
    // rejected. Verified by live DOM probe (backlog #2): the OPC place-order error
    // renders as `<div class="message message-error error">…</div>` in the
    // checkout's message region — NOT under `.checkout-payment-method` — and is the
    // only `.message-error` present (the per-method `.messages` containers are
    // empty until an error occurs). See ADR-0005.
    paymentErrorMessage: PageElement.located(By.css('.message-error'))
        .describedAs('payment decline message'),
    // Scope to the ACTIVE payment method's content. With more than one payment
    // method enabled (checkmo + the declinepayment test method, backlog #2), every
    // method renders its own `.payment-method-content` with its own Place Order
    // button, so the unscoped selector matches multiple buttons and resolves to a
    // hidden one. `.payment-method._active` is the selected method's wrapper, so
    // this resolves to exactly the one visible Place Order button. (Also avoids the
    // header mini-cart button — backlog #10.)
    placeOrderButton: PageElement.located(By.css('.payment-method._active .payment-method-content button.action.primary.checkout'))
        .describedAs('Place Order button'),

    // Order confirmation. Luma's guest success page renders the order id as
    // `<p>Your order # is: <span>000000004</span>.</p>` inside `.checkout-success`
    // — there is no `.order-number` element (the prior selector matched nothing) and,
    // notably, NO order-totals block on this page at all. Validated by live DOM probe
    // (backlog #11).
    confirmationContainer: PageElement.located(By.css('div.checkout-success'))
        .describedAs('order confirmation section'),
    orderNumber: PageElement.located(By.css('.checkout-success p span'))
        .describedAs('order number'),

    // Order summary subtotal — read from the checkout's Order Summary sidebar, which is
    // where Luma actually exposes totals (the success page has none, see above). The
    // `.table-totals` rows are Knockout-rendered and only appear once a shipping method is
    // chosen, so this is reliable from the payment step onward — assert it there, before
    // placing the order. Validated by live DOM probe (backlog #11): at the payment step the
    // `.totals.sub` row reads e.g. "$90.00" for quantity 2.
    orderSummarySubtotal: PageElement.located(By.css('.opc-block-summary .table-totals .totals.sub .price'))
        .describedAs('order summary subtotal'),

    // The checkout Order Summary sidebar block (lists the cart contents/totals).
    // Used to assert the cart is still intact after a declined order — robustly
    // present whenever on checkout with items, unlike the nested subtotal row,
    // which can be absent during the post-decline KO re-render. See backlog #2.
    orderSummaryBlock: PageElement.located(By.css('.opc-block-summary'))
        .describedAs('order summary block'),

    // NOTE on validation assertions (backlog #10): Magento's generated field-error
    // div (`div.mage-error`) is unreliable to assert on in the KO.js checkout — it
    // flickers during re-render, and the "missing details" case surfaces no message
    // at all. The validation steps therefore assert the email field's stable
    // `aria-invalid` attribute (via `emailInput` above) and non-advancement (via
    // `paymentSection`) instead — see validation.steps.ts.
};
