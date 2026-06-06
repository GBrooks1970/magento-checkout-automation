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

        const username = process.env.MAGENTO_ADMIN_USERNAME ?? 'admin';
        const password = process.env.MAGENTO_ADMIN_PASSWORD ?? 'Password123!';

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
