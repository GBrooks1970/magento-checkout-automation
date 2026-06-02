import { configure, Cast } from '@serenity-js/core';
import { BrowseTheWebWithPlaywright } from '@serenity-js/playwright';
import { SerenityBDDReporter } from '@serenity-js/serenity-bdd';
import { ConsoleReporter } from '@serenity-js/console-reporter';
import { chromium } from 'playwright';

configure({
    crew: [
        new ConsoleReporter(),
        SerenityBDDReporter.fromJSON({ outputDirectory: 'docs/reports' }),
    ],
    actors: Cast.where(actor =>
        actor.whoCan(
            BrowseTheWebWithPlaywright.using(chromium, {
                headless: true,
            })
        )
    ),
});
