# Section 2: Risks and Issues

[<- Back to Index](00_CODE_REVIEW_Gemini_v1_20260807T1409Z.md) | [Next: Project Reviews ->](03_PROJECT_REVIEWS/PROJECT_001_magento-checkout-automation.md)

---

## Numbered Findings (High to Low Severity)

### Risk 1 (MEDIUM) — `tsconfig.json` Narrow Scope Excludes Unit Tests and Infrastructure Scripts
- **Risk Description:** `tsconfig.json` limits its compilation scope to `src/**/*.ts`. Unit tests in `test/unit/` and infrastructure scripts like `scripts/audit-ci.mjs` are not included in static `tsc --noEmit` checks.
- **Evidence:** [tsconfig.json](tsconfig.json) (lines 6, 15), [package.json](package.json) (line 14).
- **Impact:** Refactoring shared types or helpers in `src/` can break unit tests or scripts without triggering a failure during `tsc --noEmit`, discovering errors only at test execution runtime.
- **Remediation Strategy:** Expand `include` in `tsconfig.json` or maintain `tsconfig.test.json` to cover `test/**/*.ts`, adding `tsc --noEmit -p tsconfig.test.json` to `npm run verify`.

### Risk 2 (MEDIUM) — Security Audit Script (`audit-ci.mjs`) Omitted from Local Verification Gate
- **Risk Description:** The custom audit gate `scripts/audit-ci.mjs` runs during CI execution but is omitted from `npm run verify`.
- **Evidence:** [package.json](package.json) (lines 14-15), [scripts/audit-ci.mjs](scripts/audit-ci.mjs) (lines 1-89).
- **Impact:** Developers running `npm run verify` locally receive a false-positive pass even when new high-severity CVEs exist in dependencies.
- **Remediation Strategy:** Append `npm run audit:ci` to the `verify` script in `package.json`.

### Risk 3 (LOW) — Hardcoded Node.js Engine Version Matrix in GitHub Workflows
- **Risk Description:** Node.js version `20` is explicitly string-pinned across GitHub Actions workflow jobs instead of reading from `package.json`.
- **Evidence:** [package.json](package.json) (line 7), [.github/workflows/ci.yml](.github/workflows/ci.yml) (lines 35, 98).
- **Impact:** Risk of environment drift between local developer machines and CI runners when Node versions are updated.
- **Remediation Strategy:** Use `node-version-file: 'package.json'` in `actions/setup-node` steps across `.github/workflows/ci.yml`.

### Risk 4 (LOW) — Swallowed Error Potential in Browser Storage Reset
- **Risk Description:** `browser.hooks.ts` clears `localStorage` and `sessionStorage` inside `page.evaluate()` with a swallowed catch block.
- **Evidence:** [src/hooks/browser.hooks.ts](src/hooks/browser.hooks.ts) (lines 138-145).
- **Impact:** If browser context navigation is mid-flight, storage clearance may silently fail, leading to obscure test isolation leaks.
- **Remediation Strategy:** Ensure `page.goto('about:blank')` completes prior to storage evaluation or log clearance exceptions.

---

[<- Previous: Executive Summary](01_EXECUTIVE_SUMMARY.md) | [Back to Index](00_CODE_REVIEW_Gemini_v1_20260807T1409Z.md) | [Next: Project Reviews ->](03_PROJECT_REVIEWS/PROJECT_001_magento-checkout-automation.md)
