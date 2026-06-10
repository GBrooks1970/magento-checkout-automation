import { By, PageElement } from '@serenity-js/web';
import { BASE_URL } from '../serenity.config';

export const CartPage = {
    url: (): string => `${BASE_URL}/checkout/cart`,

    // The cart-page order summary subtotal row. (The earlier
    // `.cart-totals .subtotal .price` matched nothing on Luma 2.4.8.)
    subtotal: PageElement.located(By.css('.totals.sub .price'))
        .describedAs('cart subtotal'),

    itemCounter: PageElement.located(By.css('span.counter-number'))
        .describedAs('cart item counter'),

    // Use the cart-page button specifically. The bare `button.action.primary.checkout`
    // selector also matches the header mini-cart button (#top-cart-btn-checkout), which
    // causes a Playwright strict-mode violation on live Luma. See backlog #10.
    proceedToCheckoutButton: PageElement.located(By.css('button[data-role="proceed-to-checkout"]'))
        .describedAs('Proceed to Checkout button'),

    emptyCartMessage: PageElement.located(By.css('div.cart-empty'))
        .describedAs('empty cart message'),

    // Scope to the row by the product link carrying title="<name>". On Luma the
    // name link has no title attribute; the product *photo* link does, so match
    // any `a[title=...]` within the row rather than `.product-item-name a[title=...]`.
    quantityInputFor: (productName: string) =>
        PageElement.located(
            By.css(`tr.item-info:has(a[title="${productName}"]) input.qty`)
        ).describedAs(`quantity input for "${productName}"`),

    updateCartButton: PageElement.located(By.css('button[name="update_cart_action"]'))
        .describedAs('Update Cart button'),

    // The delete ("Remove item") link sits in a sibling `tr.item-actions` row, not
    // `tr.item-info`, so scope to the whole `tbody.cart.item` for the product.
    deleteButtonFor: (productName: string) =>
        PageElement.located(
            By.css(`tbody.cart.item:has(a[title="${productName}"]) a.action-delete`)
        ).describedAs(`delete button for "${productName}"`),
};
