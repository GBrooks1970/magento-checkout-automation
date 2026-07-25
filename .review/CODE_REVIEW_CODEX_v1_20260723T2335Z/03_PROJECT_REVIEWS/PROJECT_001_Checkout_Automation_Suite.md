# Project Review: Magento Checkout Automation

[<- Previous: Risks and Issues](../02_RISKS_AND_ISSUES.md) | [Back to Index](../00_CODE_REVIEW_CODEX_v1_20260723T2335Z.md) | [Next: Cross-Cutting Analysis ->](../04_CROSS_PROJECT_ANALYSIS.md)

**Reviewer:** AI assistant (OpenAI Codex, GPT-5)
**Date:** 2026-07-23T23:35Z

## Project Intent and Stack

The repository demonstrates guest-checkout E2E automation against a disposable Magento 2.4.8
Luma store. The declared stack is TypeScript, Cucumber 12.9.0, Serenity/JS 3.43.2, and Playwright
1.60.0, supported by Docker Compose, two Magento fixture modules, Serenity living documentation,
and GitHub Actions.

## Review Summary

- **Architecture and pattern fidelity:** The implementation uses Screenplay well. Gherkin glue in
  `src/step-definitions/` delegates to Tasks and Questions; page-area selectors remain in
  `src/interactions/`; Abilities are engaged in hooks. `StabiliseCheckoutRoute` is correctly an
  Interaction because it describes a low-level browser recovery rather than business intent.
- **Correctness and stability:** Isolation logic is unusually well evidenced. The default path
  clears storage, parks pages, and clears cookies after aborting in-flight responses; trace mode
  instead creates and closes a fresh context per scenario. Central wait tiers and viewport-aware
  checks avoid fixed sleeps. Risk 3 identifies one remaining false-positive negative oracle.
- **Data setup and authentication:** Product verification and guest-cart seeding are API-driven.
  Admin tokens are cached per run, explicit tokens take priority, and non-local targets refuse
  implicit credentials. The cart-adopt fixture is default-off and clearly labelled test-only.
  Server-side guest quotes are not cleaned up, which matters to the smoke profile contract.
- **Specifications and coverage:** Four readable feature files expand to 12 active scenarios. The
  suite covers add/update/remove, subtotal calculations, checkout validation, successful orders,
  and deterministic decline. Boundary values are modest (quantities 1-3); tax, shipping-rate,
  accessibility, visual, and performance coverage is intentionally outside the committed backlog.
- **CI and reporting:** Preflight validates both baked images, the engine matrix is event-aware,
  Chromium remains required, exact Serenity JSON counts protect Pages, and teardown uses
  `always()`. The latest current-SHA run proves Chromium and Firefox jobs green and WebKit red but
  non-blocking. Deployment concurrency and immutable pins are the principal CI gaps.
- **Documentation:** ADRs and immutable implementation logs are excellent evidence. Backlog,
  README, registry, licence, and handover are broadly aligned. Architecture and Screenplay guides
  need a current-state refresh after the July cross-browser/trace work.
- **Portfolio credibility:** Strong. The repository shows senior judgement through root-cause
  evidence, accepted trade-offs, explicit promotion gates, and protections against past reporting
  failures. It will be stronger after the safety boundary and false-positive validation oracle are
  corrected and a small fast-test layer is introduced.

## Runtime Lifecycle Assessment

### Default path (`TRACE` off)

1. `BeforeAll` selects and launches one browser and authenticates once.
2. Each `Before` parks existing pages, clears client storage, then clears cookies.
3. A new Cast is engaged with web and API Abilities.
4. Scenario steps execute serially through Cucumber.
5. `AfterAll` closes the browser.

This is a pragmatic adaptation to Serenity/JS v3 context ownership. The ordering at
[browser.hooks.ts](src/hooks/browser.hooks.ts) (lines 134-172) correctly handles late Magento
`Set-Cookie` responses.

### Trace path (`TRACE=on-failure`)

Each scenario receives a new context and page, tracing/video start before engagement, and the
`After` hook retains artifacts only for non-passing outcomes. This gives stronger isolation while
keeping the default path free of capture overhead. The branch complexity is sufficient to justify
unit-level lifecycle tests.

## Synchronisation and Stability Assessment

- Explicit ceilings are centralised by engine and semantic purpose.
- Add-to-cart separates presence from viewport position and visibility.
- Cart quantity uses server-rendered rows as the hard oracle and keeps the header cache as
  telemetry.
- Firefox/WebKit route recovery is observable on stderr; Chromium cannot use it.
- WebKit's current Linux failure is not hidden: the matrix leg is failed, only the workflow-level
  conclusion is allowed to remain green.
- One negative checkout assertion samples absence too early; see Risk 3.

## CI Assessment

- **Workflow correctness:** Strong preflight, matrix computation, warm-up, full suite, exact report
  guard, render, upload, teardown, and Pages stages.
- **Caching/image strategy:** npm caching is enabled; immutable-looking bake tags make adoption
  reviewable. Three engine jobs share a cache key, so only one may save it; this is benign.
- **Secrets:** Bake-only Adobe Marketplace credentials are environment-scoped. Runtime E2E needs no
  Magento repository secrets because credentials belong to the disposable image.
- **Published artifacts:** Only Chromium uploads the Pages artifact, preventing matrix ambiguity.
  Trace/video capture is opt-in and not uploaded by the current CI default.
- **Local reproducibility:** Well documented via Compose, but the `smoke` profile must not be
  described as read-only. The full image build remains heavyweight and needs Marketplace keys.

## Dependency, Security, and Licence Assessment

- `package-lock.json` exists and `npm ci` is used in CI.
- `npm audit --audit-level=low` returned 0 vulnerabilities.
- No token/private-key pattern was found in the tracked tree. Known Docker credentials are clearly
  test-only but the port binding weakens that safety assumption.
- Direct package updates are available, but current pins reflect an explicit Node 20/Playwright
  compatibility decision rather than silent abandonment.
- MIT is declared in both [LICENSE](LICENSE) and [package.json](package.json) (line 5).
- Actions and images are tag-pinned rather than content-pinned.

## Deferred, Quarantined, and Planned Coverage

- `@deferred` has no current scenario; payment failure was activated after its deterministic
  fixture landed.
- The QA strategy's future `@pending` advice is ineffective and should be reconciled.
- Firefox/WebKit promotion is operationally gated; latest current-SHA evidence remains Firefox
  1/3, WebKit 0/3.
- Proposals 0004-0007 are optional. They should not be represented as missing delivery unless the
  owner promotes one into the backlog.

---

[<- Previous: Risks and Issues](../02_RISKS_AND_ISSUES.md) | [Back to Index](../00_CODE_REVIEW_CODEX_v1_20260723T2335Z.md) | [Next: Cross-Cutting Analysis ->](../04_CROSS_PROJECT_ANALYSIS.md)
