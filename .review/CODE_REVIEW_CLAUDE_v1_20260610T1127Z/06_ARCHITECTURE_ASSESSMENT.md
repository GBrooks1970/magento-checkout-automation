# Architecture Assessment

[<- Back to Index](00_CODE_REVIEW_CLAUDE_v1_20260610T1127Z.md) | [Next: Migration Plans ->](07_MIGRATION_PLANS.md)

**Reviewer:** AI assistant (CLAUDE Fable 5)

## Test Pyramid

- The suite is deliberately E2E-only: 12 UI scenarios, zero unit or integration tests. For a portfolio whose subject is "the hardest storefront surface", an inverted pyramid is a defensible scope choice - but it is nowhere *stated* as a choice, which is uncharacteristic for a repo this good at naming trade-offs.
- The API-driven Background is a partial middle layer: every scenario runs a real REST contract check before touching the UI, which catches data/environment drift below the UI tier.
- Gaps that a small investment would close: a PHPUnit test for the decline observer, and (if helper logic grows) unit tests for TypeScript utilities. Recommended in [05_RECOMMENDATIONS.md](05_RECOMMENDATIONS.md).
- Alignment verdict: pyramid-shaped thinking is present (fast preflight checks, API preconditions, bounded E2E count); the tiers themselves are not. Document the inversion as a scoped decision.

## SOLID Principles

- **SRP: strong.** Each Task does one journey action; each Question reads one value; PageElement modules split by page; hooks own lifecycle only. The PHP observer has exactly one job and an early-exit guard.
- **OCP: good.** New behaviour arrives as new Tasks/Questions (e.g. the decline path added `declined()`, `attemptExpectingDecline()`, `PaymentError` without modifying existing tasks). The factory-object pattern composes rather than inherits.
- **LSP: largely n/a** (no inheritance hierarchies in the suite); the module's renderer extends checkmo's component and is substitutable by construction - the one real inheritance use, used correctly.
- **ISP: adequate.** Actors carry exactly two abilities; step files import only what they bind. The wide `CheckoutPage` object (14 elements spanning four checkout stages) is the closest thing to a fat interface - acceptable, but it is the file that would split first (by checkout step) as coverage grows.
- **DIP: good at the seams.** Steps depend on Task abstractions, Tasks on PageElement abstractions; nothing below `interactions/` knows about Playwright directly. The phantom `playwright` import in hooks (R-04) is the one place a concrete dependency bypasses declaration.

## KISS (Keep It Simple, Stupid)

- The suite consistently chooses the simplest mechanism that survives contact with Magento: label clicks over hidden radios, attribute assertions over visibility, reload-then-poll over fighting the customer-data race, a name-to-slug map over catalogue navigation.
- The infrastructure's best KISS move is the two-line compose overlay ([docker-compose.ci.yml](docker-compose.ci.yml)) leveraging built-in Docker/MariaDB seeding instead of bespoke provisioning scripts.
- Where simplicity was overridden (the eight-virtual-type di.xml; the observer + command dual mechanism), the complexity is Magento's price of admission, and ADR-0005 documents why - though the unused command edges toward complexity without runtime purpose (R-05).
- The unused composite Task and Questions (R-07) are the only places the codebase carries more than it needs.

## YAGNI (You Aren't Gonna Need It)

- Mostly honoured: two REST endpoints and no speculative API client surface; no multi-browser matrix; no config framework beyond five env vars; the `actors/` folder stayed empty rather than growing speculative cast machinery.
- Violations are small and known: `CompleteCheckout` retained "as a reusable composite; candidate to prune" ([backlog.md](docs/backlog.md) (lines 291-293)); `emailFieldInvalid` built but never wired; `ValidationMessage`/`OrderConfirmation` Questions superseded but kept.
- The `smoke` profile and `@placesOrder` tag remain genuinely useful (safe shared-store runs) even though CI no longer needs them - infrastructure kept for a live use case, not speculation.
- The retained `not @deferred` filter in both profiles with zero deferred scenarios is cheap insurance for the documented quarantine workflow - acceptable.

## REST + OpenAPI

- Conformant *consumption*: correct Magento REST V1 endpoints, bearer auth, query-string search criteria, status-code assertions; the camelCase search-criteria trap is documented where the next engineer will look (ADR-0003 lines 64-71).
- No OpenAPI artifact exists; the used contract subset lives as prose + captured JSON in ADR-0003. At two endpoints this is proportionate; the recommendation is a contract table, not a spec toolchain.
- The suite does not validate response schemas beyond the four asserted fields - adequate for a precondition check whose failure mode is "fail fast with a clear API error".
- The repo *exposes* no API, so server-side REST/OpenAPI design standards are out of scope.

## ISTQB Strategies

- **Equivalence partitioning / boundary-ish design** shows in the quantity outline (1, 2, 3 - the minimum, a representative, and a multi-row computation) though no true boundary (0, max-qty, out-of-stock) is exercised.
- **Use-case testing** is the dominant technique - the four features map cleanly onto user goals with main and exception flows (decline, invalid email, missing details).
- **Negative testing** covers two input-validation paths and one downstream-failure path (payment decline), each asserting the *system's refusal behaviour* (non-advancement, intact cart) rather than just message text - mature negative-test design.
- **Risk-based prioritisation** is explicit and documented: [qa-strategy.md](docs/qa-strategy.md) section 5 ranks Magento-specific risks and maps each to a mitigation; the backlog's scoring system (breakage probability + portfolio impact + maintenance burden) is an honest, working prioritisation model.
- Absent techniques (decision tables, state-transition models) are not missed at this scope; a state-transition view of the four-step checkout would be the natural next pedagogical artifact.

## Pedagogical Comments

- This is the repo's signature strength: comments explain *why* at the exact point of friction - Serenity's 5 s wait ceiling vs Cucumber's step timeout, occlusion-aware `isVisible()`, the MSYS path-mangling trap, the masked left-of-pipe 127. A mid-level engineer reading only the code and its comments would learn most of the documented lessons.
- Comments cite their evidence (backlog items, implementation logs, ADRs, live DOM probes), making claims checkable rather than folkloric.
- The discipline extends to YAML and PHP, where comment quality usually collapses: bake.yml's dump step (lines 220-229) and the module's renderer header are as instructive as the TypeScript.
- Two lapses: the stale 30 s timeout comment ([AddToCart.ts](src/tasks/AddToCart.ts) (line 7)) and the silent never-fires `DeclineCommand` (R-05) - both cases where the comment layer fell behind the system it describes, mirroring the documentation-currency theme of this review.

---

[<- Previous: Recommendations](05_RECOMMENDATIONS.md) | [Back to Index](00_CODE_REVIEW_CLAUDE_v1_20260610T1127Z.md) | [Next: Migration Plans ->](07_MIGRATION_PLANS.md)
