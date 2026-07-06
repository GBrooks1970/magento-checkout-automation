# Cross-Cutting Analysis (within the repository)

[<- Back to Index](00_CODE_REVIEW_CLAUDE_Fable_5_v1_20260706T1048Z.md) | [Next: Recommendations ->](05_RECOMMENDATIONS.md)

**Reviewer:** AI assistant (CLAUDE Fable 5)
**Date:** 2026-07-06T10:48Z

Single-repository review: per the template's customisation notes, the nine
cross-project areas are applied as cross-cutting analyses within this repo
(suite vs CI vs Docker vs docs vs the PHP fixture modules), with `N/A` where an
area genuinely does not apply.

## Tool-Agnostic Tests

- The Gherkin layer is fully tool-agnostic: no selector, wait, or driver
  concept appears in any feature file; a different runner could re-implement
  the same 12 scenarios against the same step contract.
- The step-definition layer is Serenity-specific by design (ADR-0002); the
  documented decision makes the coupling deliberate rather than accidental.
- The API client mixes Serenity's `CallAnApi`/`Send` (for the in-scenario
  Task) with plain `fetch` (for hook-time calls) - a pragmatic split, since
  hooks run outside an actor context; noted, not flagged.

## Code-Agnostic Tests

- Scenarios are expressed in business language and money as bare numbers
  ([features/_manifest.md](../../features/_manifest.md), shared-step table),
  independent of implementation language.
- The fixture modules mean the *system under test* carries repo-owned PHP;
  the tests themselves never depend on PHP specifics, only on the module's
  storefront-visible behaviour (a decline message containing "declined").
- N/A beyond this - single-language (TypeScript) suite by design.

## Single Source of Truth

- `docs/backlog.md` is the declared and de-facto status source; the one
  violation found is the README Status line
  ([Risk 2](02_RISKS_AND_ISSUES.md#risk-2)).
- Image-tag truth is properly single-sourced: `docker-compose.ci.yml` is the
  only place the baked tag (`:2.4.8-b24`) appears; both CI jobs resolve it via
  `docker compose config --images` (R-06b/R-06c) rather than duplicating it.
- Scenario-count truth is slightly scattered (README, qa-strategy,
  architecture.md all state 12/94 - currently consistent, verified) - a future
  drift surface once Items #13/#14 change the numbers.

## API Contract Compliance

- The suite consumes Magento's documented REST V1 surface (admin token,
  products search, guest-carts) with correct verbs and encoding
  ([MagentoApiClient.ts](../../src/api/MagentoApiClient.ts)).
- The `Portfolio_CartSeed` adopt endpoint knowingly violates REST (GET with a
  side effect) and documents why in the file header plus ADR-0006 - a
  defensible, gated test-fixture exception.
- No OpenAPI document is shipped; none is warranted for a consumer of
  Magento's own published API.

## Screenplay Parity

- N/A across projects (single repo); internally, all 10 Tasks follow the same
  `Task.where('#actor ...', ...)` shape, all 4 Questions the same
  `Text.of(...).describedAs(...)` shape - parity within the repo is complete.

## Batch File Design

- N/A - the repo ships no batch/PowerShell scripts; automation lives in npm
  scripts and the two GitHub workflows, which are consistent with each other
  (same GHCR derivation step, same compose invocation).

## Documentation Alignment

- README, ADRs, qa-strategy, architecture, runbook, backlog, CHANGELOG and the
  planning register were cross-checked. Aligned on: scenario counts, tag
  policy, screenshots gating (ADR-0007 = README env table =
  `src/config/screenshots.ts` behaviour), decline-module story, report
  pipeline quirks.
- Misaligned: README Status vs backlog ([Risk 2](02_RISKS_AND_ISSUES.md#risk-2));
  one stale comment path after the PR #33 proposals move
  ([Risk 6](02_RISKS_AND_ISSUES.md#risk-6)).
- The open PR #34 (`docs/backlog-verify-20260622`) adds a dated verification
  note to the backlog header - docs-only, consistent with what this review
  found on `main`.

## Logging Alignment

- Console output policy is coherent and hard-won: Serenity's ConsoleReporter
  owns the narrative, Cucumber's stdout formatter slot is reserved for the
  Serenity adapter ([cucumber.js](../../cucumber.js) lines 10-18), and the one
  diagnostic log (`console.warn` R-08 soft signal) deliberately writes to
  stderr to protect that slot
  ([cart.steps.ts](../../src/step-definitions/cart.steps.ts) lines 537-543).
- CI logs are structured for triage: named steps for pulls/warm-up, `::error`
  and `::warning` annotations with remediation text in preflight and guards.

## Test Coverage Metrics

- 12 scenarios / 94 steps active; 0 quarantined; smoke subset = 7 read-only
  scenarios (verified by dry-run). Quantities in
  [ANNEX/METRICS.md](ANNEX/METRICS.md).
- Coverage is journey-scoped by design (one checkout journey, its sad paths,
  and cart management) - breadth is a non-goal recorded in the README.
- No unit-test layer exists; see the Test Pyramid discussion in
  [06_ARCHITECTURE_ASSESSMENT.md](06_ARCHITECTURE_ASSESSMENT.md).

---

[<- Previous: Project Reviews](03_PROJECT_REVIEWS/PROJECT_001_Checkout_Automation_Suite.md) | [Back to Index](00_CODE_REVIEW_CLAUDE_Fable_5_v1_20260706T1048Z.md) | [Next: Recommendations ->](05_RECOMMENDATIONS.md)
