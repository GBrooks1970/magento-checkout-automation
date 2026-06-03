import { Duration, Task, Wait } from '@serenity-js/core';
import { Clear, Click, Enter, Navigate, isVisible } from '@serenity-js/web';
import { StorefrontPage } from '../interactions/StorefrontPage';

// The add-to-cart confirmation arrives via an AJAX round-trip plus a Knockout.js
// re-render, which on a cold page (first add of a run, or production-mode static
// regeneration) can exceed Serenity's 5 s default Wait ceiling. NB the Cucumber
// `setDefaultTimeout(30 s)` in browser.hooks bounds the *step*, not a Serenity
// `Wait.until`, so the per-wait ceiling must be raised explicitly. See backlog #10.
const successMessageTimeout = Duration.ofSeconds(15);

export const AddToCart = {
    product: (name: string) =>
        Task.where(`#actor adds "${name}" to their cart`,
            Navigate.to(StorefrontPage.urlFor(name)),
            Click.on(StorefrontPage.addToCartButton),
            Wait.upTo(successMessageTimeout).until(StorefrontPage.successMessage, isVisible()),
        ),

    productWithQuantity: (name: string, quantity: number) =>
        Task.where(`#actor adds ${quantity} of "${name}" to their cart`,
            Navigate.to(StorefrontPage.urlFor(name)),
            Clear.theValueOf(StorefrontPage.quantityInput),
            Enter.theValue(String(quantity)).into(StorefrontPage.quantityInput),
            Click.on(StorefrontPage.addToCartButton),
            Wait.upTo(successMessageTimeout).until(StorefrontPage.successMessage, isVisible()),
        ),
};
