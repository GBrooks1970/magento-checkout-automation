import { When, Then } from '@cucumber/cucumber';
import { actorCalled, Wait } from '@serenity-js/core';
import { Ensure, equals, not } from '@serenity-js/assertions';
import { Attribute, isVisible } from '@serenity-js/web';
import { ProvideShippingDetails } from '../tasks/ProvideShippingDetails';
import { CheckoutPage } from '../interactions/CheckoutPage';
import { waitFor } from '../config/wait-durations';

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

Then('the email field should be flagged as invalid', async () => {
    // Assert the email field's `aria-invalid="true"` attribute — a stable signal read
    // directly from the DOM. Visibility-based checks are unreliable here: after submit
    // the Knockout.js `blockLoader` overlays the fieldset, and Serenity's isVisible() is
    // occlusion-aware, so it reports the (genuinely rendered) field as not visible. The
    // attribute value is unaffected by the overlay. See backlog #10.
    await actorCalled('User').attemptsTo(
        Wait.upTo(waitFor.responsiveUi).until(
            Attribute.called('aria-invalid').of(CheckoutPage.emailInput),
            equals('true'),
        ),
    );
});
