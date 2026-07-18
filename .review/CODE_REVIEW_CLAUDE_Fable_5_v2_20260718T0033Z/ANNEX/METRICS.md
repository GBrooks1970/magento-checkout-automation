# Annex: Metrics and Validation Evidence

[<- Back to Index](../00_CODE_REVIEW_CLAUDE_Fable_5_v2_20260718T0033Z.md)

**Reviewer:** AI assistant (CLAUDE Fable 5)
**Date:** 2026-07-18T00:33Z

## Repository state at review time

- Branch: `main` @ `167be92` (Merge pull request #37), clean working tree, in sync with
  `origin/main` after `git fetch`.
- 121 tracked files; suite source: 4 feature files, 4 step-definition modules, 10 tasks,
  3 interaction modules, 5 questions, 1 API client, 1 hooks module, 2 config modules.
- In-repo Magento fixture modules: `Portfolio_DeclinePayment` (11 files),
  `Portfolio_CartSeed` (6 files).

## Validation commands run (this review, 2026-07-18 UTC)

| Command | Result |
|---|---|
| `npx tsc --noEmit` | PASS (exit 0, no diagnostics) |
| `npm audit` | PASS - "found 0 vulnerabilities" |
| `npx cucumber-js --profile default --dry-run` | PASS - 12 scenarios, all steps bound |
| `npx cucumber-js --profile smoke --dry-run` | PASS - 7 scenarios, all steps bound |

Not run (deliberately): the full E2E suite and any `docker compose` bring-up - the prompt
forbids starting heavyweight infrastructure unasked, and the registry coupling/state of this
machine was not verified for a ~6 GB Magento stack. Live-suite evidence is therefore CI's:
PR #37's run (`29579215648`, 2026-07-17 per [docs/backlog.md](docs/backlog.md) (lines 722-732))
with the Chromium leg green and the MAG-C09 guard reporting the expected count. The registry gate
`npm run verify` could not be run because the script does not exist ([Risk 4](../02_RISKS_AND_ISSUES.md)).

## Scenario arithmetic (verified)

- Raw Gherkin: 9 Scenarios + 1 Scenario Outline (3 example rows) = 12 runtime scenarios.
- Default profile (`not @deferred`): 12 (dry-run confirmed).
- Smoke profile (`not @deferred and not @placesOrder and not @usesDeclineModule`):
  12 - 4 (`@placesOrder`: happy path + 3 outline rows) - 1 (`@usesDeclineModule`) = 7
  (dry-run confirmed).
- Serenity JSON documents expected: 9 + 1 (outline aggregated into a single report) = 10,
  matching `SERENITY_EXPECTED_SCENARIOS` in [.github/workflows/ci.yml](.github/workflows/ci.yml)
  (line 52).

## Wait-strategy census

- 25 `Wait.upTo(...)` occurrences across tasks and step definitions; 0 bare `Wait.until`
  (5s-default) calls remain; 0 hard sleeps. Ceilings range 10-20s; Cucumber step ceiling 60s
  ([src/hooks/browser.hooks.ts](src/hooks/browser.hooks.ts) (line 82)).

## Dependency snapshot

- All `@serenity-js/*` at 3.43.2; `@cucumber/cucumber` 12.9.0 (major bump MAG-C11, peer-range
  compatible); Playwright 1.60.0; TypeScript ^5.3; Node floor `>=20` (matches CI's Node 20).
- Licence: MIT ([LICENSE](LICENSE), [package.json](package.json) (line 5)).
- No secrets in the tree; `auth.json` and `.env` gitignored; baked admin credentials are
  test-target-only and refused for non-localhost targets by
  [src/api/MagentoApiClient.ts](src/api/MagentoApiClient.ts) (lines 76-83).

---

[Back to Index](../00_CODE_REVIEW_CLAUDE_Fable_5_v2_20260718T0033Z.md)
