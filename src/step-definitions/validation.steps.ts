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
    // Positive oracle (CODEX-02, CODEX review v1 Risk 3). The payment section is
    // `display:none` until the shipping step completes, so a bare `not(isVisible())`
    // check is true by default and can pass BEFORE any invalid transition occurs —
    // i.e. before the async submit has been validated and rejected. First wait
    // (engine-aware ceiling, no fixed sleep) for validation to actually fire and flag
    // a required field `aria-invalid="true"` — a positive proof the advance was
    // rejected — THEN assert payment never became visible. This holds for both the
    // missing-details case (empty required fields are flagged) and the invalid-email
    // case (the email field is flagged). See backlog #10 for why the attribute, not
    // visibility, is the stable signal under the Knockout.js loader.
    await actorCalled('User').attemptsTo(
        Wait.upTo(waitFor.responsiveUi).until(CheckoutPage.invalidCheckoutField.isPresent(), equals(true)),
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
