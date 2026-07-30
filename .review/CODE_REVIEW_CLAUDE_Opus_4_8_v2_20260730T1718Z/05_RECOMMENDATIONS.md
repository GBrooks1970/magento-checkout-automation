# Recommendations

[Index](00_CODE_REVIEW_CLAUDE_Opus_4_8_v2_20260730T1718Z.md) | [Executive Summary](01_EXECUTIVE_SUMMARY.md) | [Risks](02_RISKS_AND_ISSUES.md) | [Project Review](03_PROJECT_REVIEWS/PROJECT_001_magento-checkout-automation.md) | [Cross-Cutting](04_CROSS_PROJECT_ANALYSIS.md) | **Recommendations** | [Architecture](06_ARCHITECTURE_ASSESSMENT.md) | [Migration](07_MIGRATION_PLANS.md)

Ordered by leverage. Each maps to a risk in [02_RISKS_AND_ISSUES.md](02_RISKS_AND_ISSUES.md) and is intended to become a `WORKLIST_magento-checkout-automation.md` item.

## P0 - Clear the HIGH and make the class self-catching (Risk 1)

1. **Pin `brace-expansion`.** Add to `package.json`:
   ```json
   "overrides": { "brace-expansion": "5.0.8" }
   ```
   Run `npm install`; confirm `npm audit` = 0 and the cucumber/glob/minimatch chain still resolves (`brace-expansion@5.0.8` ships a CommonJS `require` export; `expand()` is API-stable).
2. **Add an executable audit gate.** `"audit:ci": "npm audit --audit-level=high"` in `package.json`; run it in `ci.yml` after `npm ci` in the job(s) that run `npm ci`. Fails the build on any future unexcepted HIGH+.
3. **Document the policy.** A short `docs/dependency-audit-policy.md` (threshold, where it runs, owner/expiry exception protocol), mirroring `bfx-ws-screenplay`.

*Why first:* it is the only HIGH, the fix is proven two days old in a sibling repo, and it converts the recurring "dependency currency is manual" theme into enforcement.

## P1 - Resolve the carried CODEX v1 findings, do not carry them a third cycle (Risk 2)

4. Triage CODEX v1 Risks 2-5 into the worklist with an explicit owner decision each:
   - Smoke profile read-only/ordering semantics - rename, re-scope, or document the intent.
   - Negative validation scenario ordering - assert the invalid transition is actually reached.
   - Quarantine tag - add the profile tag filter so `@deferred` is genuinely excluded.
   - `verify` depth - decide whether a lightweight policy check (not just dry-run bindings) is worth adding.

## P2 - Make the accepted-drift gates observable (Risk 3)

5. Give the Firefox/WebKit three-run promotion gate a tracked home: a backlog item with the running counter, or a one-line CI summary that prints `Firefox N/3, WebKit N/3`. Prose is not a tracker.

## P3 - Structural doc-currency fix (Risk 4)

6. Move superseded dated update blocks in `docs/backlog.md` into a labelled "History" section so the top of the file always reads current-only. Keep the after-every-worklist reconciliation norm.

## Portfolio-level (raise separately, not a magento worklist item)

7. Propose a portfolio-wide convention: **every registered repo runs `npm audit --audit-level=high` (or the stack equivalent) in CI**. The `brace-expansion` advisory hitting both magento and bfx is the evidence.

## After the above - close-project candidacy

With the HIGH cleared, the CODEX v1 findings dispositioned, and docs reconciled, the project meets the bar its own handovers have repeatedly flagged for a formal close-out (complete since 2026-07-06, six reviews, disposable infra, honest drift handling). Recommend a close-project pass once P0-P1 land.
