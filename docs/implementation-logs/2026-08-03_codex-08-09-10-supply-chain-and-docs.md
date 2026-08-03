# CODEX-08/09/10 — supply-chain pins + docs reconciliation (Extension 5 close) — 2026-08-03

## Session Summary

Closed the final three items of the `WORKLIST_magento-checkout-automation.md` Extension 5 — the
carried MEDIUM-LOW/LOW findings from CODEX review v1 (Risk 6/7) plus the folded-in `CLAUDE_Opus_4_8
v2` Risk 3. Pinned every GitHub Actions reference to a full commit SHA, digest-pinned the pre-baked
GHCR store images consumed by CI, and reconciled the architecture/Screenplay/QA guides to current
behaviour while making the Firefox/WebKit promotion counter observable. All three landed on `main`
(`6ba3984`) behind a green required Chromium e2e; a follow-up backlog reconciliation (v9→v10) landed
as PR #62 (`371c73b`). This completes Extension 5 (SEC-01 + CODEX-01..CODEX-11) — the worklist is now
0 unchecked.

---

## Objectives

1. ✅ **CODEX-08** — pin GitHub Actions to reviewed commit SHAs with a maintenance runbook — PR [#59](https://github.com/GBrooks1970/magento-checkout-automation/pull/59)
2. ✅ **CODEX-09** — enforce baked Magento image identity with GHCR `sha256` digests — PR [#60](https://github.com/GBrooks1970/magento-checkout-automation/pull/60)
3. ✅ **CODEX-10** — reconcile current-state architecture/Screenplay guidance + make the Firefox/WebKit promotion gate observable — PR [#61](https://github.com/GBrooks1970/magento-checkout-automation/pull/61)
4. ✅ **Backlog reconciliation** — record the Extension 5 closure (header v9→v10) — PR [#62](https://github.com/GBrooks1970/magento-checkout-automation/pull/62)

---

## Test Results

Local gate = `npm run verify` (`tsc --noEmit` → `node:test` unit layer → `default` + `smoke`
dry-runs). No live store was run locally; the Docker Chromium e2e is the required CI gate, cited per
PR below.

| Suite | Passing | Total | Status |
|---|---|---|---|
| Policy/decision unit tests (`npm run test:unit`) | 20 | 20 | ✅ PASS |
| `default` profile dry-run (parse + step-binding) | 12 | 12 | ✅ PASS |
| `smoke` profile dry-run (non-ordering subset) | 7 | 7 | ✅ PASS |
| CI required Chromium e2e — CODEX-08 (PR #59) | 12 | 12 | ✅ PASS (run 30788165731, 5m18s) |
| CI required Chromium e2e — CODEX-09 (PR #60 merge commit) | 12 | 12 | ✅ PASS (run 30793318310, 5m30s — on the digest-pinned pull) |
| CI required Chromium e2e — CODEX-10 (PR #61) | 12 | 12 | ✅ PASS (run 30788897079, 5m11s) |
| CI required Chromium e2e — backlog v10 (PR #62) | 12 | 12 | ✅ PASS (run 30793856608, 5m43s) |

`npm audit` on `main`: **0 vulnerabilities**.

---

## Changes Implemented

### CODEX-08 — pin every workflow action to a full commit SHA

**Files changed:**
- `.github/workflows/ci.yml`, `.github/workflows/bake.yml` — all 9 `uses:` references converted from
  mutable major tags (`@v4`/`@v3`) to full 40-char commit SHAs with a `# vX.Y.Z` comment, each within
  its reviewed major: `actions/checkout` v4.4.0 (`11d5960`), `actions/setup-node` v4.4.0 (`49933ea`),
  `actions/upload-pages-artifact` v3.0.1 (`56afc60`), `actions/deploy-pages` v4.0.5 (`d6db901`),
  `docker/login-action` v3.7.0 (`c94ce9f`). SHAs resolved via `gh api …/git/ref/tags/<tag>`,
  dereferencing annotated tags to their commit.
- `docs/dependency-audit-policy.md` — a new **GitHub Actions pin runbook** (tag→SHA resolution
  snippet, quarterly refresh cadence, the major-bump caveat) plus the freshness-cadence bullet flipped
  from "tag-pinned until CODEX-08" to done.

A moved tag can no longer change executed CI code without a repository diff. This is supply-chain
hardening, not a version bump — a `checkout@v5`-style major bump (which would also clear the
Node-20-action deprecation annotation) is documented as separate, deliberately-reviewed work.

### CODEX-09 — digest-pin the baked GHCR store images

**Files changed:**
- `docker-compose.ci.yml` — both images referenced as `:2.4.8-b24@sha256:<digest>`
  (store-app `42c47502…`, store-db `24bf4756…`) instead of the bare tag; header tag-policy note
  updated. The readable tag stays (a diff still reads as a tag bump); the appended digest makes the
  reference immutable — a tag can be moved in a registry, a digest cannot.
- `.github/workflows/bake.yml` — the digest step reframed from documentation-only to the pin source:
  it now emits a copy-paste `image:` block per service in the run summary and **fails the bake if
  either digest is absent** (a push that did not register a `RepoDigest` must not be adopted).
- `.github/workflows/ci.yml` — the preflight now asserts every overlay reference is digest-pinned
  (`@sha256:`), so an overlay edit that dropped the digest fails the required check.
- `docs/docker-magento-setup.md`, `docs/dependency-audit-policy.md` — adopt runbook and freshness
  cadence updated; the earlier "digests are documentation, not pins" decision reversed with its
  rationale.

Digests were resolved with `docker buildx imagetools inspect` and independently confirmed to resolve
in GHCR and match the b24 tags via `docker manifest inspect`.

### CODEX-10 — reconcile the guides + make FF/WebKit promotion observable

**Files changed:**
- `docs/architecture.md` v2→v3 — Cucumber 11→12 (exact versions deferred to `package.json`); `BROWSER`
  engine selection; folder map gains `src/config/*`, `StabiliseCheckoutRoute`, `CartTotalQuantity`,
  `artifact-slug`, `test/`, `scripts/`; ADR range 0001→0007; runtime sequence rewritten (selected
  engine, TRACE isolated-context path, route recovery, engine-aware wait tiers — numbers deferred);
  tooling table + env vars added.
- `docs/screenplay-guide.md` v2→v3 — engine-selected launch; default vs `TRACE=on-failure`
  `Before`/`After` context modes; `CartTotalQuantity` question; the per-engine step timeout
  (90/120/180 s) and engine-aware wait-tier table (the single source; architecture references it).
- `docs/backlog.md` — credibility checklist stale `11/11 (run 27141209665)` → `12/12 Chromium
  (required) green on main (run 30742167799, 825afd4)`; Item #15 gains a promotion-tracker pointer.
- `docs/qa-strategy.md` — a tracked **promotion-tracker table** (Firefox 0/3, WebKit 0/3): the single
  record of the three-run counter, updated from CI, not resolution prose.
- `.github/workflows/ci.yml` — the suite step tees its output (`set -o pipefail` keeps the required
  Chromium gate honest); a new exploratory-engine step prints a `MAG-15 promotion` run-summary line
  (suite outcome + `[MAG-15 … recovery]` count → eligible/not).
- `README.md` — points at the tracker and the CI summary line, superseding the v20 snapshot.

### Backlog reconciliation — v9→v10

**Files changed:**
- `docs/backlog.md` — header v9→v10, a dated 2026-08-03 closure note recording the Extension 5 merge.
  No Item #1–#15 status changed (the CODEX/SEC items are post-close review findings, not backlog items).

---

## Technical Decisions

| Decision | Rationale | Alternatives rejected |
|---|---|---|
| CODEX-08 pins stay within each action's **reviewed major** | Pinning is supply-chain hardening; a major bump changes behaviour and deserves its own review | Bumping to v5/v7 to clear the Node-20 deprecation annotation (a functional change, called out in the runbook as separate) |
| CODEX-09 uses the **`:tag@sha256:`** form, not a bare digest | Keeping the readable tag answers the "opaque diff" objection the earlier documentation-only decision was based on — the diff still reads as a tag bump, with the digest as the enforcement | Bare `@sha256:` digest (opaque diffs); leaving digests as documentation (the reversed prior decision) |
| CODEX-09 preflight **asserts** `@sha256:` on every overlay ref | Structurally enforces the property on every PR, so a future overlay edit that dropped the digest fails the required check rather than silently regressing | Trusting the maintainer to keep the digest (the convention the review flagged) |
| CODEX-10 defers mutable numbers (wait tiers, versions) to **one source** | The June-design drift accumulated precisely because guides restated time-sensitive values; deferral to `wait-durations.ts`/`package.json` prevents recurrence | Restating the numbers in each guide (the status quo that drifted) |
| FF/WebKit counter reset to a **conservative 0/3** | No verified unbroken run of eligible `main`/schedule observations exists across the intervening Extension-5 merges; a fresh honest baseline beats carrying v20's unverifiable "1/3" | Carrying v20's "Firefox 1/3" forward without evidence |
| CI summary line reports each run's **contribution**, not an automated 3-run tally | A cross-run counter needs external state; "where practical" per the finding — each leg reports its own eligibility, the running tally is the tracked table | A fully-automated counter querying prior runs (not practical in one workflow without external state) |

No new ADR was created — CODEX-08/09 supply-chain decisions are captured in
`docs/dependency-audit-policy.md`; CODEX-10 is documentation reconciliation; the rest are tactical and
recorded here and in the worklist.

---

## Documentation Updates

- `docs/dependency-audit-policy.md` — GitHub Actions pin runbook (CODEX-08); digest-pinned base-image
  cadence bullet (CODEX-09).
- `docs/docker-magento-setup.md` — digest-pinned adopt runbook (CODEX-09).
- `docs/architecture.md` (v2→v3), `docs/screenplay-guide.md` (v2→v3) — current-behaviour reconciliation (CODEX-10).
- `docs/qa-strategy.md` — promotion-tracker table + `MAG-15 promotion` note (CODEX-10).
- `README.md` — promotion tracker + CI summary pointer (CODEX-10).
- `docs/backlog.md` — credibility checklist 11/11→12/12 and Item #15 pointer (CODEX-10); header v9→v10 closure note.
- `WORKLIST_magento-checkout-automation.md` (portfolio root, control state) — CODEX-08/09/10 checked off; Extension 5 now 0 unchecked.

---

## Lessons Learned

- **SHA-pinning an action does not change its declared runtime.** CI still annotates
  `actions/checkout@<sha>` as Node-20 (the action's own runtime), unchanged by pinning — only a major
  bump moves it. Confirmed against the live annotation; treat runtime bumps as separate work.
- **Keep the readable tag alongside the digest.** `:tag@sha256:` preserves a human-legible diff while
  enforcing content identity — the mitigation that made reversing the documentation-only stance
  defensible.
- **`set -o pipefail` before teeing a required step.** `npm test 2>&1 | tee` would otherwise mask a
  failing suite behind `tee`'s exit 0, silently weakening the required Chromium gate.
- **`gh` resolves to whichever repo the shell's CWD is in.** This workspace nests the project repo
  under the portfolio-root support repo; a merge command run from the wrong CWD silently targeted the
  root repo's unrelated PRs. Run `gh` from inside the project dir, or pass `--repo`/`--head`.
- **Resolve then re-verify a merge conflict on the required path.** #60 conflicted with #59 on adjacent
  `dependency-audit-policy.md` cadence bullets; after merging `main` in and keeping both new bullets,
  CI was re-run to green before landing rather than merging an unverified commit.

---

## Recommendations / Next Steps

- [ ] **Re-close the project** — Extension 5 is fully actioned with 0 open worklist items; the v16
  "FINAL" handover is stale after two review cycles. `close-project` would write the terminal handover
  and flip the registry row. — MEDIUM.
- [ ] **Re-tally the FF/WebKit promotion tracker** from the `MAG-15 promotion` CI summary lines over
  three consecutive eligible `main`/schedule runs before removing any `continue-on-error`; one engine
  at a time. WebKit is not a candidate on current Linux CI evidence — backlog Item #15. — LOW.
- [ ] **Optional Actions major bump** to clear the Node-20 deprecation annotations (`checkout@v5`
  etc.), following the pin runbook — a deliberate, separately-reviewed change. — LOW.

---

*Session logged: 2026-08-03. Author: Claude Code*
