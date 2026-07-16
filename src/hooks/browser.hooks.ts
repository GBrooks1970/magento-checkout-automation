import { BeforeAll, Before, AfterAll, setDefaultTimeout } from '@cucumber/cucumber';
import { Cast, engage } from '@serenity-js/core';
import { BrowseTheWebWithPlaywright } from '@serenity-js/playwright';
import { CallAnApi } from '@serenity-js/rest';
import { chromium, firefox, webkit } from 'playwright';
import type { Browser, BrowserType } from 'playwright';
import { BASE_URL } from '../serenity.config';
import { MagentoApi } from '../api/MagentoApiClient';

// Cross-browser run matrix (backlog #14 / planning proposal 0003). BROWSER
// selects the Playwright engine: unset defaults to chromium (the required CI
// gate); an unrecognised value fails loudly at BeforeAll rather than
// silently falling back. Firefox and WebKit are additive, non-blocking CI
// matrix legs (see .github/workflows/ci.yml) and can also be run locally,
// e.g. `BROWSER=firefox npm run test:smoke`.
type EngineName = 'chromium' | 'firefox' | 'webkit';

function resolveBrowserType(): BrowserType {
    const requested = (process.env.BROWSER ?? 'chromium').toLowerCase();
    switch (requested as EngineName) {
        case 'chromium':
            return chromium;
        case 'firefox':
            return firefox;
        case 'webkit':
            return webkit;
        default:
            throw new Error(
                `Unsupported BROWSER "${process.env.BROWSER}" — expected one of ` +
                `chromium | firefox | webkit (case-insensitive), or unset for the chromium default.`
            );
    }
}

// Cucumber's default per-step timeout is 5 s. A real Magento checkout step combines
// network latency with several Knockout.js re-renders, which can legitimately exceed
// that against a live store, producing spurious "function timed out" failures. Some
// steps now chain multiple 20 s Serenity Wait ceilings (e.g. the shipping form waits
// on both the email input and the dependent state dropdown), so the step ceiling must
// sit comfortably above their sum on a cold CI store. See backlog #10.
setDefaultTimeout(60 * 1000);

// The browser is launched once for the whole run and kept open, and each
// scenario gets its own fresh browser context (see Before).
//
// Do NOT move the launch back into `Before` and close it in `After`: launching
// and closing per scenario leaves scenarios 2+ bound to a closed browser, so
// only the first scenario in a run passes and the rest fail at first navigation
// with "Target page, context or browser has been closed". See
// docs/implementation-logs/2026-06-02_live-smoke-test.md (§3.2) and backlog #8.
let browser: Browser;

BeforeAll(async () => {
    browser = await resolveBrowserType().launch({
        headless: (process.env.HEADLESS ?? 'true') === 'true',
    });

    // Resolve the admin bearer token once for the whole run, so API-driven
    // Background steps (ADR-0003) can authenticate against the catalogue API.
    // Prefers MAGENTO_ADMIN_TOKEN; otherwise mints one from admin credentials.
    await MagentoApi.authenticate();
});

// Enforce per-scenario isolation. A Magento guest cart is keyed on the session
// cookie, so state surviving into the next scenario lets carts ACCUMULATE across
// scenarios — observed against the clean Docker store as cart counts of 3 where 2
// was expected and 8 where 1 was expected (backlog #10).
//
// Serenity/JS reuses a SINGLE Playwright browser context for the whole run with
// this `using(browser)` wiring (closing it out from under Serenity breaks every
// scenario after the first with "Target page, context or browser has been
// closed"). So rather than recreate the context, we RESET its state at the start
// of each scenario: clear cookies (drops the Magento PHPSESSID, so the next
// request starts a fresh, empty guest cart) and clear local/session storage (the
// Knockout.js mini-cart reads cached cart sections from `mage-cache-storage`).
//
// Cast.where is synchronous-only in Serenity/JS v3, so engagement stays in
// Before (per scenario) while the async launch lives in BeforeAll (once).
Before(async () => {
    for (const context of browser.contexts()) {
        for (const page of context.pages()) {
            // 1. Clear the store-origin web storage while the page is still on it.
            //    Runs in the browser; reach storage via globalThis so this
            //    type-checks under the Node tsconfig (no DOM lib).
            await page.evaluate(() => {
                const w = globalThis as unknown as {
                    localStorage?: { clear(): void };
                    sessionStorage?: { clear(): void };
                };
                w.localStorage?.clear();
                w.sessionStorage?.clear();
            }).catch(() => { /* no accessible storage on this page */ });

            // 2. Park the page on about:blank to ABORT the previous scenario's
            //    in-flight requests before cookies are cleared. Magento re-sends
            //    `Set-Cookie: PHPSESSID=<same>` on every response, so a late
            //    async customer-data response landing AFTER clearCookies()
            //    re-installs the old session — the previous scenario's server-side
            //    cart then leaks into this one (observed in CI run 27295894167:
            //    count read 3 where 2 expected; the count survived a reload + 20 s
            //    poll, proving a server-side leak, not a stale client cache).
            await page.goto('about:blank').catch(() => { /* page already closing */ });
        }

        // 3. Clear cookies LAST, once nothing can re-set them. Deliberately NOT
        //    wrapped in a swallowing catch: if the reset genuinely fails, fail
        //    THIS scenario loudly at Before rather than as a baffling cart-count
        //    mismatch three steps later.
        await context.clearCookies();
    }

    engage(Cast.where(actor =>
        actor.whoCan(
            BrowseTheWebWithPlaywright.using(browser),
            CallAnApi.at(BASE_URL),
        )
    ));
});

AfterAll(async () => {
    if (browser) {
        await browser.close();
    }
});
