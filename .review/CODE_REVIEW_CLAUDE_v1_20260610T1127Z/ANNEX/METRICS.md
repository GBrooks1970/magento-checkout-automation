# Annex: Metrics and Evidence

[<- Back to Index](../00_CODE_REVIEW_CLAUDE_v1_20260610T1127Z.md)

**Reviewer:** AI assistant (CLAUDE Fable 5)

Quantitative inventory and the evidence base for claims made in this review. All counts taken at HEAD `d50bb8a` (2026-06-10).

## Validation Commands Run for This Review

| Command | Result |
|---|---|
| `npx tsc --noEmit` | PASS (exit 0) |
| `npx cucumber-js --profile default --dry-run` | PASS - 12 scenarios, 94 steps, 0 undefined, 0 ambiguous |
| `git status --porcelain` | Clean working tree (before review artifacts) |
| `git log --oneline` / `gh pr list --state all` | HEAD `d50bb8a`; 6 PRs, all MERGED; 0 open |

Not run: full E2E suite (no local Magento stack started), bake/CI workflows, the PHP module (no Magento runtime). CI-green claims (runs `27141209665`, `27232441089`) are cited from [backlog.md](../../docs/backlog.md) and session notes, not independently re-executed.

## Suite Inventory

| Artifact | Count | Notes |
|---|---|---|
| Feature files | 4 | All active; `@deferred` retired |
| Scenarios | 12 | Incl. 3 outline rows; 2 tagged `@placesOrder` |
| Steps (bound) | 94 | Dry-run verified |
| Step definitions | ~20 | 1 unused (`I complete checkout with valid details`) |
| Tasks | 10 | 1 unused (`CompleteCheckout`) |
| Questions | 6 | 2 unused (`OrderConfirmation`, `ValidationMessage`) |
| PageElement modules | 3 | ~30 elements; ~5 unused |
| Hooks | 1 module | `BeforeAll`/`Before`/`AfterAll` |
| API endpoints used | 2 | admin token mint; product search |
| Cucumber profiles | 2 | `default`, `smoke` |

## Infrastructure Inventory

| Artifact | Count / Value |
|---|---|
| Compose services | 6 (nginx, phpfpm, mariadb, valkey, opensearch, rabbitmq), all healthchecked |
| Workflows | 2 (`bake.yml` 268 lines; `ci.yml` 213 lines) |
| GHCR images | 2 (`magento-store-app:2.4.8`, `magento-store-db:2.4.8`), public |
| Bake guards | 2 (product count >= 2000; dump > 1 MB) |
| CI secrets required by e2e | 0 |
| Recorded CI duration | ~15-25 min (vs ~40 min from-scratch) |
| Magento module files | 16 (PHP 3, XML 8, JS 2, layout 1, registration 1, plus dir metadata) |

## Documentation Inventory and Currency

| Document | Last self-declared update | Currency vs backlog |
|---|---|---|
| docs/backlog.md | 2026-06-09 (item #2 closure) | CURRENT - source of truth |
| CHANGELOG.md | Unreleased section current to ~#11/#3 | Mostly current; no #2/#4-final entries |
| docs/adr/0005 | 2026-06-08 | Current |
| docs/adr/0001-0004 | 0002/0003 updated post-fix | Current except version pins (R-04) |
| README.md | Status section pre-#2 | STALE (R-01, R-02) |
| docs/architecture.md | v1, 2026-06-02 | STALE (R-01) |
| docs/qa-strategy.md | v1, 2026-06-02 | STALE (R-01) |
| docs/screenplay-guide.md | v1, 2026-06-02 | STALE + teaches defective pattern (R-01) |
| features/_manifest.md | v1, 2026-06-01 | STALE (R-01) |
| docs/adr/README.md | pre-0005 | STALE - missing index row (R-01) |
| docs/docker-magento-setup.md | CI section current | Partially stale ("Still open"; no module step) (R-01, R-02) |
| docs/gherkin-style-guide.md | post-#6 | One paragraph contradicts current outline (R-07) |
| docs/admin-api-token-guide.md | 2026-06-06 | Current |

## Finding Severity Distribution

| Severity | Count | IDs |
|---|---|---|
| HIGH | 2 | R-01, R-02 |
| MEDIUM | 4 | R-03, R-04, R-05, R-06 |
| LOW | 4 | R-07, R-08, R-09, R-10 |

No finding challenges the correctness of the green CI state; the HIGH findings concern documentation truthfulness and local reproducibility, consistent with the repo's strengths being code-side.

---

[Back to Index](../00_CODE_REVIEW_CLAUDE_v1_20260610T1127Z.md)
