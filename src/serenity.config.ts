import { ArtifactArchiver, configure } from '@serenity-js/core';
import createSerenityBDDReporter from '@serenity-js/serenity-bdd';
import { ConsoleReporter } from '@serenity-js/console-reporter';

// Default to the local Dockerised store — the only supported target. The old
// default (the softwaretestingboard.com public sandbox) has been dead since
// 2026-06-02 and made every fresh-clone run fail at BeforeAll with a raw fetch
// error. Point BASE_URL elsewhere only at a store you own: the API-driven
// Background mints an admin token with the test-target credentials.
export const BASE_URL = process.env.BASE_URL ?? 'http://localhost:8080';

configure({
    crew: [
        ArtifactArchiver.storingArtifactsAt('./docs/reports'),
        createSerenityBDDReporter(),
        ConsoleReporter.withDefaultColourSupport(),
    ],
});
