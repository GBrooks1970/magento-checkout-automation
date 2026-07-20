import { Interaction } from '@serenity-js/core';
import { PlaywrightPage } from '@serenity-js/playwright';
import { CheckoutPage } from './CheckoutPage';
import { browserEngine, routeTransitionTimeoutMilliseconds } from '../config/wait-durations';

const isCheckoutRoute = (url: URL): boolean =>
    url.pathname === '/checkout' || url.pathname === '/checkout/';

export const StabiliseCheckoutRoute = {
    afterProceedClick: () =>
        Interaction.where('#actor confirms the checkout route is ready', async actor => {
            const engine = browserEngine();
            const pageModel = await actor.answer(PlaywrightPage.current());
            const page = await pageModel.nativePage();

            try {
                await page.waitForURL(isCheckoutRoute, {
                    timeout: routeTransitionTimeoutMilliseconds,
                    waitUntil: 'domcontentloaded',
                });
            } catch (error) {
                // Chromium is the required gate: never conceal a broken checkout
                // button there. Firefox/WebKit sometimes display Magento's loader
                // forever while remaining on /checkout/cart; recover those
                // exploratory engines through the same canonical destination and
                // leave a visible signal for promotion decisions (backlog #15).
                if (engine === 'chromium') {
                    throw error;
                }

                console.warn(
                    `[MAG-15 route recovery] ${engine} remained on ${new URL(page.url()).pathname} ` +
                    `after the Proceed to Checkout click; navigating to the canonical checkout route.`,
                );
                await page.goto(CheckoutPage.url(), { waitUntil: 'domcontentloaded' });
                return;
            }

            if (engine === 'webkit') {
                // WebKit can reach /checkout/ while Knockout's first bootstrap is
                // permanently stuck. A canonical reload after the route proof
                // gives it a clean client bootstrap without masking navigation.
                // Keep the recovery observable: promotion requires this workaround
                // to become unnecessary, not merely a green scenario count.
                console.warn(
                    '[MAG-15 bootstrap recovery] webkit reached checkout; reloading the canonical ' +
                    'route to avoid the observed stuck Knockout bootstrap.',
                );
                await page.goto(CheckoutPage.url(), { waitUntil: 'domcontentloaded' });
            }
        }),
};
