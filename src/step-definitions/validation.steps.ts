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
    // Strengthened oracle (CODEX-02, CODEX review v1 Risk 3). The payment section is
    // `display:none` until the shipping step completes, so a bare `not(isVisible())`
    // check is true by default and could pass BEFORE the shipping submit has actually
    // been processed. The missing-details submit surfaces no field-level invalid
    // signal to wait on (Magento does not flag the empty address fields aria-invalid;
    // confirmed on the live store), so we settle on the Knockout loading mask instead:
    // wait (engine-aware ceiling, no fixed sleep) for it to clear — proof the submit
    // was processed and its outcome is settled — THEN assert payment never became
    // visible. If no loader shows the wait is satisfied immediately, and the payment
    // section still cannot appear on an incomplete/invalid submit. The invalid-email
    // scenario additionally asserts the positive aria-invalid state in its own step.
    await actorCalled('User').attemptsTo(
        Wait.upTo(waitFor.responsiveUi).until(CheckoutPage.checkoutLoader, not(isVisible())),
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
