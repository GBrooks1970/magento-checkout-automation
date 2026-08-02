# SEC-01 + CODEX-02..07 — Opus_4_8 v2 review loop (Extension 5) — 2026-08-01

## Session Summary

Actioned the first eight items of the `WORKLIST_magento-checkout-automation.md` Extension 5 —
derived by triaging code review `CLAUDE_Opus_4_8 v2` (PR #49) — plus a follow-up hardening of the
audit gate. Closed the review's one live HIGH (a transitive `brace-expansion` DoS advisory), added
an enforced-but-resilient CI dependency-audit gate, strengthened the missing-shipping-details
validation oracle, corrected the smoke profile's safety contract, standardised quarantine
vocabulary, introduced a fast TypeScript policy/decision unit-test layer wired into `npm run
verify`, and serialised the Pages deployment. All eight changes are merged to `main` (`26e877c`),
each behind a green required Chromium e2e and the new `audit` gate. CODEX-08..10 remain.

---

## Objectives

1. ✅ **SEC-01** — remediate the live `brace-expansion` HIGH and add an executable dependency-audit gate (subsumes CODEX-11) — PR [#50](https://github.com/GBrooks1970/magento-checkout-automation/pull/50)
2. ✅ **Harden `audit:ci`** against transient npm audit-endpoint failures (follow-up to SEC-01) — PR [#52](https://github.com/GBrooks1970/magento-checkout-automation/pull/52)
3. ✅ **CODEX-02** — strengthen the missing-shipping-details validation oracle — PR [#51](https://github.com/GBrooks1970/magento-checkout-automation/pull/51)
4. ✅ **CODEX-03** — correct the smoke profile's safety contract — PR [#53](https://github.com/GBrooks1970/magento-checkout-automation/pull/53)
5. ✅ **CODEX-04** — standardise quarantine vocabulary on `@deferred` — PR [#54](https://github.com/GBrooks1970/magento-checkout-automation/pull/54)
6. ✅ **CODEX-05** — add a fast TypeScript policy-test layer, wired into `verify` + CI — PR [#55](https://github.com/GBrooks1970/magento-checkout-automation/pull/55)
7. ✅ **CODEX-06** — extract and test trace-retention + checkout-recovery decisions — PR [#56](https://github.com/GBrooks1970/magento-checkout-automation/pull/56)
8. ✅ **CODEX-07** — serialise Pages deployment so the newest report wins — PR [#57](https://github.com/GBrooks1970/magento-checkout-automation/pull/57)
9. ⏸️ **CODEX-08** (pin Actions to reviewed SHAs), **CODEX-09** (GHCR image digests), **CODEX-10** (final docs reconciliation) — deferred to the next session.

---

## Test Results

Local `npm run verify` = `tsc --noEmit` → **unit tests** → `default` + `smoke` dry-runs. The live
Docker Chromium e2e ran in CI on every PR (the required gate) — cited by run below, not re-run
locally (no wall-clock e2e this session).

| Suite | Passing | Total | Status |
|---|---|---|---|
| Policy/decision unit tests (`npm run test:unit`, node:test) | 20 | 20 | ✅ PASS (11 suites) |
| `default` profile dry-run (parse + step-binding) | 12 | 12 | ✅ PASS |
| `smoke` profile dry-run (non-ordering subset) | 7 | 7 | ✅ PASS |
| CI required Chromium e2e (per merged PR) | 12 | 12 | ✅ PASS (e.g. run 30690767527, 5m41s) |
| CI `audit` gate (per merged PR) | — | — | ✅ PASS (`audit:ci OK - 0 high/critical`) |

`npm audit` on `main`: **0 vulnerabilities**.

---

## Changes Implemented

### SEC-01 — brace-expansion override + executable audit gate

**Files changed:**
- `package.json` — added `overrides.brace-expansion: "5.0.8"` (clears GHSA-mh99-v99m-4gvg; npm's advisory range is `<=5.0.7`, so 5.0.8 is the clearing release; a dual package whose `require` export is CommonJS, so the `@cucumber/cucumber → glob → minimatch@10.2.5` chain still resolves). Added the `audit:ci` script.
- `.github/workflows/ci.yml` — a **dedicated `audit` job** (checkout + setup-node + `npm ci` + `npm run audit:ci`) runs on every push/PR, **independent of the Docker preflight** — so a HIGH is caught even when the store images are not baked, and without running once per browser in the matrix `test` job.
- `docs/dependency-audit-policy.md` (new) — threshold (`high`), CI placement, owner/expiry exception protocol, remediation history, and the manual quarterly freshness cadence — **subsuming the former CODEX-11** (an enforced gate replaces a documented-only cadence).

### audit:ci hardening — resilient to npm's retiring audit endpoint

**Files changed:**
- `scripts/audit-ci.mjs` (new) — parses `npm audit --json` and decides on **content, not exit code**: `≥1` high/critical → FAIL (lists offenders); a valid 0-high/critical report → PASS; an endpoint/registry error → retry ×3, then treat as **inconclusive** (warn, do not red the build). Node built-ins only; `shell: true` so the npm launcher resolves on both Windows and the Linux runner.
- `package.json` — `audit:ci` → `node scripts/audit-ci.mjs`.

`npm audit`'s legacy `/security/audits/quick` endpoint intermittently returned `400 "Invalid package tree"` on a clean tree (CI run 30573685643) while the identical lockfile passed minutes earlier — the gate was flaky; this makes it trustworthy.

### CODEX-02 — settle the checkout loader before asserting non-advancement

**Files changed:**
- `src/interactions/CheckoutPage.ts` — replaced the aria-invalid-field target with a `checkoutLoader` (`.loading-mask`) target.
- `src/step-definitions/validation.steps.ts` — the shared "should not advance to payment" oracle now waits for the Knockout loading mask to clear (present-then-gone) before asserting non-advancement.

The missing-shipping-details submit surfaces **no** field-level invalid signal (Magento does not flag the empty address fields `aria-invalid`, unlike the invalid-email case — confirmed in CI), so a positive-invalid wait timed out there. The loader-settle cannot false-fail the required Chromium gate (no loader → passes instantly; a stuck loader only affects the non-blocking FF/WebKit legs); the invalid-email scenario keeps its positive `aria-invalid` assertion in its own dedicated step.

### CODEX-03 — correct the smoke profile's safety contract

**Files changed:**
- `cucumber.js`, `README.md`, `docs/qa-strategy.md`, `docs/docker-magento-setup.md` — the 7-scenario `smoke` profile is now consistently described as **non-ordering and state-mutating**, requiring a **dedicated/resettable** target, and **not read-only / not shared-store-safe** (the included cart + checkout-validation scenarios mutate state). Its actual guarantee is stated: no order placed, decline fixture not run. Dated historical logs + the resolved backlog Item #9 left as history (repo-wide reconciliation is CODEX-10).

### CODEX-04 — standardise quarantine vocabulary on `@deferred`

**Files changed:** QA strategy / guidance — the quarantine tag is prescribed as `@deferred`, matching both Cucumber profiles' filters; unfiltered `@pending` recommendations removed.

### CODEX-05 — fast TypeScript policy-test layer

**Files changed:** a `test/` unit layer using **`node:test` + `ts-node`** with a synchronous discovery shim (the Node-20 test runner does not glob `--test` args, and shell globbing is not portable), wired into `npm run verify` **before** the dry-runs and into the CI `audit` job. Covers browser selection, engine wait tiers + invalid inputs, screenshot modes/defaults, URL-host credential safety, and deterministic slug/config parsing. No live store required.

### CODEX-06 — extract + test trace-retention and checkout-recovery decisions

**Files changed:** the retention/recovery **decision predicates** were extracted to pure functions (trace retain-on-fail, video present/absent cleanup, Chromium no-recovery contract, exploratory-engine recovery eligibility, recovery telemetry) and covered by focused unit tests; runtime behaviour unchanged.

### CODEX-07 — serialise Pages deployment

**Files changed:**
- `.github/workflows/ci.yml` — the `deploy-pages` job gains `concurrency: { group: pages, cancel-in-progress: true }` so an older long-running `main` run cannot publish its stale report over a newer commit's. Still main-gated, so PRs never deploy.

---

## Technical Decisions

| Decision | Rationale | Alternatives rejected |
|---|---|---|
| SEC-01 audit gate lives in a **dedicated `audit` job**, not the matrix `test` job | Runs even when Docker images aren't baked, and once (not once-per-browser) | Adding `npm run audit:ci` after `npm ci` in `test` (skips during bootstrap; triples in the 3-engine matrix) |
| `audit:ci` decides on **JSON content, not exit code**, and treats endpoint errors as inconclusive-warn | npm audit conflates a real HIGH with a transient endpoint 400; fail-closed would make the gate flaky, and an unreachable advisory DB is not proof of a vulnerability | Retry-then-fail (still flaky on a persistent outage); adding `audit-ci`/`better-npm-audit` (a new dependency in the audited tree) |
| CODEX-02 = **loader-settle** (option a), not a live-store probe | Avoids a ~20-min RAM-constrained store bring-up; the missing-details case has no positive invalid signal to wait on, so settling the async submit is the honest strengthening | Probe the live DOM for the actual signal (declined by owner); keep the original bare oracle |
| CODEX-05 runner = **`node:test` + `ts-node` + a synchronous discovery shim** | Reuses the project's existing `ts-node`; no new runner dependency; works on the Node-20 CI floor where `--test` does not glob | `vitest`/`tsx` (new dependency + audit surface); shell globbing (not portable across Windows/Ubuntu) |
| CODEX-07 Pages concurrency = `group: pages` + `cancel-in-progress: true` | A single stable group serialises deploys; cancel-in-progress lets a newer report supersede an older in-flight one ("newest wins") | GitHub's default `cancel-in-progress: false` (older completes first); workflow-level group (serialises the whole ~20-min e2e, not just the deploy) |

No new ADR was created — SEC-01/audit decisions are captured in `docs/dependency-audit-policy.md`; the rest are tactical/config and recorded here and in the worklist items.

---

## Documentation Updates

- `docs/dependency-audit-policy.md` (new) — the audit gate, its resilience, the exception protocol, and the manual freshness cadence (subsuming CODEX-11).
- `README.md` — "Non-ordering subset" smoke-profile run instructions (CODEX-03).
- `docs/qa-strategy.md` — Smoke subset + quarantine-vocabulary corrections (CODEX-03/04).
- `docs/docker-magento-setup.md` — smoke run-command comment (CODEX-03).
- `WORKLIST_magento-checkout-automation.md` (portfolio root, control state) — SEC-01 + CODEX-02..07 checked off; CODEX-11 marked subsumed; OBS-01 folded into CODEX-10.

---

## Lessons Learned

- **Triage against the existing worklist, not just the backlog.** The Opus_4_8 v2 review largely re-derived findings already tracked as unchecked CODEX-02..11 — the net-new contribution was one live HIGH. Mapping to existing items avoided a duplicate 10-item list.
- **A security gate is only as good as its flakiness.** `npm audit`'s retiring endpoint made the naive gate intermittently red; separating "real finding" from "endpoint error" (parse the JSON) is what makes it trustworthy.
- **`.cmd` launchers need `shell: true` on Windows.** `spawnSync('npm.cmd', …, {shell:false})` throws `EINVAL`; the resilience path masked it until the raw command was checked.
- **When the SUT surfaces no positive signal, settle the async instead of inventing one.** For the missing-details case Magento flags nothing; waiting for the loader to clear is the honest, non-flaky strengthening (and can't false-fail the required engine).
- **Docker on this machine is real** (E-drive storage, ~242 GB free, magento images pre-pulled) — the earlier "no ≥6 GB host" note is stale; RAM (~8.2 GB, shared with a running orangehrm stack) is the actual constraint, not disk.

---

## Recommendations / Next Steps

- [ ] **CODEX-08** — pin GitHub Actions to reviewed commit SHAs with version comments + an update runbook; this also clears the recurring Node-20 deprecation warnings on `actions/checkout@v4` etc. — MEDIUM-LOW.
- [ ] **CODEX-09** — enforce baked Magento image identity with GHCR `sha256` digests in `docker-compose.ci.yml` + the bake workflow — MEDIUM-LOW.
- [ ] **CODEX-10** — final repo-wide docs reconciliation (runs last, after 08/09); includes the historical smoke "read-only" claims left in the backlog Item #9 / implementation logs — LOW.
- [ ] Portfolio-root worklist PR + a fresh magento handover (conductor Stages 4–5) once the loop completes.

---

*Session logged: 2026-08-01. Author: Claude Code*
