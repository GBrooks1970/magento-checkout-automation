import { ArtifactArchiver, configure } from '@serenity-js/core';
import createSerenityBDDReporter from '@serenity-js/serenity-bdd';
import { ConsoleReporter } from '@serenity-js/console-reporter';
import { photographer } from './config/screenshots';

// Default to the local Dockerised store — the only supported target. The old
// default (the softwaretestingboard.com public sandbox) has been dead since
// 2026-06-02 and made every fresh-clone run fail at BeforeAll with a raw fetch
// error. Point BASE_URL elsewhere only at a store you own: the API-driven
// Background mints an admin token with the test-target credentials.
export const BASE_URL = process.env.BASE_URL ?? 'http://localhost:8080';

// Screenshots are added as an optional crew member: present when enabled
// (default ON locally, OFF in CI), absent otherwise so the crew is byte-for-byte
// the no-screenshots baseline. The Photographer is a crew member, NOT a Cucumber
// formatter, so it cannot collide with the "@serenity-js/cucumber is the sole
// stdout formatter" rule that the empty-report incident established (backlog #4).
const photo = photographer();

configure({
    crew: [
        ArtifactArchiver.storingArtifactsAt('./docs/reports'),
        createSerenityBDDReporter(),
        ConsoleReporter.withDefaultColourSupport(),
        ...(photo ? [photo] : []),
    ],
});
