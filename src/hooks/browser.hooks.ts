import { BeforeAll, Before, AfterAll, setDefaultTimeout } from '@cucumber/cucumber';
import { Cast, engage } from '@serenity-js/core';
import { BrowseTheWebWithPlaywright } from '@serenity-js/playwright';
import { CallAnApi } from '@serenity-js/rest';
import { chromium } from 'playwright';
import type { Browser } from 'playwright';
import { BASE_URL } from '../serenity.config';
import { MagentoApi } from '../api/MagentoApiClient';

// Cucumber's default per-step timeout is 5 s. A real Magento checkout step combines
// network latency with several Knockout.js re-renders, which can legitimately exceed
// that against a live store, producing spurious "function timed out" failures. Raise
// it to a realistic ceiling for live/CI runs. See backlog #10.
setDefaultTimeout(30 * 1000);

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
    browser = await chromium.launch({
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
        await context.clearCookies().catch(() => { /* nothing to clear */ });
        for (const page of context.pages()) {
            // Runs in the browser; reach storage via globalThis so this type-checks
            // under the Node tsconfig (no DOM lib) without pulling in DOM types.
            await page.evaluate(() => {
                const w = globalThis as unknown as {
                    localStorage?: { clear(): void };
                    sessionStorage?: { clear(): void };
                };
                w.localStorage?.clear();
                w.sessionStorage?.clear();
            }).catch(() => { /* no accessible storage on this page */ });
        }
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
