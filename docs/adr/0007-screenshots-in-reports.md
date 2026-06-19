# 0007. Screenshots in the report, configurable by environment

**Status:** Accepted
**Date:** 2026-06-19

## Context

The Serenity BDD living documentation narrates each scenario, but until now it carried no
screenshots — a reader saw the steps, not the storefront. Screenshots make the published report a
stronger portfolio artefact and give a future maintainer real forensic evidence when a scenario
fails.

Serenity/JS already supports this through the `Photographer` crew member (`@serenity-js/web`,
already a dependency), so the choice is not *whether to build* screenshot capture but *how to gate
it*. Two contexts pull in opposite directions:

- **Local runs** are interactive and exploratory; a richly illustrated report is the whole point,
  and it should need no configuration.
- **CI runs** publish the report to GitHub Pages on every green `main` push. Capturing a screenshot
  after every interaction there would bloat the published artifact and add capture latency on the
  cold pre-baked store (which the CI warm-up step already nurses).

This was designed as proposed future work in `docs/planning/0001-screenshots-in-test-reports.md`
and promoted to backlog Item #12 for delivery.

## Decision

Add the `Photographer` as an **optional crew member**, gated by environment:

- **Default ON locally** (`TakePhotosOfInteractions` — every interaction), **default OFF in CI**
  (no `Photographer` in the crew at all). CI is detected via `process.env.CI === 'true'` (set by
  GitHub Actions).
- A single override, `SCREENSHOTS=off|failures|all`, beats the environment default in both
  directions. `failures` maps to `TakePhotosOfFailures`; `all` to `TakePhotosOfInteractions`.

The decision logic lives in `src/config/screenshots.ts` (`photographer()` returns the crew member
or `null`); `src/serenity.config.ts` appends it conditionally so the crew is byte-for-byte the
prior baseline when screenshots are off.

## Consequences

The published CI report stays lean and the pipeline is unslowed by default, while local runs are
illustrated for free. CI can opt into `SCREENSHOTS=failures` for failure forensics without changing
the every-push published report.

Screenshots are **artifacts, not assertions**: a capture failure is logged by Serenity and never
fails a step, so the suite's non-flaky guarantee is preserved. The `Photographer` is a crew member,
not a Cucumber formatter, so it cannot collide with the "`@serenity-js/cucumber` is the sole stdout
formatter" rule that the empty-report incident established (see ADR-0002 and backlog Item #4) —
`cucumber.js` is untouched.

The accepted trade-off is report/artifact size locally (`TakePhotosOfInteractions` produces many
PNGs under the gitignored `docs/reports/`), which is exactly why CI defaults to off. The change
deliberately does **not** touch `src/hooks/browser.hooks.ts`: the per-scenario isolation reset there
is fragile (the cart-leak fix, backlog #10), so screenshot capture is kept out of the hooks.

## Alternatives Considered

- **On everywhere (including CI by default)** — rejected: bloats the published Pages artifact and
  slows the cold CI store, for little gain on a green run whose signal is the badge.
- **Off everywhere, opt-in only** — rejected: local runs are where an illustrated report is most
  valuable, and requiring an env var for the common local case is friction for no benefit.
- **`TakePhotosBeforeAndAfterInteractions`** (a third Serenity strategy) — rejected as the default:
  it roughly doubles captures for a marginal narrative gain; `TakePhotosOfInteractions` is the
  right local default, and `failures` the right CI opt-in.
- **Capturing in the Cucumber hooks** — rejected: would entangle screenshots with the deliberately
  delicate per-scenario isolation reset; the crew member captures via the actor's existing web
  ability with no hook changes.
