import { When, Then } from '@cucumber/cucumber';
import { actorCalled, Duration, Wait } from '@serenity-js/core';
import { Ensure, not } from '@serenity-js/assertions';
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
    // The payment step never becomes visible — the user has not advanced. This is
    // more reliable than checking the email field, which the post-submit Knockout.js
    // loader transiently hides, causing a flaky assertion. See backlog #10.
    await actorCalled('User').attemptsTo(
        Ensure.that(CheckoutPage.paymentSection, not(isVisible())),
    );
});

Then('I should see a validation message', async () => {
    // The field error is inserted by client-side validation after the submit and
    // can lag the Knockout.js re-render, so poll for it to appear.
    await actorCalled('User').attemptsTo(
        Wait.upTo(Duration.ofSeconds(10)).until(CheckoutPage.firstValidationMessage, isVisible()),
    );
});
