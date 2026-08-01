/**
 * Product-name -> URL-slug configuration for the storefront, kept pure (no
 * `BASE_URL` / Serenity stage coupling) so the mapping is unit-tested directly.
 * `StorefrontPage.urlFor` composes the slug with `BASE_URL`.
 */
const PRODUCT_SLUGS: Record<string, string> = {
    'Push It Messenger Bag': 'push-it-messenger-bag',
    'Fusion Backpack': 'fusion-backpack',
};

/** The configured URL slug for a product name; throws if none is configured. */
export function productSlug(productName: string): string {
    const slug = PRODUCT_SLUGS[productName];
    if (!slug) {
        throw new Error(`No URL slug configured for product: "${productName}"`);
    }
    return slug;
}
