import type { StageCrewMember } from '@serenity-js/core';
import { Photographer, TakePhotosOfFailures, TakePhotosOfInteractions } from '@serenity-js/web';

// Screenshots in the Serenity BDD report are produced by the Photographer crew
// member, gated by environment so they are rich locally and lean in CI.
//
//   - Locally (interactive, exploratory): screenshots ON by default — an
//     illustrated report is the point. No env var needed.
//   - In CI (publishes the report on every green main push): OFF by default, so
//     the published GitHub Pages artifact stays small and the cold store is not
//     slowed by a capture after every interaction.
//
// A single SCREENSHOTS override beats the environment default in both directions.
// See docs/planning/0001-screenshots-in-test-reports.md for the full design.

type Mode = 'off' | 'failures' | 'all';

function resolveMode(): Mode {
    const explicit = process.env.SCREENSHOTS?.toLowerCase();
    if (explicit === 'off' || explicit === 'failures' || explicit === 'all') {
        return explicit;
    }
    // No explicit override: default by environment. GitHub Actions sets CI=true.
    const isCI = process.env.CI === 'true';
    return isCI ? 'off' : 'all';
}

/**
 * The screenshot crew member for the resolved mode, or `null` when screenshots
 * are off (the caller then adds nothing to the crew — zero overhead, crew
 * identical to the no-screenshots baseline).
 *
 * Default: ON locally (every interaction), OFF in CI. Override with
 * `SCREENSHOTS=off|failures|all`.
 */
export function photographer(): StageCrewMember | null {
    switch (resolveMode()) {
        case 'all':
            return Photographer.whoWill(TakePhotosOfInteractions);
        case 'failures':
            return Photographer.whoWill(TakePhotosOfFailures);
        case 'off':
            return null;
    }
}
