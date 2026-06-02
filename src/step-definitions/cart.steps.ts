import { When, Then } from '@cucumber/cucumber';
import { actorCalled } from '@serenity-js/core';
import { Ensure, equals, includes } from '@serenity-js/assertions';
import { isVisible } from '@serenity-js/web';
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

Then('my cart should contain {int} item', async (expectedCount: number) => {
    await actorCalled('User').attemptsTo(
        Ensure.that(CartItemCount(), equals(String(expectedCount))),
    );
});

Then('my cart should contain {int} items', async (expectedCount: number) => {
    await actorCalled('User').attemptsTo(
        Ensure.that(CartItemCount(), equals(String(expectedCount))),
    );
});

Then('the cart subtotal should be {string}', async (expectedSubtotal: string) => {
    await actorCalled('User').attemptsTo(
        Ensure.that(CartSubtotal(), includes(expectedSubtotal)),
    );
});

Then('my cart should be empty', async () => {
    await actorCalled('User').attemptsTo(
        Ensure.that(CartPage.emptyCartMessage, isVisible()),
    );
});
