# Cross-Cutting Analysis (within the repository)

[<- Back to Index](00_CODE_REVIEW_CLAUDE_Fable_5_v2_20260718T0033Z.md) | [Next: Recommendations ->](05_RECOMMENDATIONS.md)

**Reviewer:** AI assistant (CLAUDE Fable 5)
**Date:** 2026-07-18T00:33Z

Single-repository review: per the template's customisation note, this section analyses the
cross-cutting seams *within* the repo - test suite vs CI vs Docker infrastructure vs the in-repo
Magento fixture modules vs documentation.

## Tool-Agnostic Tests

- The Gherkin layer is fully tool-agnostic - no step text names Playwright, Serenity, or even
  the browser; the same features could drive another Screenplay stack unchanged.
- Step definitions bind to Serenity/JS idioms but stay thin (one `attemptsTo` per step in almost
  every case), so the coupling is localised to `src/`.
- The engine dimension is now parameterised (`BROWSER` env var, three-engine CI matrix), which is
  the practical form of tool-agnosticism for a Playwright suite - though only Chromium currently
  passes reliably ([Risk 3](02_RISKS_AND_ISSUES.md)).

## Code-Agnostic Tests

- N/A as a multi-language concern - single TypeScript implementation by design. The features
  themselves are implementation-language-neutral, which is what the pattern requires here.

## Single Source of Truth

- Strong on the infrastructure side: `docker-compose.ci.yml` is the declared single source for
  the baked image tag (R-06b), and `ci.yml` resolves image references from it via
  `docker compose config --images` rather than duplicating them
  ([.github/workflows/ci.yml](.github/workflows/ci.yml) (lines 100-124, 177-188)); the expected
  scenario count is defined once as `SERENITY_EXPECTED_SCENARIOS` (line 52).
- Weak this week on the documentation side: the backlog is the declared source of truth yet
  currently self-contradicts about #13/#14, with README/CHANGELOG/registry lagging further
  ([Risk 1](02_RISKS_AND_ISSUES.md)) - the repo's one active violation of its own principle.
- Product test data ("Push It Messenger Bag", 45.00) is asserted against the store via the API
  Background on every scenario, making the store-vs-spec agreement continuously verified.

## API Contract Compliance

- REST usage follows Magento's published V1 surface correctly: token endpoint, `products` with
  `searchCriteria` filter groups, anonymous `guest-carts` + items
  ([src/api/MagentoApiClient.ts](src/api/MagentoApiClient.ts) (lines 88-175)); responses are
  status-checked and error paths carry actionable messages (2FA hint on token failure).
- No OpenAPI document is shipped, and none is needed - the suite consumes Magento's contract, it
  does not define one. The one in-repo API surface (`/cartseed/cart/adopt`) is documented in
  ADR-0006 and its controller source.

## Screenplay Parity

- N/A across projects (single implementation), but internal parity is good: all Tasks follow the
  same `Task.where('#actor ...', ...)` shape, Questions are uniformly `describedAs`-labelled,
  and waits use the same `Wait.upTo(...).until(...)` idiom everywhere (25 occurrences, no bare
  5s-default `Wait.until` remains - see [ANNEX/METRICS.md](ANNEX/METRICS.md)).

## Batch File Design

- N/A - no batch/PowerShell scripts; automation entry points are npm scripts and the two GitHub
  workflows, which is appropriate for this stack.

## Documentation Alignment

- Deep documentation (ADRs, runbook, guides, backlog item bodies) is aligned with the code and
  frequently cites commits and CI run numbers.
- Summary documentation (backlog header/Status/Summary, README Status, CHANGELOG, registry row)
  is misaligned as of `167be92` - detailed in [Risk 1](02_RISKS_AND_ISSUES.md); this is the
  repo's recurring alignment failure mode, and it recurred inside the PR that did the work.
- The README's two "deliberate quirks" paragraphs (report path two-stage, publish-on-failure)
  are a good pattern - pre-empting reviewer misreadings - but the publish-on-failure description
  now understates the empty-shell edge ([Risk 2](02_RISKS_AND_ISSUES.md)).

## Logging Alignment

- Console output is intentionally single-sourced: the Serenity adapter owns Cucumber's one
  stdout-formatter slot and `ConsoleReporter` provides the narrative
  ([cucumber.js](cucumber.js) (lines 10-21), [src/serenity.config.ts](src/serenity.config.ts)
  (lines 20-27)) - the encoded lesson of the empty-report incident.
- CI logs are deliberately narrated: named steps for pulls and warm-up, `::error`/`::warning`
  annotations with remediation text in preflight and the guard. Consistent and exemplary.

## Test Coverage Metrics

- 12 runtime scenarios / 94 steps (default profile), 7/43 read-only (smoke); 10 Serenity JSON
  documents expected (outline aggregation, documented at
  [.github/workflows/ci.yml](.github/workflows/ci.yml) (lines 35-49)).
- Feature spread: 3 guest-checkout (incl. 3-row outline), 4 cart-management, 2 validation
  (negative), 1 payment-failure (negative). Counts re-verified by dry-run this review.
- No unit/integration tier and no code-coverage tooling - defensible for a UI-E2E portfolio
  piece (see [06_ARCHITECTURE_ASSESSMENT.md](06_ARCHITECTURE_ASSESSMENT.md)).

---

[<- Previous: Project Reviews](03_PROJECT_REVIEWS/PROJECT_001_Checkout_Automation_Suite.md) | [Back to Index](00_CODE_REVIEW_CLAUDE_Fable_5_v2_20260718T0033Z.md) | [Next: Recommendations ->](05_RECOMMENDATIONS.md)
