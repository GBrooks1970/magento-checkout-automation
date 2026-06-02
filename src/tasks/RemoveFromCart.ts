import { Task, Wait } from '@serenity-js/core';
import { Click, Navigate, isVisible } from '@serenity-js/web';
import { CartPage } from '../interactions/CartPage';

export const RemoveFromCart = {
    product: (productName: string) =>
        Task.where(`#actor removes "${productName}" from their cart`,
            Navigate.to(CartPage.url()),
            Wait.until(CartPage.deleteButtonFor(productName), isVisible()),
            Click.on(CartPage.deleteButtonFor(productName)),
            Wait.until(CartPage.emptyCartMessage, isVisible()),
        ),
};
