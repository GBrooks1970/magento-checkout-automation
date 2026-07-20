import { Task, Wait } from '@serenity-js/core';
import { isPresent } from '@serenity-js/assertions';
import { Clear, Click, Enter, Navigate, Scroll, isVisible } from '@serenity-js/web';
import { StorefrontPage } from '../interactions/StorefrontPage';
import { waitFor } from '../config/wait-durations';

// The add-to-cart confirmation arrives via an AJAX round-trip plus a Knockout.js
// re-render, which on a cold page (first add of a run, or production-mode static
// regeneration) can exceed Serenity's 5 s default Wait ceiling. NB the Cucumber
// Cucumber's step timeout in browser.hooks bounds the *step*, not a Serenity
// `Wait.until`, so the per-wait ceiling must be explicit. See backlog #10/#15.

export const AddToCart = {
    product: (name: string) =>
        Task.where(`#actor adds "${name}" to their cart`,
            Navigate.to(StorefrontPage.urlFor(name)),
            Click.on(StorefrontPage.addToCartButton),
            Wait.upTo(waitFor.asynchronousUpdate).until(StorefrontPage.successMessage, isPresent()),
            Scroll.to(StorefrontPage.successMessage),
            Wait.upTo(waitFor.asynchronousUpdate).until(StorefrontPage.successMessage, isVisible()),
        ),

    productWithQuantity: (name: string, quantity: number) =>
        Task.where(`#actor adds ${quantity} of "${name}" to their cart`,
            Navigate.to(StorefrontPage.urlFor(name)),
            Clear.theValueOf(StorefrontPage.quantityInput),
            Enter.theValue(String(quantity)).into(StorefrontPage.quantityInput),
            Click.on(StorefrontPage.addToCartButton),
            Wait.upTo(waitFor.asynchronousUpdate).until(StorefrontPage.successMessage, isPresent()),
            Scroll.to(StorefrontPage.successMessage),
            Wait.upTo(waitFor.asynchronousUpdate).until(StorefrontPage.successMessage, isVisible()),
        ),
};
