import { ArtifactArchiver, configure } from '@serenity-js/core';
import createSerenityBDDReporter from '@serenity-js/serenity-bdd';
import { ConsoleReporter } from '@serenity-js/console-reporter';

export const BASE_URL = process.env.BASE_URL ?? 'https://magento.softwaretestingboard.com';

configure({
    crew: [
        ArtifactArchiver.storingArtifactsAt('./docs/reports'),
        createSerenityBDDReporter(),
        ConsoleReporter.withDefaultColourSupport(),
    ],
});
