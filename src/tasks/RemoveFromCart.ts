import { Duration, Task, Wait } from '@serenity-js/core';
import { Click, Navigate, isVisible } from '@serenity-js/web';
import { CartPage } from '../interactions/CartPage';

export const RemoveFromCart = {
    product: (productName: string) =>
        Task.where(`#actor removes "${productName}" from their cart`,
            Navigate.to(CartPage.url()),
            Wait.upTo(Duration.ofSeconds(15)).until(CartPage.deleteButtonFor(productName), isVisible()),
            Click.on(CartPage.deleteButtonFor(productName)),
            // Removing the last item triggers Magento's AJAX cart-empty
            // transition, which exceeds Serenity's 5 s default wait on the
            // slower CI runner (passed locally). Allow up to 15 s.
            Wait.upTo(Duration.ofSeconds(15)).until(CartPage.emptyCartMessage, isVisible()),
        ),
};
