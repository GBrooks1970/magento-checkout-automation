---
version: 1
created: 2026-11-08T01:38Z
project: magento-checkout-automation
type: implementation-plan
item: MAG-MAINT-01
status: approved
approved: 2026-11-08, owner requested investigation and resolution; merge remains owner-controlled
delivered: not yet
language: en-GB
---

# Implementation plan: MAG-MAINT-01 CI recovery

**Goal.** Clear the confirmed HIGH dependency audit failure and reactivate the inactive E2E workflow, preserving the required Chromium gate and the existing runtime/framework contract.

## Evidence gathered before planning

Read-only inspection of clean `main` at `dfa7086c7d30ebaf34ada295d52d8a24b35720b5`, terminal handover v22, the complete backlog, dependency policy and GitHub Actions establishes:

| Finding | Consequence for the plan |
|---|---|
| Workflow 287633364 is `disabled_inactivity`. Latest run 40277606923 failed its audit job on 26 October 2026. | Re-enable the workflow and prove the repaired branch through CI. |
| The audit job reports five HIGH package findings: Axios and its Serenity consumers, brace-expansion, follow-redirects. | Refresh the existing override strategy without a broad framework/runtime migration. |
| Current audit reproduces five HIGH and three MODERATE findings. | Clear HIGH findings and record the remaining moderate glob/minimatch dependency path explicitly. |
| Required Chromium passed on the failed workflow; exploratory WebKit had cart/checkout timeouts. | Preserve Chromium requirements and the existing explicit non-blocking/promotion policy. Do not claim WebKit repaired from a Chromium pass. |
| Latest handover/backlog closure is historical; main contains later merges. | Add a dated maintenance section and evidence instead of rewriting historical records. |

## Steps

1. Record this plan and index before implementation. Copy the shared implementation-plan template to `docs/templates/` on first use.
2. In `package.json`, refresh the existing Axios override from 1.18.1 to 1.21.0 and brace-expansion from `^5.0.9` to 5.0.12. Regenerate `package-lock.json`, updating follow-redirects to 1.16.2 within Axios's supported range. Preserve all direct toolchain pins, Node engine contract, scripts, features and workflow assertions.
3. Run clean installation, the registry gate `npm run verify`, a complete audit and dependency-tree checks. Confirm the known vulnerable baseline fails the HIGH gate before changing dependencies.
4. Update `docs/backlog.md` and `docs/dependency-audit-policy.md` with current maintenance state, moderate-advisory follow-up, workflow reactivation procedure and the historical WebKit limitation. Append a captured-evidence walkthrough after validation.
5. Re-enable `e2e` through GitHub, open a draft PR from `codex/magento-ci-recovery-20261108`, and observe the required Chromium and audit jobs. Use the pre-baked CI store; do not pull or start local Docker.

## Verification

- Baseline `npm run audit:ci` must exit 1 for the reproduced HIGH findings.
- `npm ci`, `npm run verify`, `npm run audit:ci`; a valid audit must show zero HIGH/CRITICAL, with any moderate/low entries recorded explicitly.
- `npm ls axios brace-expansion follow-redirects` must show the patched resolved versions and no invalid tree.
- `git diff --check` and `git diff --cached --check` before commit.
- Workflow inventory must show `e2e` active; draft PR CI must run and pass the required Chromium suite and audit. A PR run is not evidence of a merged main or deployed Pages update.

## Delivery

Isolated scratch clone, branch `codex/magento-ci-recovery-20261108`, draft PR. The owner authorises each merge. Shared portfolio records remain with the coordinator in a separate repository/PR.

## Decisions put to the owner

| Decision | Options | Recommended | Owner's answer |
|---|---|---|---|
| Repair scope | Bounded audit/workflow repair; broad runtime migration | Bounded repair with residual moderate findings recorded | Investigate and resolve stated issues, then continue, 2026-11-08. |
| Merge | Merge automatically; owner review | Owner review | No new merge authority given. |

## Subsequent phase decision, 2026-11-08

The owner subsequently authorised Phase 1 only, requiring saved commits, evidence and a handover, then an explicit stop. [Plan v2](2026-11-08_mag-maint-01-ci-recovery_v2.md) records that boundary. This original plan remains preserved.
