# Annex - Metrics

[<- Back to Index](../00_CODE_REVIEW_CLAUDE_Opus_4_8_v1_20260616T1544Z.md)

**Reviewer:** AI assistant (CLAUDE_Opus_4_8)

Counts gathered directly from the repository at commit `b6e2891` on 2026-06-16. Where a figure comes
from a command, the command is named so it is reproducible. Figures attributed to docs (rather than
measured) are labelled as such.

## Suite size (measured)

| Metric | Value | Source |
|---|---|---|
| Feature files | 4 | `ls features/*.feature` |
| Scenarios - default profile | 12 | `npx cucumber-js --profile default --dry-run` |
| Scenarios - smoke profile | 8 | `npx cucumber-js --profile smoke --dry-run` (see C-01: docs say 7) |
| Steps (total, default suite) | 94 | docs claim ([README.md](../../../README.md), [docs/qa-strategy.md](../../../docs/qa-strategy.md)); not independently counted in dry-run |
| TypeScript source files | 24 | `find src -name '*.ts'` |
| Tasks | 10 | `ls src/tasks/*.ts` |
| Questions | 4 | `ls src/questions/*.ts` |
| Interactions (locator holders) | 3 | `ls src/interactions/*.ts` |
| Step-definition files | 4 | `ls src/step-definitions/*.ts` |
| ADRs | 6 | `ls docs/adr/0*.md` |
| In-repo PHP fixture files | 5 | `find app -name '*.php'` (2 modules: DeclinePayment, CartSeed) |

## Scenario distribution (from dry-run + feature inspection)

| Feature | Scenarios | In smoke? | Notes |
|---|---|---|---|
| guest-checkout.feature | 5 (2 + outline x3) | 1 only | happy path + outline are `@placesOrder` |
| cart-management.feature | 4 | 4 | add/add-multiple/update/remove |
| checkout-validation.feature | 2 | 2 | missing details, invalid email |
| payment-failure.feature | 1 | 1 | included in smoke but needs the decline module (C-01) |
| **Total** | **12** | **8** | smoke = `not @deferred and not @placesOrder` |

## Validation gates run for this review

| Gate | Command | Result |
|---|---|---|
| TypeScript typecheck | `npx tsc --noEmit` | PASS (exit 0) |
| Cucumber bind - default | `npx cucumber-js --profile default --dry-run` | PASS - 12 scenarios, 0 undefined/ambiguous |
| Cucumber bind - smoke | `npx cucumber-js --profile smoke --dry-run` | PASS - 8 scenarios, 0 undefined/ambiguous |
| Full E2E suite (store run) | `npm test` | NOT RUN - requires the heavyweight Docker store; out of scope for this review |

Per the project layout contract, this repo has no root `verify` script, so the gates resolve to the
TypeScript and cucumber-js dry-run stack defaults. The Docker/E2E store was deliberately not started.

## Dependency pins (from package.json)

| Package | Pinned version |
|---|---|
| `@serenity-js/*` (8 packages) | 3.43.2 (exact) |
| `@cucumber/cucumber` | 11.3.0 (exact) |
| `@playwright/test`, `playwright` | 1.60.0 (exact) |
| `typescript`, `ts-node`, `@types/node` | caret ranges (dev tooling) |

## Prior review reconciliation

| Prior finding | Status confirmed in this pass |
|---|---|
| R-01 docs drift | Closed; only narrow residual drift remains (C-01, C-02) |
| R-02 fresh-clone runnability | Closed; `BASE_URL` defaults to localhost, pull-based path documented |
| R-03 API cart seeding | Closed; `Portfolio_CartSeed` + `AdoptSeededCart` implement it |
| R-04 dependency pins/phantom dep | Closed; exact pins, `playwright` declared explicitly |
| R-05 decline selector/command | Selector scoped to `#checkout .message-error`; command retained (C-04) |
| R-06a/b/c CI supply chain | Closed; both images preflighted, unique tags, derived owner |
| R-07 dead code | Closed; tree is tight |
| R-08 cart steps | Closed; steps merged, soft signal via stderr |
| R-09 credentials | Closed; localhost-gated fallback in code |
| R-10 report path | Closed; documented, plus empty-report CI guard |

---

[<- Back to Index](../00_CODE_REVIEW_CLAUDE_Opus_4_8_v1_20260616T1544Z.md)
