import { Before, After } from '@cucumber/cucumber';
import { Cast, engage } from '@serenity-js/core';
import { BrowseTheWebWithPlaywright } from '@serenity-js/playwright';
import { chromium } from 'playwright';
import type { Browser } from 'playwright';

let browser: Browser;

Before(async () => {
    browser = await chromium.launch({
        headless: (process.env.HEADLESS ?? 'true') === 'true',
    });
    engage(Cast.where(actor =>
        actor.whoCan(BrowseTheWebWithPlaywright.using(browser))
    ));
});

After(async () => {
    if (browser) {
        await browser.close();
    }
});
