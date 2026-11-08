---
version: 2
created: 2026-11-08T21:58Z
project: magento-checkout-automation
type: implementation-plan
item: MAG-MAINT-01
status: approved
approved: 2026-11-08, owner explicitly authorised Phase 1 only and required a stop before any next phase
delivered: not yet
language: en-GB
---

# Implementation plan: Magento maintenance with explicit phase gates

**Changes in v2.** Preserve [v1](2026-11-08_mag-maint-01-ci-recovery.md), retain its bounded dependency repair, and make the owner's phase boundary explicit. Only Phase 1 is authorised by the latest instruction.

## Evidence and starting point

Main remains `dfa7086c7d30ebaf34ada295d52d8a24b35720b5`, matching the clean primary checkout. No Magento PR is open. Workflow `287633364` is still `disabled_inactivity`. The isolated branch contains the three-package repair prepared earlier: Axios 1.21.0, brace-expansion 5.0.12 and follow-redirects 1.16.2. Saved verification passed 20 unit tests, default=12/smoke=7 discovery and the HIGH audit gate in 57.482s. Three MODERATE findings remain recorded separately.

## Phase 1: prepare and validate the current repair (authorised)

1. Review the saved package/lockfile and documentation diff; preserve direct toolchain pins, runtime support, Docker identities and required gates.
2. Re-run `npm run verify`, capture a fresh complete audit, inspect the dependency tree and check documentation links and whitespace. Confirm the saved baseline HIGH-gate failure remains in the evidence trail. No new tests are needed for a dependency-only repair.
3. Commit and push `codex/magento-ci-recovery-20261108`. Reactivate the existing E2E workflow and open a draft PR. Observe required audit and Chromium jobs through completion; diagnose and correct bounded failures rather than weakening checks.
4. Save an immutable project walkthrough and verification receipt with exact commands, counts, timings, SHA and run IDs. Write paired handover v23 in a separate support branch/PR. Record branch validation separately from main acceptance.
5. Confirm the working branches are clean and pushed, workflow state is active, and the latest project PR head passes required CI.

**Exit gate:** saved commits, captured verification, a PR with green required checks, paired handover and an explicit list of remaining phases. Then **stop until the owner explicitly authorises the next phase**.

## Phase 2: merge and main acceptance (not authorised)

After explicit owner authorisation, merge the approved PRs, verify exact-main CI and the published report, reconcile backlog/registry status, and synchronise primary copies safely. Until then main retains its existing lockfile; workflow reactivation alone does not establish main health.

## Phase 3: moderate dependency review (not authorised)

Address MAG-MAINT-02 in a separate compatibility plan and PR. The three moderate findings are not suppressed or represented as fixed by the HIGH-gate repair.

## Phase 4: exploratory WebKit investigation (not authorised)

Diagnose exploratory failures separately before estimating a repair. Preserve the existing non-blocking and promotion policy. Phase 1 makes no WebKit stability claim.

## Verification and delivery

Phase 1 uses the existing `npm run verify` gate, a valid complete audit with zero HIGH/CRITICAL, resolved patched dependencies, `git diff --cached --check`, and required PR CI. The baseline audit failure is the negative control. Docker execution stays on the GitHub-hosted runner; no local Docker changes are planned. Shared handovers use the support repository's separate branch and paired Markdown/HTML rules.

## Owner decision

The owner instructed: action Phase 1, finish with saved commits, evidence and a handover, then stop until explicit authorisation of the next phase. No merge, Phase 2 acceptance, moderate upgrade or WebKit repair is included.
