# Risks and Issues

[<- Back to Index](00_CODE_REVIEW_CLAUDE_Fable_5_v1_20260706T1048Z.md) | [Next: Project Reviews ->](03_PROJECT_REVIEWS/PROJECT_001_Checkout_Automation_Suite.md)

**Reviewer:** AI assistant (CLAUDE Fable 5)
**Date:** 2026-07-06T10:48Z

Ranked high to low. All findings are evidence-backed against `main` commit
`10f2c66`. No HIGH-severity findings were identified; the top item is MEDIUM.

---

<a id="risk-1"></a>
## Risk 1 (MEDIUM): npm audit reports 6 vulnerabilities - 1 high fixable non-breaking, 5 moderate requiring a Cucumber major bump

**Risk description:**
`npm audit` (run 2026-07-06 on `main` with Node v20.19.5 / npm 10.8.2) reports
6 vulnerabilities in the dependency tree:

- **HIGH:** `form-data` 4.0.0 - 4.0.5 - CRLF injection via unescaped multipart
  field names (GHSA-hmw2-7cc7-3qxx). Resolution path:
  `@serenity-js/rest@3.43.2 -> axios@1.16.0 -> form-data@4.0.5`.
  npm states: "fix available via `npm audit fix`" - i.e. a non-breaking,
  semver-compatible bump.
- **MODERATE (x5):** `uuid` < 11.1.1 - missing buffer bounds check in v3/v5/v6
  when `buf` is provided (GHSA-w5hq-g745-h8pq), reached through
  `@cucumber/cucumber@11.3.0 -> @cucumber/gherkin / @cucumber/gherkin-utils ->
  @cucumber/messages -> uuid@10.0.0 / uuid@11.0.5`. npm's fix requires
  `@cucumber/cucumber@12.9.0` - a breaking (major) change.

**Evidence outline:**
- [package.json](../../package.json) (lines 14, 23): `"@cucumber/cucumber": "11.3.0"`,
  `"@serenity-js/rest": "3.43.2"` (all dependencies are `devDependencies`).
- Full `npm audit` output captured in [ANNEX/METRICS.md](ANNEX/METRICS.md).
- Parent chain confirmed with `npm ls form-data uuid` (also in the annex).

**Impact analysis:**
- All six sit in dev dependencies of a test suite; nothing here ships to a
  production runtime, and the vulnerable `form-data` path would require the
  suite to send attacker-controlled multipart field names, which it does not
  (the API client sends JSON). Practical exploitability is very low.
- The portfolio impact is real, though: a hiring manager (or Dependabot) running
  `npm audit` sees "1 high" on a repository whose backlog records a completed
  security-hardening finding (R-09) and whose sibling project treated exactly
  this class as its top-priority item (hand-baked HBSP-09). An unaddressed
  audit high undermines the "demonstrably non-flaky, demonstrably maintained"
  claim more than it threatens the code.

**Refactor recommendation and strategy:**
1. Run `npm audit fix` now - per npm this resolves the HIGH (`form-data`)
   within existing semver ranges. Commit the lockfile change, verify with the
   standard gates (`npx tsc --noEmit`, dry-run) and a CI run.
2. Schedule the `@cucumber/cucumber` 11 -> 12 major bump as a backlog item
   (analogous to Item #13/#14 in shape): review the v12 changelog for
   formatter/profile API changes - this project has non-trivial coupling to
   Cucumber's single-stdout-formatter behaviour
   ([cucumber.js](../../cucumber.js) lines 10-18) and the `@serenity-js/cucumber`
   adapter's supported range, so the bump must re-verify the Serenity JSON
   guard path in CI, not just compile.
3. Until then, record the accepted risk in the backlog so the audit state is a
   documented decision rather than an omission.

---

<a id="risk-2"></a>
## Risk 2 (MEDIUM): README "Status" contradicts the backlog - it claims all backlog items are closed while #13 and #14 are outstanding

**Risk description:**
The README's closing Status section asserts the project is complete and that
every backlog item is closed. The backlog - the project's declared source of
truth - says otherwise: version 4 (2026-06-19) promoted planning proposals 0002
and 0003 into the backlog as committed, outstanding Items #13 (trace + video
capture on failure) and #14 (cross-browser run matrix), both READY TO START.

**Evidence outline:**
- [README.md](../../README.md) (lines 174-187): "Complete. The full suite ...
  All backlog items are closed - `docs/backlog.md` records each with its
  evidence."
- [docs/backlog.md](../../docs/backlog.md) (lines 7-10): "two further planning
  proposals were promoted into the backlog as committed work - Item #13 ... and
  Item #14 ... - so the project is active again with two outstanding items."
- [docs/backlog.md](../../docs/backlog.md) (lines 585, 621): both items marked
  "READY TO START"; Summary table (line 673): "Outstanding: 2".
- Git history explains the drift: README.md was last touched by PR #31
  (`1c50f0c`, Item #12 screenshots), while the promotion of #13/#14 landed in
  the later PR #32 (`74b89ed`) without a README update.

**Impact analysis:**
- A reviewer who reads the README then the backlog finds the repo's two primary
  self-descriptions in direct contradiction - precisely the
  documentation-drift theme the 2026-06-16 portfolio review identified as the
  recurring cross-project weakness.
- The registry row for this project in the portfolio's prompt library already
  describes it as "Active (reopened 2026-06-19)", so the README is the odd one
  out.

**Refactor recommendation and strategy:**
- One-paragraph fix to README "Status": state that the delivered scope
  (Items #1-#12) is complete and green in CI, and that two enhancement items
  (#13 trace/video, #14 cross-browser) are open in `docs/backlog.md`.
- When Items #13/#14 close (or are demoted back to proposals), re-run the
  close-project verification pass, which checks every public-facing README
  claim - this exact class of claim is in its checklist.

---

<a id="risk-3"></a>
## Risk 3 (MEDIUM-LOW): No licence declared - LICENSE file and package.json licence field both absent

**Risk description:**
The repository declares no licence anywhere: there is no `LICENSE`/`LICENCE`
file at the root, [package.json](../../package.json) has no `license` field,
and the GitHub API reports `"license": null` for the public repo.

**Evidence outline:**
- `git ls-files` contains no licence file (full file list reviewed).
- [package.json](../../package.json) (lines 1-29): no `license` key.
- `gh api repos/GBrooks1970/magento-checkout-automation` returns
  `"license": null` (public repo).

**Impact analysis:**
- Legally, "no licence" means all rights reserved: a hiring manager's company
  cannot lawfully run or adapt the code, and the in-repo Magento fixture
  modules (`Portfolio_DeclinePayment`, `Portfolio_CartSeed`) - the most
  copy-worthy artefacts here - cannot be reused.
- For a portfolio repo whose entire purpose is to be read, run, and judged by
  third parties, an explicit permissive licence is both the professional norm
  and a credibility signal. npm also warns on missing `license` at publish
  time (not applicable here, but tooling surfaces it).

**Refactor recommendation and strategy:**
- **Question for the maintainer (recorded here because this review runs
  unattended): which licence do you want - MIT is the conventional choice for
  portfolio/testing repos, but this is an owner decision.** Note the vendored
  context: the Docker images build ON Magento Open Source (OSL 3.0/AFL 3.0),
  but this repo contains only original code (test suite + two original Magento
  modules), so a permissive licence on the repo itself is unproblematic.
- Add the `LICENSE` file and the matching `"license"` field to `package.json`
  in one commit; mirror the decision across the other portfolio repos for
  consistency (the same gap may exist there - out of scope for this review).

---

<a id="risk-4"></a>
## Risk 4 (LOW): engines floor permits end-of-life Node 18 while CI runs Node 20

**Risk description:**
`package.json` declares `"engines": { "node": ">=18" }`. Node 18 reached
end-of-life on 2025-04-30 (well before this review date); CI itself runs Node
20. A contributor on Node 18 would be within the declared support range but on
an unsupported runtime, and outside what CI actually verifies.

**Evidence outline:**
- [package.json](../../package.json) (lines 5-7): `"node": ">=18"`.
- [.github/workflows/ci.yml](../../.github/workflows/ci.yml) (lines 134-137):
  `actions/setup-node@v4` with `node-version: 20`.
- Portfolio precedent: the hand-baked project raised its floor to Node 20 for
  exactly this reason (HBSP-10, 2026-06-16).

**Impact analysis:**
- Low practical risk (the suite is dev-tooling and the code uses only
  Node-18-era APIs such as global `fetch`), but the declared floor is a stale
  claim, and stale claims are this portfolio's recognised failure mode.

**Refactor recommendation and strategy:**
- Bump to `"node": ">=20"` to match CI and the portfolio convention. Optionally
  note the supported Node version in the README's run instructions.

---

<a id="risk-5"></a>
## Risk 5 (LOW): the CI Serenity-JSON guard checks existence, not scenario count - a silently narrowed run would still publish

**Risk description:**
The `ci.yml` guard that prevents the empty-report defect class asserts only
that at least one non-empty JSON file exists in `docs/reports/`. A regression
that narrowed the run without failing it - e.g. a tag-expression typo in
[cucumber.js](../../cucumber.js) excluding most scenarios, or a profile drift
that ran 1 scenario instead of 12 - would pass the guard, pass the suite
(nothing failed), and publish a technically populated but materially wrong
report. The project's own recorded lesson from the 2026-06-11 incident is
"verify report CONTENT (scenario count on the page), never just HTTP 200 +
title"; the automated guard implements a weaker check than the lesson states.

**Evidence outline:**
- [.github/workflows/ci.yml](../../.github/workflows/ci.yml) (lines 221-246):
  the guard counts non-empty `docs/reports/*.json` files and requires `> 0`.
- [docs/backlog.md](../../docs/backlog.md) (Item #4, lines 465-480): the
  content-verification lesson as recorded.
- Mitigating context: `strict: true` in `cucumber.js` (line 23) fails on
  undefined/pending steps, and a wrong tag expression would usually be caught
  in PR review; this is a defence-in-depth gap, not an open hole.

**Impact analysis:**
- Low likelihood, but the failure mode is the one this project has actually
  shipped once before (a green pipeline publishing a wrong report), and the
  cost of the stronger check is a few lines of shell.

**Refactor recommendation and strategy:**
- Extend the guard to assert the executed scenario count: e.g. parse the
  Serenity JSON (`jq '[.[] | select(...)] | length'` or simply count scenario
  JSON documents) and compare against an expected floor (12 today), or grep the
  cucumber summary line from the test step's output. Keep the expected count in
  one place (an env var at the top of the workflow) so Items #13/#14 do not
  create a second drift surface when scenario counts change.

---

<a id="risk-6"></a>
## Risk 6 (LOW): minor documentation/code drift - stale comment path after the PR #33 proposals move, and hard-coded product slug map

**Risk description:**
Two small hygiene items, grouped:

1. [src/config/screenshots.ts](../../src/config/screenshots.ts) (line 14) says
   "See docs/planning/0001-screenshots-in-test-reports.md for the full design",
   but PR #33 (`e577bf6`) moved the proposals to
   `docs/planning/proposals/0001-screenshots-in-test-reports.md`. The link is
   now dead for anyone following it.
2. [src/interactions/StorefrontPage.ts](../../src/interactions/StorefrontPage.ts)
   (lines 454-457) hard-codes a two-entry `productSlugs` map
   (`Push It Messenger Bag`, `Fusion Backpack`). Any new product in a feature
   file requires a code change and the error surfaces only at runtime (clear
   message, but late).

**Evidence outline:** file/line references above; the proposals directory
listing confirms the new location
([docs/planning/proposals/](../../docs/planning/proposals/README.md)).

**Impact analysis:**
- (1) is pure drift - trivial but exactly the metadata-rot class the portfolio
  reviews keep finding, and it landed in the same month the lesson was recorded.
- (2) is a deliberate KISS trade-off that is fine at 2 products; it becomes a
  maintenance tax only if the catalogue surface grows. The thrown error message
  is good; the coupling is acceptable and documented here so the trade-off is
  on record.

**Refactor recommendation and strategy:**
- Fix the comment path in `screenshots.ts` (one line) at the next code touch.
- Leave `productSlugs` as is; if products ever grow past a handful, resolve the
  slug via the catalogue API (`MagentoApi.skuForProduct` already demonstrates
  the pattern and Magento exposes `url_key` on the product resource).

---

## Summary Table

| # | Severity | Finding | Effort to fix |
|---|---|---|---|
| 1 | MEDIUM | npm audit: 1 high (form-data, non-breaking fix) + 5 moderate (uuid via cucumber, major bump) | 15 min now + scheduled major bump |
| 2 | MEDIUM | README "All backlog items are closed" vs backlog Items #13/#14 outstanding | 10 min |
| 3 | MEDIUM-LOW | No licence declared (file + package.json field both absent) | 15 min + owner decision |
| 4 | LOW | `engines: >=18` permits EOL Node; CI runs 20 | 5 min |
| 5 | LOW | CI report guard checks JSON existence, not scenario count | 30-60 min |
| 6 | LOW | Stale comment path (screenshots.ts:14); hard-coded slug map (accepted) | 5 min / none |

---

[<- Previous: Executive Summary](01_EXECUTIVE_SUMMARY.md) | [Back to Index](00_CODE_REVIEW_CLAUDE_Fable_5_v1_20260706T1048Z.md) | [Next: Project Reviews ->](03_PROJECT_REVIEWS/PROJECT_001_Checkout_Automation_Suite.md)
