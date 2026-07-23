# Annex: Metrics and Validation

[<- Previous: Migration Plans](../07_MIGRATION_PLANS.md) | [Back to Index](../00_CODE_REVIEW_CODEX_v1_20260723T2335Z.md)

**Reviewer:** AI assistant (OpenAI Codex, GPT-5)
**Date:** 2026-07-23T23:35Z

## Repository Snapshot

| Metric | Result |
|---|---:|
| Reviewed commit | `f53ca11e55563dc18ab43352e351667afbceaac1` |
| Feature files | 4 |
| Expanded active scenarios | 12 |
| Smoke scenarios | 7 |
| Deferred scenarios | 0 |
| TypeScript source files under `src/` | 32 |
| Magento fixture modules | 2 |
| GitHub Actions workflows | 2 |
| Required review files | 8 plus this annex |
| Required browser engines | 1 (Chromium) |
| Exploratory browser engines | 2 (Firefox, WebKit) |
| Unit/component test scripts | 0 |
| Declared licence | MIT |

## Validation Commands

### `npm run verify`

**Result:** PASS.

- `tsc --noEmit`: PASS.
- Default-profile dry-run: 12 scenarios resolved with no undefined or ambiguous steps.
- Smoke-profile dry-run: 7 scenarios resolved with no undefined or ambiguous steps.

### `npm audit --audit-level=low`

**Result:** PASS - 0 vulnerabilities.

### `npm outdated`

**Result:** Updates available; this is an informational currency check, not a gate.

| Package | Current | Wanted | Latest |
|---|---:|---:|---:|
| `@playwright/test` | 1.60.0 | 1.60.0 | 1.61.1 |
| `playwright` | 1.60.0 | 1.60.0 | 1.61.1 |
| `@types/node` | 20.19.41 | 20.19.43 | 26.1.1 |
| `typescript` | 5.9.3 | 5.9.3 | 7.0.2 |

### `npm ls --depth=0`

**Result:** PASS - direct dependency tree resolved without missing/invalid packages.

### Secret-pattern scan

**Result:** No private-key or common live-token pattern found. Known `admin` / `Password123!`
values are deliberately committed test-target credentials and are assessed in Risk 1.

### GitHub current-state inspection

Commands used:

```text
gh run list --repo GBrooks1970/magento-checkout-automation --workflow e2e --limit 10
gh run view 29779190853 --repo GBrooks1970/magento-checkout-automation --json jobs,url,conclusion,headSha
gh pr list --repo GBrooks1970/magento-checkout-automation --state open
```

**Result:**

- Latest `main` run at reviewed SHA:
  <https://github.com/GBrooks1970/magento-checkout-automation/actions/runs/29779190853>.
- Overall workflow: SUCCESS.
- Chromium job: SUCCESS.
- Firefox job: SUCCESS, 12 scenarios, no MAG-15 recovery message found in inspected log output.
- WebKit job: FAILURE, 12 scenarios attempted; job remained intentionally non-blocking.
- Pages deployment: SUCCESS from the Chromium artifact.
- Open pull requests before this review branch: none.

## Not Run

- Full local Docker E2E: not run. The review prompt excludes heavyweight infrastructure unless
  explicitly requested.
- `npm test` against a live store: not run locally.
- Bake workflow: not run; it requires Marketplace credentials and up to 90 minutes.
- PHP unit/static analysis: no project toolchain or gate exists for it.

## Evidence Confidence

- **Proven locally:** TypeScript compilation, step binding/profile selection, audit state, direct
  dependency resolution, tracked source, and documentation content.
- **Proven remotely:** current-SHA job conclusions and Pages deployment via GitHub CLI; selected
  Firefox/WebKit log summaries.
- **Documented but not re-executed:** 94-step full-suite count, local three-engine Docker results,
  and image bake/install behaviour.
- **Inference:** without an explicit Pages concurrency group, overlapping long workflow runs can
  reach deployment out of commit order.

## Review Questions Recorded

1. Should local port 8080 be loopback-only?
2. Should smoke be renamed non-ordering or split from a truly read-only profile?
3. Is `@deferred` or `@pending` the canonical quarantine tag?
4. Should freshness checks run automatically for a resting project?

---

[<- Previous: Migration Plans](../07_MIGRATION_PLANS.md) | [Back to Index](../00_CODE_REVIEW_CODEX_v1_20260723T2335Z.md)
