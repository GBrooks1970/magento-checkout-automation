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
    checkMoneyOrderOption: PageElement.located(By.css('input[value="checkmo"]'))
        .describedAs('Check / Money Order payment option'),
    placeOrderButton: PageElement.located(By.css('button.action.primary.checkout'))
        .describedAs('Place Order button'),

    // Order confirmation
    confirmationContainer: PageElement.located(By.css('div.checkout-success'))
        .describedAs('order confirmation section'),
    orderNumber: PageElement.located(By.css('a.order-number, span.order-number'))
        .describedAs('order number'),
    orderSubtotal: PageElement.located(By.css('.opc-block-summary .totals.sub .amount .price'))
        .describedAs('order subtotal on confirmation'),

    // Validation
    firstValidationMessage: PageElement.located(By.css('div.mage-error, span.mage-error'))
        .describedAs('field validation message'),
};
