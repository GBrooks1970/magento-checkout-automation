import { Given } from '@cucumber/cucumber';
import { actorCalled } from '@serenity-js/core';
import { BrowseStorefront } from '../tasks/BrowseStorefront';
import { AdoptSeededCart } from '../tasks/AdoptSeededCart';
import { MagentoApi } from '../api/MagentoApiClient';

// Product availability is established as an API precondition (ADR-0003: "API setup,
// UI assertion"). Rather than navigating the storefront, the actor queries the
// Magento REST catalogue API and asserts the product exists at the expected price —
// so a scenario fails fast with a clear API error if its assumption is wrong, instead
// of failing obscurely later in the UI. The admin token is resolved once in the
// BeforeAll hook (see src/hooks/browser.hooks.ts).
Given('a product {string} priced at {string} is available', async (productName: string, price: string) => {
    await actorCalled('User').attemptsTo(
        MagentoApi.verifyProductIsAvailable(productName, Number.parseFloat(price)),
    );
});

Given('I am browsing the storefront as a guest', async () => {
    await actorCalled('User').attemptsTo(
        BrowseStorefront.asGuest(),
    );
});

// Cart preconditions are seeded through the REST API, not by clicking through the
// storefront (ADR-0003 / ADR-0006): create a guest cart, add the item by SKU, then
// bind the quote to the browser session via the Portfolio_CartSeed adopt endpoint.
// AddToCart (the UI journey) remains the implementation of the When steps, where
// adding to the cart is the behaviour under test rather than setup.
Given('I have {string} in my cart with quantity {int}', async (productName: string, quantity: number) => {
    const sku = await MagentoApi.skuForProduct(productName);
    const maskedCartId = await MagentoApi.createGuestCart();
    await MagentoApi.addItemToGuestCart(maskedCartId, sku, quantity);

    await actorCalled('User').attemptsTo(
        AdoptSeededCart.withId(maskedCartId),
    );
});
