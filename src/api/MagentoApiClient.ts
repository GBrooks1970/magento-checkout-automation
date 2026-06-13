import { Task } from '@serenity-js/core';
import { GetRequest, LastResponse, Send } from '@serenity-js/rest';
import { Ensure, equals, isGreaterThan } from '@serenity-js/assertions';
import { BASE_URL } from '../serenity.config';

/**
 * Thin client over the Magento REST API, used to establish and verify test
 * preconditions via the API rather than the UI ("API setup, UI assertion" —
 * ADR-0003). The Background step uses {@link verifyProductIsAvailable} so a
 * scenario fails fast with a clear API error if its product/price assumption is
 * wrong, instead of failing obscurely deep in the UI.
 *
 * Auth: catalogue endpoints are admin-scoped, so an admin bearer token is
 * required. {@link authenticate} resolves one once per run — preferring an
 * explicit MAGENTO_ADMIN_TOKEN, otherwise minting one from admin credentials.
 * The well-known `admin`/`Password123!` defaults are used ONLY when BASE_URL
 * resolves to localhost (the Docker test target); against any other host,
 * missing credentials fail fast rather than probing a real store with guessable
 * defaults (review R-09).
 * NOTE: Magento 2.4.x blocks token issuance until admin 2FA is disabled on the
 * test target — see docs/admin-api-token-guide.md.
 */

interface MagentoProduct {
    sku: string;
    name: string;
    price: number;
}

interface ProductSearchResult {
    items: MagentoProduct[];
    total_count: number;
}

let cachedToken: string | undefined;

/**
 * True when BASE_URL points at the local Docker test target. Only there is it
 * safe to fall back to the well-known `admin`/`Password123!` credentials; any
 * other host is treated as a real store the caller must authenticate explicitly
 * (review R-09).
 */
const targetIsLocalhost = (): boolean => {
    try {
        const host = new URL(BASE_URL).hostname.toLowerCase();
        return host === 'localhost' || host === '127.0.0.1' || host === '::1' || host === '[::1]';
    } catch {
        return false;
    }
};

export const MagentoApi = {
    restBaseUrl: (): string => `${BASE_URL}/rest/V1`,

    /**
     * Resolve and cache an admin bearer token for the run. Call once in a
     * BeforeAll hook before any API task executes.
     */
    authenticate: async (): Promise<string> => {
        if (cachedToken) {
            return cachedToken;
        }

        const explicit = process.env.MAGENTO_ADMIN_TOKEN;
        if (explicit && explicit.trim().length > 0) {
            cachedToken = explicit.trim();
            return cachedToken;
        }

        const usernameEnv = process.env.MAGENTO_ADMIN_USERNAME;
        const passwordEnv = process.env.MAGENTO_ADMIN_PASSWORD;

        // Fall back to the well-known Docker test-target credentials only for a
        // localhost target. Against any other host, require explicit env vars
        // rather than probing a real store with guessable defaults (R-09).
        if (!targetIsLocalhost() && (!usernameEnv || !passwordEnv)) {
            throw new Error(
                `Refusing to authenticate against a non-localhost target (${BASE_URL}) ` +
                `with default credentials. Set MAGENTO_ADMIN_TOKEN, or both ` +
                `MAGENTO_ADMIN_USERNAME and MAGENTO_ADMIN_PASSWORD, for this store. ` +
                `The admin/Password123! defaults apply only to the local Docker test target.`,
            );
        }

        const username = usernameEnv ?? 'admin';
        const password = passwordEnv ?? 'Password123!';

        const response = await fetch(`${MagentoApi.restBaseUrl()}/integration/admin/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });

        if (!response.ok) {
            const detail = await response.text();
            throw new Error(
                `Failed to obtain a Magento admin token (HTTP ${response.status}). ` +
                `On Magento 2.4.x this usually means admin 2FA is still enabled on the ` +
                `test target — disable it (see docs/admin-api-token-guide.md) or supply ` +
                `MAGENTO_ADMIN_TOKEN directly. Response: ${detail}`,
            );
        }

        // The token endpoint returns the bearer token as a bare JSON string.
        cachedToken = (await response.json()) as string;
        return cachedToken;
    },

    /** The bearer token resolved by {@link authenticate}. Throws if not yet resolved. */
    token: (): string => {
        if (!cachedToken) {
            throw new Error(
                'MagentoApi.authenticate() must run before any API request ' +
                '(it is called in the BeforeAll hook in src/hooks/browser.hooks.ts).',
            );
        }
        return cachedToken;
    },

    /**
     * Resolve a product's SKU from its exact display name via the catalogue API.
     * Used by the cart-seeding Background step (ADR-0006): the guest-cart items
     * endpoint takes a SKU, while the Gherkin speaks in product names.
     */
    skuForProduct: async (productName: string): Promise<string> => {
        const response = await fetch(
            `${MagentoApi.restBaseUrl()}/products` +
            `?searchCriteria[filterGroups][0][filters][0][field]=name` +
            `&searchCriteria[filterGroups][0][filters][0][value]=${encodeURIComponent(productName)}` +
            `&searchCriteria[filterGroups][0][filters][0][conditionType]=eq`,
            { headers: { Authorization: `Bearer ${MagentoApi.token()}` } },
        );
        if (!response.ok) {
            throw new Error(`Product lookup for "${productName}" failed (HTTP ${response.status}).`);
        }
        const result = (await response.json()) as ProductSearchResult;
        if (result.total_count < 1 || !result.items[0]?.sku) {
            throw new Error(`No catalogue product matches name "${productName}".`);
        }
        return result.items[0].sku;
    },

    /**
     * Create an empty guest cart via the anonymous REST endpoint and return its
     * masked id (ADR-0006). No auth required — this is the same surface a
     * headless storefront uses.
     */
    createGuestCart: async (): Promise<string> => {
        const response = await fetch(`${MagentoApi.restBaseUrl()}/guest-carts`, { method: 'POST' });
        if (!response.ok) {
            throw new Error(`Failed to create a guest cart (HTTP ${response.status}): ${await response.text()}`);
        }
        // The endpoint returns the masked quote id as a bare JSON string.
        return (await response.json()) as string;
    },

    /**
     * Add an item to an API-created guest cart (ADR-0006).
     */
    addItemToGuestCart: async (maskedCartId: string, sku: string, qty: number): Promise<void> => {
        const response = await fetch(
            `${MagentoApi.restBaseUrl()}/guest-carts/${encodeURIComponent(maskedCartId)}/items`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cartItem: { quote_id: maskedCartId, sku, qty } }),
            },
        );
        if (!response.ok) {
            throw new Error(
                `Failed to add ${qty} x ${sku} to guest cart ${maskedCartId} ` +
                `(HTTP ${response.status}): ${await response.text()}`,
            );
        }
    },

    /**
     * Verify a product exists in the catalogue at the expected price, via the
     * REST API. Filters products by exact name and asserts the match and price.
     *
     * @param productName exact product name (e.g. "Push It Messenger Bag")
     * @param expectedPrice expected unit price as a number (e.g. 45)
     */
    verifyProductIsAvailable: (productName: string, expectedPrice: number): Task =>
        Task.where(`#actor verifies "${productName}" is available at ${expectedPrice} via the API`,
            Send.a(
                GetRequest.to(
                    `${MagentoApi.restBaseUrl()}/products` +
                    `?searchCriteria[filterGroups][0][filters][0][field]=name` +
                    `&searchCriteria[filterGroups][0][filters][0][value]=${encodeURIComponent(productName)}` +
                    `&searchCriteria[filterGroups][0][filters][0][conditionType]=eq`,
                ).using({
                    headers: { Authorization: `Bearer ${MagentoApi.token()}` },
                }),
            ),
            Ensure.that(LastResponse.status(), equals(200)),
            // total_count > 0 proves the product exists (a no-match search is still 200).
            Ensure.that(LastResponse.body<ProductSearchResult>().total_count, isGreaterThan(0)),
            Ensure.that(LastResponse.body<ProductSearchResult>().items[0].name, equals(productName)),
            Ensure.that(LastResponse.body<ProductSearchResult>().items[0].price, equals(expectedPrice)),
        ),
};
