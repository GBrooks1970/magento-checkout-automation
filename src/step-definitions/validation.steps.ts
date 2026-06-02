import { When, Then } from '@cucumber/cucumber';
import { actorCalled } from '@serenity-js/core';
import { Ensure } from '@serenity-js/assertions';
import { isVisible } from '@serenity-js/web';
import { ProvideShippingDetails } from '../tasks/ProvideShippingDetails';
import { CheckoutPage } from '../interactions/CheckoutPage';

When('I provide incomplete shipping details', async () => {
    await actorCalled('User').attemptsTo(
        ProvideShippingDetails.incomplete(),
    );
});

When('I provide shipping details with email {string}', async (email: string) => {
    await actorCalled('User').attemptsTo(
        ProvideShippingDetails.withEmail(email),
    );
});

Then('I should not be able to advance to payment', async () => {
    // The shipping form remains visible — the user has not advanced to the next step
    await actorCalled('User').attemptsTo(
        Ensure.that(CheckoutPage.emailInput, isVisible()),
    );
});

Then('I should see a validation message', async () => {
    await actorCalled('User').attemptsTo(
        Ensure.that(CheckoutPage.firstValidationMessage, isVisible()),
    );
});
