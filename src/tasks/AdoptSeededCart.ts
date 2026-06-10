import { Task } from '@serenity-js/core';
import { Navigate } from '@serenity-js/web';
import { BASE_URL } from '../serenity.config';

/**
 * Binds an API-seeded guest cart to the actor's browsing session by visiting
 * the Portfolio_CartSeed adopt endpoint (ADR-0006). The navigation must happen
 * in the BROWSER (not a node-side fetch): the whole point is that the store
 * attaches the quote to the session cookie this browser holds.
 *
 * The follow-up navigation to the storefront matters: the Before hook cleared
 * local storage, so the first real page load refetches all customer-data
 * sections from the server, making the header mini-cart counter reflect the
 * adopted cart (a GET controller does not trigger Magento's section
 * invalidation on its own).
 */
export const AdoptSeededCart = {
    withId: (maskedCartId: string) =>
        Task.where('#actor adopts the API-seeded cart into their browsing session',
            Navigate.to(`${BASE_URL}/cartseed/cart/adopt?id=${encodeURIComponent(maskedCartId)}`),
            Navigate.to(BASE_URL),
        ),
};
