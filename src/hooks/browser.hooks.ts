import { BeforeAll, Before, AfterAll } from '@cucumber/cucumber';
import { Cast, engage } from '@serenity-js/core';
import { BrowseTheWebWithPlaywright } from '@serenity-js/playwright';
import { chromium } from 'playwright';
import type { Browser } from 'playwright';

// The browser is launched once for the whole run and kept open. Serenity/JS
// gives each scenario its own isolated browser context and discards it when the
// actor is dismissed, so a single browser safely serves every scenario.
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
});

// Cast.where is synchronous-only in Serenity/JS v3, so engagement stays in
// Before (per scenario) while the async launch lives in BeforeAll (once).
Before(() => {
    engage(Cast.where(actor =>
        actor.whoCan(BrowseTheWebWithPlaywright.using(browser))
    ));
});

AfterAll(async () => {
    if (browser) {
        await browser.close();
    }
});
