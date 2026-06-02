import { Task, Wait } from '@serenity-js/core';
import { Clear, Click, Enter, Navigate, isVisible } from '@serenity-js/web';
import { StorefrontPage } from '../interactions/StorefrontPage';

export const AddToCart = {
    product: (name: string) =>
        Task.where(`#actor adds "${name}" to their cart`,
            Navigate.to(StorefrontPage.urlFor(name)),
            Click.on(StorefrontPage.addToCartButton),
            Wait.until(StorefrontPage.successMessage, isVisible()),
        ),

    productWithQuantity: (name: string, quantity: number) =>
        Task.where(`#actor adds ${quantity} of "${name}" to their cart`,
            Navigate.to(StorefrontPage.urlFor(name)),
            Clear.theValueOf(StorefrontPage.quantityInput),
            Enter.theValue(String(quantity)).into(StorefrontPage.quantityInput),
            Click.on(StorefrontPage.addToCartButton),
            Wait.until(StorefrontPage.successMessage, isVisible()),
        ),
};
