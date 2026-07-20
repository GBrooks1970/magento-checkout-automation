import { When, Then } from '@cucumber/cucumber';
import { actorCalled, Interaction, Wait } from '@serenity-js/core';
import { Ensure, equals, includes } from '@serenity-js/assertions';
import { Navigate, isVisible } from '@serenity-js/web';
import { UpdateCartQuantity } from '../tasks/UpdateCartQuantity';
import { RemoveFromCart } from '../tasks/RemoveFromCart';
import { CartItemCount } from '../questions/CartItemCount';
import { CartTotalQuantity } from '../questions/CartTotalQuantity';
import { CartSubtotal } from '../questions/CartSubtotal';
import { CartPage } from '../interactions/CartPage';
import { waitFor } from '../config/wait-durations';

When('I update the quantity of {string} to {int}', async (productName: string, quantity: number) => {
    await actorCalled('User').attemptsTo(
        UpdateCartQuantity.of(productName, quantity),
    );
});

When('I remove {string} from my cart', async (productName: string) => {
    await actorCalled('User').attemptsTo(
        RemoveFromCart.product(productName),
    );
});

// Soft signal, not an assertion (review R-08): note what the asynchronous header
// counter shows before reading the authoritative cart rows below. This keeps a
// stale/empty customer-data cache visible without letting it fail a correct cart.
// console.warn writes to stderr, so it cannot contaminate Cucumber's single
// stdout formatter slot (the starved-formatter lesson, PR #19).
const NoteCachedCartCounter = (expectedCount: number) =>
    Interaction.where(`#actor notes the cached cart counter (soft signal)`, async actor => {
        try {
            const observed = await actor.answer(CartItemCount());
            if (observed.trim() !== String(expectedCount)) {
                console.warn(
                    `[R-08 soft signal] cached header cart counter read "${observed}" `
                    + `where ${expectedCount} was expected — the customer-data refresh race is live on `
                    + `this run (not a failure: the authoritative cart-row assertion follows).`,
                );
            }
        } catch (error) {
            console.warn(
                `[R-08 soft signal] cached cart counter could not be read `
                + `(${error instanceof Error ? error.message : String(error)}) — counter not rendered `
                + `yet (not a failure: the authoritative cart-row assertion follows).`,
            );
        }
    });

// The header cart counter is a Knockout customer-data cache. Firefox can leave it
// empty indefinitely even after a successful cart update, so it is not a sound
// hard oracle. Navigate to the cart and sum its server-rendered line quantities;
// this preserves the Gherkin's total-item semantics without a cache race (#15).
const ensureCartCount = (expectedCount: number) =>
    actorCalled('User').attemptsTo(
        NoteCachedCartCounter(expectedCount),
        Navigate.to(CartPage.url()),
        Wait.upTo(waitFor.complexRender).until(CartPage.subtotal, isVisible()),
        Wait.upTo(waitFor.complexRender).until(CartTotalQuantity(), equals(expectedCount)),
    );

// One definition for singular and plural (review R-08) — `item(s)` is Cucumber
// expression optional-text syntax, so "1 item" and "3 items" both bind here.
Then('my cart should contain {int} item(s)', async (expectedCount: number) => {
    await ensureCartCount(expectedCount);
});

Then('the cart subtotal should be {string}', async (expectedSubtotal: string) => {
    // The subtotal lives on the cart page; some scenarios assert it straight after
    // adding from a product page, so view the cart before reading the total.
    await actorCalled('User').attemptsTo(
        Navigate.to(CartPage.url()),
        Wait.upTo(waitFor.asynchronousUpdate).until(CartPage.subtotal, isVisible()),
        Ensure.that(CartSubtotal(), includes(expectedSubtotal)),
    );
});

Then('my cart should be empty', async () => {
    await actorCalled('User').attemptsTo(
        Ensure.that(CartPage.emptyCartMessage, isVisible()),
    );
});
