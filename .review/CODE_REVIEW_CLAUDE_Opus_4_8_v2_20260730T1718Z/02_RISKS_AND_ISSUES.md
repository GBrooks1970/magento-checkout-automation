# Risks and Issues

[Index](00_CODE_REVIEW_CLAUDE_Opus_4_8_v2_20260730T1718Z.md) | [Executive Summary](01_EXECUTIVE_SUMMARY.md) | **Risks** | [Project Review](03_PROJECT_REVIEWS/PROJECT_001_magento-checkout-automation.md) | [Cross-Cutting](04_CROSS_PROJECT_ANALYSIS.md) | [Recommendations](05_RECOMMENDATIONS.md) | [Architecture](06_ARCHITECTURE_ASSESSMENT.md) | [Migration](07_MIGRATION_PLANS.md)

Reviewer: AI assistant (Claude Opus 4.8)
Reviewed commit: `main` @ `b30e0c6` (clean working tree), 2026-07-30.
Prior reviews built on: CLAUDE v1 (2026-06-10), CLAUDE_Opus_4_8 v1 (2026-06-16), CLAUDE_Fable_5 v1/v2 (2026-07-06/18), **CODEX v1 (2026-07-23)**  -  the most recent, whose eight risks are the baseline this review updates.

Risks are ordered highest to lowest. This is the sixth review of a mature, repeatedly-hardened repository, so the emphasis is on **what has changed since CODEX v1**: one finding has escalated to HIGH, one CODEX v1 MEDIUM is now closed, and the rest are carried forward with a current status.

---

## Risk 1 (HIGH): A live transitive `brace-expansion` DoS advisory sits on `main` with no override and no audit gate

**Evidence.**
- `npm audit` on `main` @ `b30e0c6` (2026-07-30) reports **1 high severity vulnerability**:
  `brace-expansion <=5.0.7`  -  *DoS via unbounded expansion length causing an out-of-memory process crash* ([GHSA-mh99-v99m-4gvg](https://github.com/advisories/GHSA-mh99-v99m-4gvg)).
- Dependency path (`npm ls brace-expansion --all`): `@cucumber/cucumber@12.9.0 -> glob@13.0.6 -> minimatch@10.2.5 -> brace-expansion@5.0.7`.
- [package.json](package.json) declares **no `overrides`** block, so nothing pins `brace-expansion` to a patched release.
- [.github/workflows/ci.yml](.github/workflows/ci.yml) has **no `npm audit` step**  -  CI cannot see this and never fails on it.

**Impact.** A dev/test-toolchain DoS is lower blast-radius than a runtime advisory, but it is still a **HIGH** on the default branch that the suite's own tooling would run. More importantly it demonstrates the exact failure mode CODEX v1 predicted in its Risk 8 ("dependency currency is deliberate but not automated"): with no gate, a transitive advisory can land and remain invisible. The prior review found **no HIGH**; this one is live now only because nothing watches for it.

**This is a solved problem elsewhere in the portfolio.** The sibling `bfx-ws-screenplay` closed the *identical* advisory on 2026-07-28 (CODEX-04): a narrowly-scoped `overrides` entry `"brace-expansion": "5.0.8"` (the only release outside the `<=5.0.7` vulnerable range; a dual package whose `require` export keeps CJS consumers working), plus an executable `npm run audit:ci` (`npm audit --audit-level=high`) gate in every CI job, documented in a `dependency-audit-policy.md`. That remediation transfers directly.

**Remediation.**
1. Add `"overrides": { "brace-expansion": "5.0.8" }` to `package.json`, run `npm install`, confirm `npm audit` = 0. (Verify the cucumber/minimatch chain still resolves  -  `brace-expansion@5.0.8`'s `expand()` API is stable across majors and it ships a CommonJS `require` export.)
2. Add `"audit:ci": "npm audit --audit-level=high"` and run it in `ci.yml` after `npm ci`, so a future transitive HIGH fails the build immediately.
3. Record the policy (threshold, owner/expiry exception protocol) as `bfx` did.

---

## Risk 2 (MEDIUM): CODEX v1 Risks 2-5 (profile semantics, validation-scenario ordering, quarantine exclusion, fast-check depth) are carried unremediated

**Evidence.** CODEX v1 (2026-07-23, `.review/CODE_REVIEW_CODEX_v1_20260723T2335Z/02_RISKS_AND_ISSUES.md`) raised these. The commits between CODEX v1 and `b30e0c6` (`f53ca11` cross-browser waits, `8bbb029` review artefacts, `1debbad` CODEX-01 loopback, `b30e0c6` backlog reconcile) address none of them, so they are carried forward as **still-open (inference from git history; each warrants a source re-check during triage)**:
- **Risk 2 (smoke profile non-ordering, not read-only):** the `smoke` profile selects scenarios that mutate cart state; "smoke" implies fast/read-only but it is not.
- **Risk 3 (missing-details scenario can pass before an invalid transition occurs):** a negative-path scenario can succeed for the wrong reason.
- **Risk 4 (documented quarantine tag not excluded by either profile):** the `@deferred`/quarantine convention is documented but not enforced by a profile tag filter.
- **Risk 5 (fast validation checks bindings, not policy logic):** `npm run verify` proves the glue parses (dry-run), not that the policy behaves.

**Impact.** These are design-clarity and test-honesty issues, not defects  -  the suite passes and is store-safe. But they were raised a week ago and remain open; a portfolio reviewer re-reading the CODEX review would expect either remediation or a recorded decision.

**Remediation.** Triage each into `WORKLIST_magento-checkout-automation.md` with an owner decision (fix vs document-and-accept), exactly as the review->triage->loop cycle is designed to do. Do not silently carry them a second cycle.

---

## Risk 3 (MEDIUM-LOW): The Firefox/WebKit non-blocking legs have no tracked path to promotion, only prose

**Evidence.** [.github/workflows/ci.yml](.github/workflows/ci.yml) runs Firefox/WebKit only on `schedule`/`main` (TRIAGE-03 decision); [docs/backlog.md](docs/backlog.md) Item #14/#15 record them as "documented drift" that must produce "three consecutive eligible weekly/main runs at 12/12 with no `[MAG-15 ... recovery]` telemetry" before promotion. That gate exists **only in resolution prose**  -  no issue, checklist item, or automation tracks the three-run counter (README notes a v20 snapshot of "Firefox 1/3, WebKit 0/3").

**Impact.** An accepted, well-documented exploratory state  -  but the promotion criterion is easy to lose. This mirrors CODEX v1 Risk 6 (currency relies on convention).

**Remediation.** Add a single tracked backlog item (or a tiny CI summary that prints the running counter) so the promotion evidence is observable rather than remembered.

---

## Risk 4 (LOW): Documentation currency depends on manual reconciliation (one instance fixed this session)

**Evidence.** Immediately before this review, [docs/backlog.md](docs/backlog.md) carried an internal contradiction: the authoritative Risk Summary read "0 outstanding, all #1-#15 resolved" while a stale dated 2026-06-22 update block still read "#13/#14 remain the only outstanding items, READY TO START" (superseded by PR #37 on 2026-07-17). Reconciled in PR #48 (`b30e0c6`) by marking the block superseded. CODEX v1 Risk 7 ("implementation knowledge fragmented across stale guides") is the same theme.

**Impact.** Low  -  the authoritative summary was always correct  -  but recurring: this is the third documented instance (v17 stale, the 2026-06-22 block, and the registry-cache lag) of dated narrative drifting from the authoritative state.

**Remediation.** The backlog is long and accretes dated update blocks; consider moving superseded update blocks into a clearly-labelled "History" section so the top of the file always reflects only current state. Keep reconciling after every worklist, per the project's own norm.

---

## Closed since CODEX v1 (evidence of a working remediation loop)

- **CODEX v1 Risk 1 (MEDIUM) - localhost boundary not enforced by Docker: RESOLVED.** CODEX-01 (PR #47, `1debbad`, merged this session) bound the published store port to `127.0.0.1` in `docker-compose.yml` and defaulted the `DeclinePayment` fixture off, with a CI preflight loopback assertion. Verified by config review and a green e2e re-run on `main` (all three engines `success`, 2026-07-30).

---

## Non-findings (checked, no issue)

- **Secrets:** `auth.json` holds Adobe Marketplace keys used only by `bake.yml`; the baked store ships hard-coded *test* credentials (`admin`/`Password123!`) by design, and CI needs no Magento secrets after baking. No live secret leak. (Confirm `auth.json` is git-ignored or contains only placeholder keys  -  spot-check before publishing.)
- **Licence:** MIT declared in `package.json` and `LICENSE`. Present and consistent.
- **Runtime lifecycle / waits:** Item #15 centralised engine-aware wait ceilings; no fixed sleeps found in the reviewed Screenplay layers.
