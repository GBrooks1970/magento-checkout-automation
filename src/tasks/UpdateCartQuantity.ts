import { Duration, Task, Wait } from '@serenity-js/core';
import { Clear, Click, Enter, Navigate, isVisible } from '@serenity-js/web';
import { CartPage } from '../interactions/CartPage';

export const UpdateCartQuantity = {
    of: (productName: string, to: number) =>
        Task.where(`#actor updates the quantity of "${productName}" to ${to}`,
            Navigate.to(CartPage.url()),
            Wait.upTo(Duration.ofSeconds(15)).until(CartPage.quantityInputFor(productName), isVisible()),
            Clear.theValueOf(CartPage.quantityInputFor(productName)),
            Enter.theValue(String(to)).into(CartPage.quantityInputFor(productName)),
            Click.on(CartPage.updateCartButton),
            // "Update Cart" submits a form that fully reloads the cart page.
            // Wait for that reload to settle (subtotal row re-rendered) before
            // the task returns — otherwise the next step's Navigate.to the same
            // URL races the in-flight reload and Playwright aborts the goto
            // (net::ERR_ABORTED, seen in CI which is slower than local).
            Wait.upTo(Duration.ofSeconds(15)).until(CartPage.subtotal, isVisible()),
        ),
};
