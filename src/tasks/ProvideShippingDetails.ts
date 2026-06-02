import { Task, Wait } from '@serenity-js/core';
import { Click, Enter, Select, isVisible } from '@serenity-js/web';
import { CheckoutPage } from '../interactions/CheckoutPage';

export interface ShippingDetails {
    email: string;
    firstName: string;
    lastName: string;
    street: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
    phone: string;
}

const defaults: ShippingDetails = {
    email: 'test.guest@example.com',
    firstName: 'Test',
    lastName: 'Guest',
    street: '6146 Honey Bluff Parkway',
    city: 'Calder',
    state: 'Michigan',
    postcode: '49628-7978',
    country: 'United States',
    phone: '555-229-3326',
};

const fillForm = (details: ShippingDetails) =>
    Task.where('#actor fills in the shipping address form',
        Wait.until(CheckoutPage.emailInput, isVisible()),
        Enter.theValue(details.email).into(CheckoutPage.emailInput),
        Enter.theValue(details.firstName).into(CheckoutPage.firstNameInput),
        Enter.theValue(details.lastName).into(CheckoutPage.lastNameInput),
        Enter.theValue(details.street).into(CheckoutPage.streetAddressInput),
        Enter.theValue(details.city).into(CheckoutPage.cityInput),
        Select.option(details.country).from(CheckoutPage.countrySelect),
        Wait.until(CheckoutPage.stateSelect, isVisible()),
        Select.option(details.state).from(CheckoutPage.stateSelect),
        Enter.theValue(details.postcode).into(CheckoutPage.postcodeInput),
        Enter.theValue(details.phone).into(CheckoutPage.phoneInput),
        Click.on(CheckoutPage.shippingNextButton),
    );

export const ProvideShippingDetails = {
    valid: () =>
        Task.where('#actor provides valid shipping details',
            fillForm(defaults),
        ),

    withEmail: (email: string) =>
        Task.where(`#actor provides shipping details with email "${email}"`,
            fillForm({ ...defaults, email }),
        ),

    incomplete: () =>
        Task.where('#actor provides incomplete shipping details',
            Wait.until(CheckoutPage.emailInput, isVisible()),
            Enter.theValue('incomplete@example.com').into(CheckoutPage.emailInput),
            Click.on(CheckoutPage.shippingNextButton),
        ),
};
