# Cross-Project Analysis (cross-cutting within the repository)

[<- Back to Index](00_CODE_REVIEW_CLAUDE_Opus_4_8_v1_20260616T1544Z.md) | [Next: Recommendations ->](05_RECOMMENDATIONS.md)

**Reviewer:** AI assistant (CLAUDE_Opus_4_8)

This is a single-project repository, so per the template's single-repository customisation the nine
cross-project axes are reinterpreted as cross-cutting concerns *within* this repo: suite vs CI vs
Docker/infrastructure vs documentation vs the in-repo PHP fixture modules.

## Tool-Agnostic Tests

- The specifications are plain Gherkin in [features/](../../features/), independent of any runner, so
  the behaviour could in principle be re-bound under another BDD tool.
- The implementation, however, is firmly Serenity/JS + Cucumber-js (`@serenity-js/cucumber` adapter,
  Cucumber profiles, Serenity `Wait`/`Ensure`), so the *step layer* is not tool-agnostic - expected
  and appropriate for a Screenplay showcase.
- N/A beyond this: the project deliberately demonstrates one toolchain well rather than portability
  across runners.

## Code-Agnostic Tests

- The Gherkin is language-neutral and declarative (money as bare numbers, subtotal not grand-total to
  avoid tax/shipping config coupling - [features/_manifest.md](../../features/_manifest.md) lines 49-50).
- The suite is bound to the Magento storefront DOM and REST contract, not to a programming language,
  so it is implementation-language-agnostic with respect to the system under test.
- The in-repo fixtures are PHP because the SUT is Magento (PHP) - a necessary coupling, not a leak.

## Single Source of Truth

- [docs/backlog.md](../../docs/backlog.md) is the declared source of truth and is treated as such by the prompts
  and the prior review; the feature inventory is mirrored consistently in
  [docs/qa-strategy.md](../../docs/qa-strategy.md) and [features/_manifest.md](../../features/_manifest.md) at 12/94.
- One drift: the backlog's own header/Summary metadata lags its body (C-02), and the smoke-count
  appears in two docs but disagrees with the runtime (C-01).
- Test data (product names, prices, the shipping address) is centralised in
  [src/tasks/ProvideShippingDetails.ts](../../src/tasks/ProvideShippingDetails.ts) defaults and the feature files - no
  duplication observed across step layers.

## API Contract Compliance

- The REST usage follows Magento's documented V1 contract: `searchCriteria` filter groups for product
  search, `POST /guest-carts` and `/guest-carts/{id}/items` for seeding, and the admin token endpoint
  ([src/api/MagentoApiClient.ts](../../src/api/MagentoApiClient.ts) lines 88-201).
- Responses are asserted structurally (status 200, `total_count > 0`, matched name and price) rather
  than blindly trusted - good API-test hygiene ([MagentoApiClient.ts](../../src/api/MagentoApiClient.ts) lines 196-200).
- No formal OpenAPI document is shipped (the suite consumes Magento's API, it does not define one), so
  OpenAPI conformance is N/A here - reasonable for a consumer.

## Screenplay Parity

- There is one Screenplay implementation (TypeScript/Serenity-JS), so cross-implementation parity is
  N/A. Internal consistency is high: every Task uses the same `Task.where('#actor ...', ...)` shape and
  the same `Wait.upTo(...).until(...)` idiom for async surfaces.
- Questions are uniformly `Text.of(element).describedAs(...)`; abilities are granted uniformly per
  scenario. No divergent patterns were found.

## Batch File / Infrastructure Design

- No `.bat`/PowerShell batch scripts ship in this repo (unlike the sibling sudoku POC), so the literal
  axis is N/A. Reinterpreted as infrastructure design, the two compose files and two workflows are the
  relevant artefacts.
- The base/overlay compose split is clean (overlay overrides exactly two image refs), and the bake/CI
  workflows share a single source of truth for image tags via `docker compose config --images`
  ([docker-compose.ci.yml](../../docker-compose.ci.yml), [.github/workflows/ci.yml](../../.github/workflows/ci.yml) lines 86-107).
- One residual: the `app`->`phpfpm` dependency uses `service_started` against a healthcheck-less
  service (C-03).

## Documentation Alignment

- Broadly aligned across README, ADRs, QA strategy, manifest, runbook, and backlog at the headline
  figures (12/94, all items closed, payment-failure active).
- Two narrow misalignments: smoke-subset count/rationale (C-01) and backlog metadata (C-02). The prior
  round's recommended "re-grep docs on every backlog flip" norm would have caught the smoke count.

## Logging Alignment

- Runtime logging is restrained and correct: the only deliberate stdout-adjacent output is the R-08
  soft signal, which uses `console.warn` (stderr) precisely so it cannot contaminate Cucumber's single
  stdout formatter slot ([src/step-definitions/cart.steps.ts](../../src/step-definitions/cart.steps.ts) lines 24-48).
- CI logs are informative: named pull/warm-up steps, explicit HTTP-code echoes, and `::error::`
  annotations on guard failures.
- Serenity's ConsoleReporter provides the per-scenario narrative, replacing progress dots - consistent
  with the single-formatter constraint.

## Test Coverage Metrics

- 12 scenarios / 94 steps (per README/QA strategy, corroborated by a 12-scenario default dry-run); 8
  scenarios in the smoke subset (dry-run verified; see C-01 for the doc mismatch).
- Coverage is intentionally E2E-only (no unit/integration tier) - a conscious scope choice for a UI
  journey showcase, discussed in [06_ARCHITECTURE_ASSESSMENT.md](06_ARCHITECTURE_ASSESSMENT.md).
- Sad-path coverage (validation x2, decline x1) is present, which is a credibility strength for a
  checkout demo. See [ANNEX/METRICS.md](ANNEX/METRICS.md) for the full counts.

---

[<- Previous: Project Reviews](03_PROJECT_REVIEWS/PROJECT_001_Checkout_Automation_Suite.md) | [Back to Index](00_CODE_REVIEW_CLAUDE_Opus_4_8_v1_20260616T1544Z.md) | [Next: Recommendations ->](05_RECOMMENDATIONS.md)
