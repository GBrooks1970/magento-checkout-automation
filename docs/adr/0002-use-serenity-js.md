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

**Installed version:** `@serenity-js/*` 3.43.2 (all packages pinned to the same minor)

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
// src/hooks/browser.hooks.ts — actor equipped per scenario
import { BrowseTheWebWithPlaywright } from '@serenity-js/playwright';

Before(async () => {
    browser = await chromium.launch({ headless: true });
    engage(Cast.where(actor =>
        actor.whoCan(BrowseTheWebWithPlaywright.using(browser))
    ));
});
```

**Living documentation:** `npm run test:report` converts the Serenity BDD JSON artifacts written
to `docs/reports/` into an HTML narrative report. Once published via GitHub Pages, this URL is the
primary deliverable a portfolio reviewer clicks through.

**Note on a discovered API constraint:** `Cast.where` in Serenity/JS v3 accepts a synchronous
function only. Because `chromium.launch()` is async, the browser launch lives in a Cucumber
`Before` hook, not in `configure()`. This pattern is documented in the official Serenity/JS
handbook and is consistent with how all supported test runners manage browser lifecycle.
