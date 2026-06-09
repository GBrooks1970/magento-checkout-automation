import { When, Then } from '@cucumber/cucumber';
import { actorCalled, Duration, Wait } from '@serenity-js/core';
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

// The header cart counter is refreshed asynchronously (customer-data) after a
// cart change — notably the page reload following a quantity update — so poll the
// question until it settles on the expected value rather than reading it once.
const ensureCartCount = (expectedCount: number) =>
    actorCalled('User').attemptsTo(
        // 20 s, not 10: the header counter refreshes via an async customer-data
        // reload after a cart change; on a cold CI store this intermittently
        // exceeded 10 s for the quantity-update scenario (backlog #2).
        Wait.upTo(Duration.ofSeconds(20)).until(CartItemCount(), equals(String(expectedCount))),
    );

Then('my cart should contain {int} item', async (expectedCount: number) => {
    await ensureCartCount(expectedCount);
});

Then('my cart should contain {int} items', async (expectedCount: number) => {
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
