import { Task } from '@serenity-js/core';
import { CallAnApi, GetRequest, LastResponse, Send } from '@serenity-js/rest';
import { Ensure, equals } from '@serenity-js/assertions';
import { BASE_URL } from '../serenity.config';

export const adminToken = process.env.MAGENTO_ADMIN_TOKEN ?? '';

export const MagentoApi = {
    restBaseUrl: () => `${BASE_URL}/rest/V1`,

    // Verifies a product is accessible on the storefront via the REST catalogue API.
    // Requires MAGENTO_ADMIN_TOKEN env var when the product may need to be created
    // (full create/verify will be wired here in the Docker CI phase).
    verifyProductIsAvailable: (productName: string) =>
        Task.where(`#actor verifies "${productName}" is available via the API`,
            Send.a(
                GetRequest.to(
                    `${MagentoApi.restBaseUrl()}/products?searchCriteria[filter_groups][0][filters][0][field]=name` +
                    `&searchCriteria[filter_groups][0][filters][0][value]=${encodeURIComponent(productName)}` +
                    `&searchCriteria[filter_groups][0][filters][0][condition_type]=eq`
                )
            ),
            Ensure.that(LastResponse.status(), equals(200)),
        ),
};
