import { By, PageElement } from '@serenity-js/web';
import { BASE_URL } from '../serenity.config';
import { productSlug } from '../config/product-slugs';

export const StorefrontPage = {
    urlFor: (productName: string): string => `${BASE_URL}/${productSlug(productName)}.html`,

    addToCartButton: PageElement.located(By.css('#product-addtocart-button'))
        .describedAs('Add to Cart button'),

    quantityInput: PageElement.located(By.css('#qty'))
        .describedAs('quantity input'),

    successMessage: PageElement.located(By.css('div.message-success'))
        .describedAs('add-to-cart success message'),
};
