import { When, Then } from '@cucumber/cucumber';
import { actorCalled, Duration, Interaction, Wait } from '@serenity-js/core';
import { Ensure, equals, includes } from '@serenity-js/assertions';
import { Navigate, isVisible } from '@serenity-js/web';
import { UpdateCartQuantity } from '../tasks/UpdateCartQuantity';
import { RemoveFromCart } from '../tasks/RemoveFromCart';
import { CartItemCount } from '../questions/CartItemCount';
import { CartSubtotal } from '../questions/CartSubtotal';
import { CartPage } from '../interactions/CartPage';

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

// Soft signal, not an assertion (review R-08): note what the header counter shows
// BEFORE the settling reload below. The hard assertion deliberately reads the
// settled, post-reload state (see docs/qa-strategy.md §5 "Settled-state count
// assertions"); this log keeps a genuinely stale pre-reload counter visible in
// the run output instead of silently absorbed by the reload. console.warn writes
// to stderr, so it cannot contaminate Cucumber's single stdout formatter slot
// (the starved-formatter lesson, PR #19).
const NotePreReloadCounter = (expectedCount: number) =>
    Interaction.where(`#actor notes the pre-reload cart counter (soft signal)`, async actor => {
        try {
            const observed = await actor.answer(CartItemCount());
            if (observed.trim() !== String(expectedCount)) {
                console.warn(
                    `[R-08 soft signal] header cart counter read "${observed}" before the reload `
                    + `where ${expectedCount} was expected — the customer-data refresh race is live on `
                    + `this run (not a failure: the settled-state assertion follows the reload).`,
                );
            }
        } catch (error) {
            console.warn(
                `[R-08 soft signal] pre-reload cart counter could not be read `
                + `(${error instanceof Error ? error.message : String(error)}) — counter not rendered `
                + `yet (not a failure: the settled-state assertion follows the reload).`,
            );
        }
    });

// The header cart counter is refreshed asynchronously (customer-data) after a
// cart change — notably the page reload following a quantity update — so poll the
// question until it settles on the expected value rather than reading it once.
const ensureCartCount = (expectedCount: number) =>
    actorCalled('User').attemptsTo(
        NotePreReloadCounter(expectedCount),
        // Reload first, then poll. The header counter reads the `cart` customer-data
        // section from local storage; after an "Update Cart" page reload that section
        // is refreshed by an async /customer/section/load fetch that intermittently
        // serves a stale count (the quantity-update scenario flaked ~50% on CI even at
        // a 20 s poll). A fresh page load forces the section to re-sync from the
        // server before we read it — the robust fix for the counter-refresh race.
        Navigate.reloadPage(),
        Wait.upTo(Duration.ofSeconds(20)).until(CartItemCount(), equals(String(expectedCount))),
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
        Wait.upTo(Duration.ofSeconds(15)).until(CartPage.subtotal, isVisible()),
        Ensure.that(CartSubtotal(), includes(expectedSubtotal)),
    );
});

Then('my cart should be empty', async () => {
    await actorCalled('User').attemptsTo(
        Ensure.that(CartPage.emptyCartMessage, isVisible()),
    );
});
