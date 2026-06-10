# Cross-Project Analysis

[<- Back to Index](00_CODE_REVIEW_CLAUDE_v1_20260610T1127Z.md) | [Next: Recommendations ->](05_RECOMMENDATIONS.md)

**Reviewer:** AI assistant (CLAUDE Fable 5)

Nine cross-cutting analyses spanning the test suite, the Magento module, and the infrastructure.

## Tool-Agnostic Tests

- The Gherkin layer is fully tool-agnostic: no feature file references Serenity, Playwright, selectors, or timing. The 12 scenarios could be re-bound to any BDD runner without edit.
- The step-definition layer is the deliberate seam: ~150 lines of glue is all that couples Gherkin to Serenity/JS. Re-platforming (e.g. to Behave + Playwright/Python) would rewrite `src/` but not `features/`.
- Tool coupling concentrates correctly in `interactions/` (Serenity `PageElement`) and `tasks/` (Serenity `Task.where`); the in-line lessons (occlusion-aware visibility, wait ceilings) are framework-specific knowledge that would need re-validation on another stack - they are documented well enough to carry over as requirements.
- The Serenity-specific `Wait.upTo` ceilings encode target-environment knowledge (cold-store render times) rather than tool quirks; a migration should preserve the durations, not just the calls.

## Code-Agnostic Tests

- Test *intent* is language-independent: scenario text plus the manifest's shared-step vocabulary ([features/_manifest.md](features/_manifest.md) (lines 38-50)) define the contract a re-implementation must honour.
- Test *data* is partially externalised: product names/prices live in the Gherkin; shipping defaults live in TypeScript ([ProvideShippingDetails.ts](src/tasks/ProvideShippingDetails.ts) (lines 21-31)) and the product-name-to-slug map in [StorefrontPage.ts](src/interactions/StorefrontPage.ts) (lines 4-7) - acceptable at this scale, but both would need extraction for true code-agnosticism.
- The Magento module is necessarily PHP; its *behavioural contract* (method code `declinepayment` declines every order with a message containing "declined") is what the suite depends on, and that contract is stated in ADR-0005 rather than any shared schema.
- The decline-message string is duplicated across PHP (module) and implicitly in TypeScript (`includes('declined')`) with no single definition - the one place the language boundary leaks (finding R-05).

## Single Source of Truth

- [backlog.md](docs/backlog.md) is the declared and de-facto source of truth for project state, and it is accurate and current - the model works.
- The failure is propagation: at least seven satellite documents contradict it (finding R-01). The repo has a truth source but no synchronisation habit.
- Feature-file truth is clean: scenarios exist exactly once; shared step phrasing is centrally listed in the manifest; profiles in [cucumber.js](cucumber.js) are the single definition of suite membership.
- Environment truth is mostly single-sourced (`BASE_URL` flows from one config export), but the GHCR image path is repeated across three files and the admin credentials across four (findings R-06, R-09).

## API Contract Compliance

- REST usage is correct and modern Magento: token minting via `POST /rest/V1/integration/admin/token`, catalogue search via `GET /rest/V1/products` with camelCase `searchCriteria[filterGroups]` keys and `conditionType=eq` ([MagentoApiClient.ts](src/api/MagentoApiClient.ts) (lines 93-110)); the response-shape assumptions are documented with a captured example in ADR-0003 (lines 74-88).
- Assertions check the right contract properties: HTTP status, `total_count > 0` (with the comment explaining that a no-match search is still 200), exact name, and price.
- No OpenAPI spec is consumed or generated; for two endpoints this is proportionate (YAGNI), but pinning the used subset (even as a short markdown contract table in ADR-0003) would guard against silent Magento API drift across version bumps.
- The 2FA-blocks-token-issuance constraint is documented in three coordinated places (client error message, runbook step 6c, [admin-api-token-guide.md](docs/admin-api-token-guide.md)) - good contract-failure ergonomics.

## Screenplay Parity

- Within the suite, Screenplay usage is highly consistent: every Task is a factory object returning `Task.where(...)`; every Question wraps `Text.of(...)`; every selector is a described `PageElement`. No stray Page-Object-isms or raw Playwright calls leak into steps or tasks.
- Parity breaks between code and docs: [screenplay-guide.md](docs/screenplay-guide.md) describes a different (older, partly defective) implementation - wrong lifecycle, stub abilities, a non-existent Question (finding R-01).
- Two Questions and one composite Task exist outside the used pattern surface (finding R-07); pruning restores 1:1 parity between the documented pattern inventory and live code.
- The `#actor` description token, `describedAs(...)` labels, and en-GB business phrasing are uniform - the living documentation output reads coherently as a result.

## Batch File Design

- The repo contains no batch/shell script files; orchestration lives in npm scripts ([package.json](package.json) (lines 8-12): `test`, `test:smoke`, `test:report`) and workflow YAML run-blocks - a reasonable choice that avoids platform-specific script drift on a Windows-authored, Linux-CI project.
- The npm scripts are minimal and aligned with the documented profiles; no drift between README commands and script definitions.
- Multi-line shell embedded in workflows is well-commented and uses guards (`set -o pipefail`, size/count assertions) where failure-masking is a risk - above-average shell hygiene for YAML-embedded scripts.
- Gap: the local bring-up sequence exists only as copy-paste blocks in [docker-magento-setup.md](docs/docker-magento-setup.md); a `scripts/install-store.sh` (mirroring bake.yml's steps, including the decline module) would remove the runbook/CI drift that produced finding R-02.

## Documentation Alignment

- Alignment with [backlog.md](docs/backlog.md): the backlog itself is exemplary - statuses, evidence (run IDs, commit hashes), and spec decisions are recorded per item. CHANGELOG entries match the git history sampled for this review.
- Misalignment is the repo's largest defect class: README Status, architecture.md, qa-strategy.md, screenplay-guide.md, features/_manifest.md, adr/README.md, gherkin-style-guide.md (composite-step paragraph), and docker-magento-setup.md ("Still open") all describe superseded states - full inventory in finding R-01.
- ADRs 0002/0003/0005 were updated as the system evolved (0002's corrected hook pattern, 0003's implemented status, 0005's as-built section) - proof the team can keep records current when the record is in the change path; the static guides simply were not in any change path.
- Cross-references are dense and mostly valid (backlog item numbers, ADR pointers, implementation-log citations in code comments) - the linking discipline is there; only freshness is missing.

## Logging Alignment

- Test-run observability is delegated wholesale to Serenity: `ConsoleReporter` for live output, `ArtifactArchiver` JSON for the living documentation - consistent, zero ad-hoc `console.log` in the suite (verified by reading all `src/` files).
- Failure messages are deliberately diagnostic: described elements ("Place Order button"), API errors that name the likely cause and the fix document ([MagentoApiClient.ts](src/api/MagentoApiClient.ts) (lines 60-67)).
- CI logs are designed for the reader: named steps, echoed evidence values (product count, dump size, warm-up codes) before assertions - the bake log doubles as an audit record.
- The PHP module logs nothing (it throws), which is correct for its role; there is no aggregated run-history/flake-trend tracking beyond what Pages publishes per run - acceptable at this scale, noted as a future idea.

## Test Coverage Metrics

- Quantitative inventory: 12 scenarios / 94 steps across 4 features, all active (0 deferred, 0 quarantined); 10 Tasks, 6 Questions (4 in use), 3 PageElement modules (~30 elements, ~5 unused), 4 step-definition modules (~20 step bindings, 1 unused). Dry-run verified 0 undefined / 0 ambiguous steps.
- Journey coverage: guest browse -> cart CRUD -> full checkout -> confirmation, plus two negative validation paths and one payment-decline path. The money assertions cover unit price, multi-item subtotal, quantity-scaled subtotal (3 data rows), and post-decline cart integrity.
- Out of scope (deliberate, mostly documented): registered customers, tax/shipping totals, currency formatting, admin flows, mobile viewports, accessibility, performance. Layer coverage is E2E-only - no unit/integration tier exists (see Architecture Assessment, Test Pyramid).
- CI evidence: full suite green on `main` (badge; backlog-recorded runs 27141209665 at 11/11 pre-#2 and 27232441089 at 12/12). Local re-execution was not performed for this review.

---

[<- Previous: PROJECT 003](03_PROJECT_REVIEWS/PROJECT_003_Docker_CI_Infrastructure.md) | [Back to Index](00_CODE_REVIEW_CLAUDE_v1_20260610T1127Z.md) | [Next: Recommendations ->](05_RECOMMENDATIONS.md)
