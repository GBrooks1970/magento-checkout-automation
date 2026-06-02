import { Task, Wait } from '@serenity-js/core';
import { Clear, Click, Enter, Navigate, isVisible } from '@serenity-js/web';
import { CartPage } from '../interactions/CartPage';

export const UpdateCartQuantity = {
    of: (productName: string, to: number) =>
        Task.where(`#actor updates the quantity of "${productName}" to ${to}`,
            Navigate.to(CartPage.url()),
            Wait.until(CartPage.quantityInputFor(productName), isVisible()),
            Clear.theValueOf(CartPage.quantityInputFor(productName)),
            Enter.theValue(String(to)).into(CartPage.quantityInputFor(productName)),
            Click.on(CartPage.updateCartButton),
        ),
};
