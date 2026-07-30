# Migration Plans

[Index](00_CODE_REVIEW_CLAUDE_Opus_4_8_v2_20260730T1718Z.md) | [Executive Summary](01_EXECUTIVE_SUMMARY.md) | [Risks](02_RISKS_AND_ISSUES.md) | [Project Review](03_PROJECT_REVIEWS/PROJECT_001_magento-checkout-automation.md) | [Cross-Cutting](04_CROSS_PROJECT_ANALYSIS.md) | [Recommendations](05_RECOMMENDATIONS.md) | [Architecture](06_ARCHITECTURE_ASSESSMENT.md) | **Migration**

This project is complete and stable; there is no framework/stack migration in flight. "Migration" here means the concrete remediation sequence for this review's findings, sized so each is a single review->triage->loop worklist item with its own PR and CI gate.

## Sequence

### Step 1 (P0) - Dependency HIGH + audit gate (Risk 1)
- **Change:** `package.json` `overrides: { "brace-expansion": "5.0.8" }` + `audit:ci` script; `ci.yml` gains an `npm run audit:ci` step after `npm ci`; add `docs/dependency-audit-policy.md`.
- **Verify:** `npm install` -> `npm audit` = 0; `npm run verify` green; CI `audit:ci` step green; one full e2e run stays green (docs/deps-only, so the E2E is unaffected but confirm the lockfile change did not disturb resolution).
- **Risk of change:** low - `brace-expansion@5.0.8` is a dual package; the exact fix is proven in `bfx-ws-screenplay` (CODEX-04).
- **Reversible:** yes (drop the override).

### Step 2 (P1) - CODEX v1 carried findings (Risk 2)
- Four small items (smoke semantics, negative-scenario ordering, quarantine tag filter, `verify` depth). Each is code/config + a Gherkin or profile change, individually testable via `npm run verify` and a Chromium CI run. Take an owner decision (fix vs document-and-accept) per item; do not bundle.

### Step 3 (P2) - Promotion-gate observability (Risk 3)
- Docs/CI-summary only. Add a tracked counter for the Firefox/WebKit three-run promotion criterion. No behavioural change.

### Step 4 (P3) - Doc-currency shape (Risk 4)
- Docs-only. Refactor `docs/backlog.md` so superseded dated blocks live under a labelled History section. `npm run verify` is the only gate.

### Step 5 - Close-project
- After Steps 1-2, run the close-project flow (refresh handover, terminal close-out) - the project has met the close bar its handovers repeatedly flagged.

## Sequencing notes

- Steps are independent except that Step 5 should follow Steps 1-2.
- Every step keeps the pinned-trio discipline (Serenity/Playwright/Cucumber) and the disposable-store contract untouched.
- Docker is available locally (E-drive storage, ~242 GB free, magento images pre-pulled), so E2E-affecting items can be validated locally as well as in CI - mindful that host RAM (~8.2 GB) is shared with any other running stack.
