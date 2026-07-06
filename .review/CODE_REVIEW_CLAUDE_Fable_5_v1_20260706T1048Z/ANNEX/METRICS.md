# Annex: Metrics and Validation Evidence

[<- Back to Index](../00_CODE_REVIEW_CLAUDE_Fable_5_v1_20260706T1048Z.md)

**Reviewer:** AI assistant (CLAUDE Fable 5)
**Date:** 2026-07-06T10:48Z
**Repo state:** `main` @ `10f2c66` (Merge pull request #33); working tree clean.
**Toolchain:** Node v20.19.5, npm 10.8.2 (Windows host).

## Validation commands run for this review

Gates resolved per the portfolio layout contract: no
`docs/project-contract.md` exists, the registry row records no gates, and the
root `package.json` has no `verify` script - so stack defaults apply
(TypeScript check + cucumber-js dry-run, since `cucumber.js` exists).

| Command | Result |
|---|---|
| `npx tsc --noEmit` | PASS (clean, no output) |
| `npx cucumber-js --profile default --dry-run` | PASS - 12 scenarios bind, 0 undefined steps (4 cart management, 2 checkout validation, 5 guest checkout, 1 payment failure) |
| `npx cucumber-js --profile smoke --dry-run` | PASS - exactly 7 scenarios (4 cart management, 2 checkout validation, 1 guest checkout) |
| `npm audit` | 6 vulnerabilities: 1 high, 5 moderate (details below) |
| `gh run list --workflow ci.yml --branch main --limit 3` | 3 latest runs all `success` (27845450443, 27843935241, 27841615940) |
| `curl https://gbrooks1970.github.io/magento-checkout-automation/` | HTTP 200; page content contains "12 test" - report populated, not an empty shell |

**Not run (per review ground rules):** the full Docker store bring-up and the
live E2E suite. Suite-execution claims rest on the cited CI runs and the
published report content.

## Suite size

- Feature files: 4 active (`guest-checkout`, `cart-management`,
  `checkout-validation`, `payment-failure`), plus `_manifest.md`.
- Scenarios: 12 (dry-run-verified). Steps: 94 (static count, including
  Backgrounds expanded per scenario and the outline's 3 examples) - matches
  the README/qa-strategy claim of "12 scenarios, 94 steps".
- Smoke subset: 7 scenarios, tag expression
  `not @deferred and not @placesOrder and not @usesDeclineModule`
  ([cucumber.js](../../../cucumber.js) line 41).
- Source layers: 10 Tasks, 4 Questions, 3 interaction/page modules, 4
  step-definition files, 1 API client, 1 hooks file, 2 config modules.
- Fixture modules: `Portfolio_DeclinePayment` (7 config/XML files + observer +
  gateway command + 2 frontend JS files), `Portfolio_CartSeed` (controller + 4
  config/XML files).

## npm audit detail (2026-07-06)

```text
form-data  4.0.0 - 4.0.5
Severity: high
form-data: CRLF injection in form-data via unescaped multipart field names
and filenames - GHSA-hmw2-7cc7-3qxx
fix available via `npm audit fix`
node_modules/form-data

uuid  <11.1.1
Severity: moderate
uuid: Missing buffer bounds check in v3/v5/v6 when buf is provided -
GHSA-w5hq-g745-h8pq
fix available via `npm audit fix --force`
Will install @cucumber/cucumber@12.9.0, which is a breaking change
(reached via @cucumber/cucumber -> gherkin / gherkin-utils -> messages -> uuid)

6 vulnerabilities (5 moderate, 1 high)
```

Parent chains (`npm ls form-data uuid`):

```text
+-- @cucumber/cucumber@11.3.0
| +-- @cucumber/gherkin-utils@9.2.0 -> @cucumber/gherkin@31.0.0 -> @cucumber/messages@26.0.1 -> uuid@10.0.0
| +-- @cucumber/gherkin@30.0.4 -> @cucumber/messages@26.0.1 -> uuid@10.0.0
| `-- @cucumber/messages@27.2.0 -> uuid@11.0.5
`-- @serenity-js/rest@3.43.2 -> axios@1.16.0 -> form-data@4.0.5
```

## CI timing evidence (run 27845450443, main, 2026-06-19)

| Step | Duration |
|---|---|
| Install Node dependencies (`npm ci`, cached) | 3 s |
| Install Playwright browsers | 28 s |
| Pull pre-baked store images | 61 s |
| Start Magento store (`compose up --wait`) | 88 s |
| Warm up the store | 2 s |
| Run full test suite | 1 m 52 s |
| Generate Serenity living documentation | 7 s |
| Total (test job) | 5 m 28 s |

Note: total pipeline time (5m56s) is now well under the 15-25 min the ci.yml
header comment estimates - the estimate has aged conservatively (images and
runner network improved); harmless, but the comment could be refreshed when
next edited.

## Repository state notes

- Open PR at review time: #34 `docs(backlog): 2026-06-22 verification note
  (no status change)` - docs-only, pre-existing, not touched by this review.
- `.review/` history: CLAUDE v1 (2026-06-10), CLAUDE_Opus_4_8 v1 (2026-06-16);
  this review is the first by CLAUDE_Fable_5, hence v1.
- Licence check: no LICENSE file in `git ls-files`; no `license` field in
  `package.json`; GitHub API `license: null`.
- Secrets check: `auth.json` ignored ([.gitignore](../../../.gitignore) line
  30) and untracked; no tokens or real credentials in the tree (the
  `admin`/`Password123!` pair is the documented, disposable baked-store test
  credential, localhost-gated in code).

---

[<- Previous: Migration Plans](../07_MIGRATION_PLANS.md) | [Back to Index](../00_CODE_REVIEW_CLAUDE_Fable_5_v1_20260706T1048Z.md)
