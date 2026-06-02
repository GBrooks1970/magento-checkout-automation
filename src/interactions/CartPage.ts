import { By, PageElement, PageElements } from '@serenity-js/web';
import { BASE_URL } from '../serenity.config';

export const CartPage = {
    url: (): string => `${BASE_URL}/checkout/cart`,

    subtotal: PageElement.located(By.css('.cart-totals .subtotal .price'))
        .describedAs('cart subtotal'),

    itemCounter: PageElement.located(By.css('span.counter-number'))
        .describedAs('cart item counter'),

    proceedToCheckoutButton: PageElement.located(By.css('button.action.primary.checkout'))
        .describedAs('Proceed to Checkout button'),

    emptyCartMessage: PageElement.located(By.css('div.cart-empty'))
        .describedAs('empty cart message'),

    itemRows: PageElements.located(By.css('tbody tr.item-info'))
        .describedAs('cart item rows'),

    quantityInputFor: (productName: string) =>
        PageElement.located(
            By.css(`tr:has(td .product-item-name a[title="${productName}"]) input.qty`)
        ).describedAs(`quantity input for "${productName}"`),

    updateCartButton: PageElement.located(By.css('button[name="update_cart_action"]'))
        .describedAs('Update Cart button'),

    deleteButtonFor: (productName: string) =>
        PageElement.located(
            By.css(`tr:has(td .product-item-name a[title="${productName}"]) a.action-delete`)
        ).describedAs(`delete button for "${productName}"`),
};
