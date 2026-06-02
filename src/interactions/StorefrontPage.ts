import { By, PageElement } from '@serenity-js/web';
import { BASE_URL } from '../serenity.config';

const productSlugs: Record<string, string> = {
    'Push It Messenger Bag': 'push-it-messenger-bag',
    'Fusion Backpack': 'fusion-backpack',
};

export const StorefrontPage = {
    urlFor: (productName: string): string => {
        const slug = productSlugs[productName];
        if (!slug) throw new Error(`No URL slug configured for product: "${productName}"`);
        return `${BASE_URL}/${slug}.html`;
    },

    addToCartButton: PageElement.located(By.css('#product-addtocart-button'))
        .describedAs('Add to Cart button'),

    quantityInput: PageElement.located(By.css('#qty'))
        .describedAs('quantity input'),

    cartCounter: PageElement.located(By.css('span.counter-number'))
        .describedAs('cart item counter'),

    successMessage: PageElement.located(By.css('div.message-success'))
        .describedAs('add-to-cart success message'),
};
