<!--
  AUDIENCE: Engineers and AI agents working in this repository.
  PURPOSE:  Design + implementation plan for adding screenshots to the Serenity
            BDD test reports, configurable by environment (CI vs local).
  STATUS:   Proposed future work — NOT yet implemented. See docs/planning/README.md.
  LOCATION: docs/planning/0001-screenshots-in-test-reports.md
-->

# 0001 — Screenshots in the test reports (CI/local configurable)

**Status:** Designed (proposed — not implemented)
**Owner:** unassigned
**Rough effort:** 3–5 hours (implementation + validation + docs)
**Touches:** `src/serenity.config.ts`, a new `src/config/screenshots.ts`, `README.md`,
`docs/qa-strategy.md`, a new `docs/adr/0007-*.md` (on acceptance), `.github/workflows/ci.yml`
(optional, for CI opt-in + artifact retention)

---

## 1. Goal

Make the published Serenity BDD living documentation show **screenshots** of the browser at each
captured moment, so a reader (a hiring manager, or a future maintainer triaging a failure) sees the
actual storefront, not just the narrated steps.

The feature must be **configurable by environment**:

- **Running locally → screenshots ON by default.** Local runs are interactive and exploratory; a
  rich, illustrated report is the point. No env var should be needed to get screenshots locally.
- **Running in CI → screenshots OFF by default**, opt-in. CI runs publish the report on every green
  `main` push; capturing every interaction there would bloat the published Pages artifact and slow
  the pipeline. CI's signal is the green/red badge — screenshots there are a debugging aid, enabled
  deliberately (typically failures-only).
- A single explicit override must beat the environment default in both directions.

This is deliberately a small, well-scoped change: Serenity/JS already has first-class screenshot
support via the **`Photographer`** crew member (`@serenity-js/web`, already a dependency at
`3.43.2`). We are wiring and gating an existing capability, not building one.

## 2. Background — how Serenity captures screenshots

Serenity/JS takes screenshots through a **stage crew member** called `Photographer`, configured
with a **photo strategy**:

| Strategy (`@serenity-js/web`) | Captures | Cost | Best for |
|---|---|---|---|
| `TakePhotosOfFailures` | a screenshot only when an interaction fails | low | CI debugging |
| `TakePhotosOfInteractions` | a screenshot after every interaction | high | local, illustrated reports |

The `Photographer` is added to the **crew** in `src/serenity.config.ts`, exactly where the
report-writing crew already lives:

```ts
// src/serenity.config.ts (today)
configure({
    crew: [
        ArtifactArchiver.storingArtifactsAt('./docs/reports'),
        createSerenityBDDReporter(),
        ConsoleReporter.withDefaultColourSupport(),
    ],
});
```

Screenshots are emitted as Serenity **artifacts**, so the already-configured
`ArtifactArchiver.storingArtifactsAt('./docs/reports')` stores them and `serenity-bdd run` renders
them into the HTML report with no extra reporter wiring. The Photographer drives the actor's web
ability, which actors already have (`BrowseTheWebWithPlaywright.using(browser)` in
`src/hooks/browser.hooks.ts`), so no actor/ability change is needed.

**Crucially, this does not touch the stdout-formatter constraint.** The `Photographer` is a
*crew member*, not a Cucumber formatter, so it cannot collide with the
"`@serenity-js/cucumber` must be the sole `format` entry" rule that the v13 empty-report incident
established (see `docs/backlog.md` Item #4). No change to `cucumber.js`.

## 3. Configuration model

A single helper resolves the photo strategy from the environment. Precedence, highest first:

1. **Explicit override** — `SCREENSHOTS` env var: `off` | `failures` | `all`.
2. **Environment default** — if `SCREENSHOTS` is unset:
   - **CI** (detected via `process.env.CI === 'true'`, which GitHub Actions sets) → `off`.
   - **Local** (no `CI`) → `all`.

| Context | `SCREENSHOTS` unset | `SCREENSHOTS=off` | `SCREENSHOTS=failures` | `SCREENSHOTS=all` |
|---|---|---|---|---|
| Local | `all` (default ON) | none | failures only | every interaction |
| CI | `off` (default OFF) | none | failures only | every interaction |

Mapping to strategies: `all` → `TakePhotosOfInteractions`, `failures` → `TakePhotosOfFailures`,
`off` → no `Photographer` in the crew at all (zero overhead).

**Recommended CI opt-in.** Although CI defaults to `off`, the highest-value CI setting is
`SCREENSHOTS=failures` — set it on the `pull_request` leg (or behind a manual
`workflow_dispatch` input) so a red run leaves a failure screenshot in the artifacts without
bloating the every-push published report. This is a one-line `env:` addition, called out in the
plan below but left to the implementer's discretion.

### 3.1 Proposed helper

```ts
// src/config/screenshots.ts (new)
import { Photographer, TakePhotosOfFailures, TakePhotosOfInteractions } from '@serenity-js/web';
import type { StageCrewMember } from '@serenity-js/core';

type Mode = 'off' | 'failures' | 'all';

function resolveMode(): Mode {
    const explicit = process.env.SCREENSHOTS?.toLowerCase();
    if (explicit === 'off' || explicit === 'failures' || explicit === 'all') {
        return explicit;
    }
    // No explicit override: default by environment.
    const isCI = process.env.CI === 'true';
    return isCI ? 'off' : 'all';
}

/**
 * The screenshot crew member for the resolved mode, or null when screenshots
 * are off (so the caller adds nothing to the crew — zero overhead).
 *
 * Default: ON locally (every interaction), OFF in CI. Override with SCREENSHOTS=off|failures|all.
 */
export function photographer(): StageCrewMember | null {
    switch (resolveMode()) {
        case 'all':      return Photographer.whoWill(TakePhotosOfInteractions);
        case 'failures': return Photographer.whoWill(TakePhotosOfFailures);
        case 'off':      return null;
    }
}
```

### 3.2 Wiring it into the crew

```ts
// src/serenity.config.ts (after)
import { photographer } from './config/screenshots';

const photo = photographer();

configure({
    crew: [
        ArtifactArchiver.storingArtifactsAt('./docs/reports'),
        createSerenityBDDReporter(),
        ConsoleReporter.withDefaultColourSupport(),
        ...(photo ? [photo] : []),   // present only when screenshots are enabled
    ],
});
```

The `...(photo ? [photo] : [])` spread keeps the crew array exactly as it is today when screenshots
are `off`, so CI's default behaviour and report size are unchanged until someone opts in.

## 4. Implementation plan

1. **Add `src/config/screenshots.ts`** with the helper from §3.1.
2. **Wire it into `src/serenity.config.ts`** per §3.2. Keep the existing three crew members in the
   same order; append the photographer conditionally.
3. **Documentation:**
   - `README.md` "Environment variables" table → add `SCREENSHOTS` (`off` | `failures` | `all`;
     default: `all` locally, `off` in CI) with a one-line note that local runs are illustrated by
     default.
   - `docs/qa-strategy.md` → a short subsection: what is captured, why CI defaults off, and the
     recommended `SCREENSHOTS=failures` CI opt-in.
4. **(Optional) CI opt-in for failure forensics:** in `.github/workflows/ci.yml`, set
   `SCREENSHOTS: failures` on the PR/e2e job (not the `main` publish path), and ensure the
   `docs/reports/` screenshots are included in the uploaded run artifacts (they already flow through
   `ArtifactArchiver`; confirm the artifact-upload glob covers `*.png`). Leave the every-push
   published report lean.
5. **(On acceptance) Record `docs/adr/0007-screenshots-in-reports.md`** from
   `docs/templates/decision-record.template.md`, capturing the CI-off/local-on default and the
   `TakePhotosOfInteractions`-locally choice. Update `docs/adr/README.md`'s index.

## 5. Validation

All commands run against the local Dockerised store (the supported target). Cite real output in the
implementation log.

- [ ] `npx tsc --noEmit` clean.
- [ ] **Local default ON:** `BASE_URL=http://localhost:8080 npm run test:smoke` (no `SCREENSHOTS`
      set) → `docs/reports/` contains `.png` artifacts; the rendered report
      (`npx serenity-bdd run --source ./docs/reports`) shows screenshots under the steps.
- [ ] **Local explicit off:** `SCREENSHOTS=off npm run test:smoke` → no `.png` artifacts written;
      crew identical to today.
- [ ] **CI default OFF:** `CI=true npm run test:smoke` → no `.png` artifacts (simulates the Actions
      environment without changing the workflow).
- [ ] **CI opt-in failures:** `CI=true SCREENSHOTS=failures npm run test:smoke` against a
      deliberately-failing scenario → exactly one failure screenshot captured.
- [ ] Smoke suite still 7/7 and default 12/12 unaffected by the crew change (screenshots are
      additive; they must not alter pass/fail).

## 6. Trade-offs and risks

- **Report/artifact size.** `TakePhotosOfInteractions` produces many PNGs. This is acceptable
  locally (the report is gitignored under `docs/reports/`) and is exactly why CI defaults to `off`.
  The published GitHub Pages report stays lean unless someone deliberately enables `all` in CI.
- **Run time.** Each screenshot is a synchronous capture against the live page. On the cold CI
  store this compounds the render penalties the warm-up step already mitigates — another reason CI
  defaults off, and a reason to prefer `failures` over `all` even when opting in.
- **Isolation is untouched.** This change adds a crew member only; it does **not** alter the
  per-scenario context reset in `browser.hooks.ts`. That code is deliberately fragile (the cart-leak
  fix, backlog #10) — keeping screenshots out of the hooks is intentional. Contrast with proposal
  0002 (trace/video), which *does* touch context creation and therefore carries isolation risk.
- **Determinism.** Screenshots are artifacts, not assertions — they cannot flake a scenario. A
  capture failure is logged by Serenity and does not fail the step. This keeps the suite's
  non-flaky guarantee intact.
- **No stdout-formatter interaction.** Re-stated because it is the project's most expensive past
  lesson: the Photographer is a crew member, so it does not compete for Cucumber's single stdout
  formatter slot. `cucumber.js` is not touched.

## 7. Out of scope (deliberately)

- Trace/video capture on failure — see proposal **0002** (touches context creation; isolation risk).
- Visual-regression diffing of the screenshots — see proposal **0005** (needs baselines + tolerance).
- Masking dynamic regions (order numbers, dates) — only relevant once screenshots feed a *diff*
  (0005); for illustrative report screenshots, raw captures are fine.
