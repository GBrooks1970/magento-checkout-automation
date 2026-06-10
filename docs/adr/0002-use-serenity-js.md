# 0002. Use Serenity/JS rather than hand-rolling Screenplay

**Status:** Accepted
**Date:** 2026-06-01

## Context

The Screenplay pattern can be implemented from scratch in TypeScript. Doing so would demonstrate
a deep understanding of the pattern. It would also mean building and maintaining the actor model,
the reporting, and the Playwright and Cucumber integration, none of which is the point this
portfolio is trying to make.

A from-scratch implementation is noted as a future side project — a standalone repository that
shows the pattern's internals in isolation. That project will sit alongside this one, and together
they will tell a stronger story than either alone: the from-scratch version demonstrates
comprehension of the design; this one demonstrates production-grade usage.

## Decision

Use Serenity/JS (v3.43). It provides a first-class Screenplay implementation, native Playwright
and Cucumber integration, TypeScript support, and living-documentation reports out of the box.

## Consequences

The repository gets mature reporting and integration without bespoke infrastructure, and the code
stays focused on test design rather than framework plumbing. The living documentation is itself a
portfolio artifact: a reviewer can click through narrated, passing scenarios.

The trade-off is a dependency on a third-party framework and its conventions, and less to show in
terms of low-level pattern mechanics. The README notes explicitly that hand-rolling was understood
as an option and declined on purpose. Choosing not to reinvent the wheel, and being able to say
why, is the senior signal here.

## Concrete detail

**Installed version:** `@serenity-js/*` 3.43.2 — pinned **exactly** in `package.json` (not a range).
The pin is deliberate: the per-scenario isolation strategy in `src/hooks/browser.hooks.ts` depends on
observed Serenity/JS v3 behaviour (a single reused Playwright context under the `using(browser)`
wiring); a floated minor could change that silently and reintroduce the backlog #10 cart-leak defect.

**Key integration points:**

```typescript
// src/serenity.config.ts — crew wired once at suite startup
import createSerenityBDDReporter from '@serenity-js/serenity-bdd';
import { ConsoleReporter } from '@serenity-js/console-reporter';
import { ArtifactArchiver, configure } from '@serenity-js/core';

configure({
    crew: [
        ArtifactArchiver.storingArtifactsAt('./docs/reports'),
        createSerenityBDDReporter(),
        ConsoleReporter.withDefaultColourSupport(),
    ],
});
```

```typescript
// src/hooks/browser.hooks.ts — browser launched once, actor equipped per scenario
import { BeforeAll, Before, AfterAll } from '@cucumber/cucumber';
import { BrowseTheWebWithPlaywright } from '@serenity-js/playwright';

let browser: Browser;

BeforeAll(async () => {                       // launch once for the whole run
    browser = await chromium.launch({ headless: true });
});

Before(() => {                                // engage a fresh cast per scenario
    engage(Cast.where(actor =>
        actor.whoCan(BrowseTheWebWithPlaywright.using(browser))
    ));
});

AfterAll(async () => {                        // close once at the end
    if (browser) { await browser.close(); }
});
```

**Living documentation:** `npm run test:report` converts the Serenity BDD JSON artifacts written
to `docs/reports/` into an HTML narrative report. Once published via GitHub Pages, this URL is the
primary deliverable a portfolio reviewer clicks through.

**Note on two discovered constraints, and a corrected pattern:**

1. `Cast.where` in Serenity/JS v3 accepts a *synchronous* function only. Because `chromium.launch()`
   is async, the launch cannot live inside `configure()` or inside `Cast.where`. Engagement
   (`engage(...)`) is therefore done in a Cucumber hook, not in `configure()`.
2. The launch must happen **once** (`BeforeAll`), not per scenario. An earlier version launched and
   closed the browser in `Before`/`After`; this left every scenario after the first bound to a
   browser that the previous `After` had already closed, so only the first scenario in a run passed.
   The corrected pattern above launches once in `BeforeAll`, engages a fresh cast per `Before`
   (Serenity/JS gives each scenario its own browser context), and closes in `AfterAll`. The defect
   and its diagnosis are recorded in `docs/implementation-logs/2026-06-02_live-smoke-test.md` (§3.2)
   and backlog Item #8.
