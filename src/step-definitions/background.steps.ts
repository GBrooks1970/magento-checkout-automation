import { Given } from '@cucumber/cucumber';
import { actorCalled, Wait } from '@serenity-js/core';
import { Navigate, isVisible } from '@serenity-js/web';
import { BrowseStorefront } from '../tasks/BrowseStorefront';
import { AddToCart } from '../tasks/AddToCart';
import { StorefrontPage } from '../interactions/StorefrontPage';

// Product availability: on the public Luma demo the sample products are pre-loaded.
// With a Docker instance the MagentoApiClient will be wired in here to create/verify
// products via the REST API before each scenario.
Given('a product {string} priced at {string} is available', async (productName: string, _price: string) => {
    await actorCalled('User').attemptsTo(
        Navigate.to(StorefrontPage.urlFor(productName)),
        Wait.until(StorefrontPage.addToCartButton, isVisible()),
    );
});

Given('I am browsing the storefront as a guest', async () => {
    await actorCalled('User').attemptsTo(
        BrowseStorefront.asGuest(),
    );
});

Given('I have {string} in my cart with quantity {int}', async (productName: string, quantity: number) => {
    await actorCalled('User').attemptsTo(
        AddToCart.productWithQuantity(productName, quantity),
    );
});
