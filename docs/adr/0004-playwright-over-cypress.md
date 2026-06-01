# 0004. Use Playwright as the UI driver, over Cypress

Status: Accepted

## Context

The checkout is built on Knockout.js: asynchronous, with state changes that
depend on network responses. The chief source of flakiness on a surface like this
is waiting on the wrong thing. The driver choice affects how cleanly the suite can
wait on network and state rather than on time.

Both Playwright and Cypress are credible. Cypress has an excellent developer
experience and a strong community. Its architecture, running inside the browser
event loop, makes multi-origin flows and deep network interception more awkward.

## Decision

Use Playwright. Its multi-context handling and network interception are stronger
for this surface, and it integrates cleanly with Serenity/JS.

## Consequences

The suite can intercept and wait on the network calls the KO.js checkout depends
on, which is the route to a genuinely non-flaky E2E suite. Playwright's auto-waiting
reduces the temptation to reach for hard waits.

The trade-off is giving up Cypress's in-browser developer experience and its
time-travel debugger. Neither is decisive for a CI-first portfolio suite. This is
a fit decision, not a verdict that one tool is better than the other; each is the
right choice for a different shape of problem.

> Skeleton. Note the Playwright version and any network-interception helpers once
> the BrowseTheWeb ability is configured.
