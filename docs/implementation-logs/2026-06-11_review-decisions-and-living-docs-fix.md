# Review decisions executed + living-documentation pipeline fixed — 2026-06-11

## Session Summary

Executed the two user decisions left open by the 2026-06-10 code-review worklist — deleting the
unused `CompleteCheckout` composite (R-07b) and implementing API-driven guest-cart seeding (R-03,
including a new `Portfolio_CartSeed` fixture module and a store re-bake) — then investigated why
the published Serenity living documentation showed zero results. That investigation found a
two-layer pipeline defect that had left the report an empty shell since go-live; both layers are
now fixed and CI-verified. The suite stands at 12/12 scenarios, 94/94 steps green with real,
populated report data flowing for the first time.

---

## Objectives

1. ✅ Execute R-07b: delete `CompleteCheckout` + step; re-point ADR-0001's example at live code;
   re-word the style guide's composite-step paragraph (PR #16, merged).
2. ✅ Execute R-03: seed guest carts via the REST API, session-bound by a new test-fixture
   endpoint; record as ADR-0006 (PR #17, merged; required a re-bake).
3. ✅ Investigate the empty published Serenity report; diagnose and fix
   (PR #18 merged; PR #19 open at time of writing).
4. ✅ Relocate the misplaced session-notes v11 to `../session-notes/` and harden
   `prompts/write-handover.prompt.md` against recurrence (portfolio-level, outside this repo).

---

## Test Results

All runs are the full default profile (12 scenarios / 94 steps) in CI against the pre-baked store.

| Validation point | Run | Result |
|---|---|---|
| PR #16 (R-07b deletion) | `gh pr checks 16`, test job 5m17s | ✅ 12/12 PASS |
| PR #17 (R-03 seeding) — after re-bake `27311886905` | run `27311888207` re-run, test job 5m1s | ✅ 12/12 PASS (pre-bake attempt failed as expected: adopt endpoint absent from old images) |
| PR #18 (report `--source`) | run `27337953381` | ✅ 12/12 PASS; report step logs "Loading test outcomes from ./docs/reports" |
| PR #19 (formatter fix) | run `27340512097` | ✅ 12/12 PASS; **12 per-scenario Serenity narrative blocks present for the first time** |

---

## Changes Implemented

### R-07b — `CompleteCheckout` deleted; ADR-0001 re-pointed (PR #16)

**Files changed:**
- `src/tasks/CompleteCheckout.ts` — deleted (unused by any feature; the quantity outline asserts
  the subtotal mid-checkout so it needs granular steps).
- `src/step-definitions/checkout.steps.ts` — `I complete checkout with valid details` step and
  import removed.
- `docs/adr/0001-use-screenplay-over-page-objects.md` — flagship example re-pointed at
  `ProvideShippingDetails` (live code; three public variants reuse one private `fillForm` Task —
  a stronger composition story than the deleted composite).
- `docs/gherkin-style-guide.md` — composite-step paragraph re-worded: the principle stays; the
  absence of a composite step is framed as deliberate pruning.
- `docs/screenplay-guide.md`, `docs/architecture.md` — inventories updated.

### R-03 — API guest-cart seeding (PR #17, ADR-0006)

**Files changed:**
- `app/code/Portfolio/CartSeed/**` — new test-fixture module. `GET /cartseed/cart/adopt?id=<maskedId>`
  resolves the masked quote id and `replaceQuote()`s it into the current session. Flag-gated
  (`cartseed/general/active`, default OFF → route 404s on non-test stores). Core Magento offers no
  API for guest-quote-to-session binding — the gap that had forced UI seeding.
- `app/code/Portfolio/CartSeed/etc/adminhtml/system.xml` — added after bake run `27311621780`
  failed: `bin/magento config:set` refuses paths not declared in a system structure.
- `src/api/MagentoApiClient.ts` — `skuForProduct`, `createGuestCart`, `addItemToGuestCart`.
- `src/tasks/AdoptSeededCart.ts` — binds via **browser navigation** (the binding must hit the
  browser's own session cookie; a node-side fetch would bind a throwaway session).
- `src/step-definitions/background.steps.ts` — the cart-seeding Given now goes API → adopt;
  `AddToCart` remains the implementation of the `When` steps, where adding *is* the behaviour
  under test.
- `.github/workflows/bake.yml`, `docs/docker-magento-setup.md` (step 6d) — install/enable both
  Portfolio fixture modules; write both fixture flags to `core_config_data`.
- `docs/adr/0006-api-guest-cart-seeding.md` (new), `docs/adr/0003-api-driven-test-data-setup.md`
  (amendment), plus README/architecture/qa-strategy/screenplay-guide reconciliation.

### Living documentation — layer 1: renderer source path (PR #18, merged)

**Files changed:**
- `package.json` — `test:report` now `serenity-bdd run --source ./docs/reports --features ./features`.
  The CLI's default source is `target/site/serenity`; the suite archives to `docs/reports/`, so the
  renderer had been aggregating an empty directory every run.

### Living documentation — layer 2: the adapter never ran (PR #19)

**Files changed:**
- `cucumber.js` — the Serenity adapter is now the **only** formatter. Cucumber permits a single
  stdout formatter and silently drops the rest; with
  `format: ['@serenity-js/cucumber', 'progress-bar']` the progress bar took the stdout slot and
  the adapter was **never instantiated** — no Serenity events, a starved crew, no JSON written
  anywhere, ever. Proven by a minimal store-free probe feature (adapter + `progress` → nothing,
  and a wrapper formatter showed the adapter never even loaded; adapter alone → ConsoleReporter
  narrative + scenario JSON in `docs/reports`). Console output now comes from Serenity's
  ConsoleReporter — richer than the dots it replaces.

---

## Technical Decisions

| Decision | Rationale | Alternatives rejected |
|---|---|---|
| Bind API-seeded guest quotes to the session via an in-repo fixture endpoint (**ADR-0006**) | Core Magento has no API for guest-quote-to-session binding; extends the established `Portfolio_DeclinePayment` fixture philosophy; flag-gated default-off for safety | Re-scope the ADR-0003 claim (rejected by user decision); customer-cart API (changes the journey persona); browser-mediated `checkout/cart/add` POST (headless UI, not API setup) |
| Delete `CompleteCheckout` rather than re-adopt (user decision, R-07b) | Strongest "do they prune?" answer; live `ProvideShippingDetails` is a better composition example anyway | Re-adoption in a feature (would change a spec to serve an example) |
| Serenity adapter as sole Cucumber formatter | Cucumber's single-stdout-formatter rule silently dropped it when listed alongside `progress-bar` | Routing `progress` to a file (adds noise for no benefit — ConsoleReporter supersedes it) |
| Bake from the PR branch (`gh workflow run bake.yml --ref <branch>`) | Dispatch ref controls checkout, so module changes can be baked and CI-verified before merge | Merging unverified module code first, then baking from `main` |

---

## Documentation Updates

- `docs/backlog.md` — dated updates to Item #3 (API cart seeding, ADR-0006) and Item #4 (the
  empty-report defect, both layers, and the verification lesson).
- `docs/adr/0006-api-guest-cart-seeding.md` — new; `docs/adr/0003-...md` amended;
  `docs/adr/README.md` index row; `docs/adr/0001-...md` example re-pointed.
- `README.md`, `docs/architecture.md`, `docs/qa-strategy.md`, `docs/screenplay-guide.md`,
  `docs/gherkin-style-guide.md`, `docs/docker-magento-setup.md` — reconciled to the as-built
  state across PRs #16/#17.
- Portfolio level (outside this repo): misplaced `session-notes v11` moved into
  `../session-notes/`; the colliding worklist handover renumbered to v12;
  `../prompts/write-handover.prompt.md` intro corrected to name the folder explicitly.

---

## Lessons Learned

- **Cucumber silently drops surplus stdout formatters.** Listing anything after
  `@serenity-js/cucumber` in `format` starves Serenity of every event with zero warning. The tell
  is the absence of ConsoleReporter narrative in run output — visible in every CI log since the
  project began, unnoticed because nobody knew to look for it.
- **Verify report *content*, not endpoint health.** The empty report served HTTP 200 with the
  correct `<title>` for three days of green badges. "Page exists" is not "page is populated".
- **`bin/magento config:set` refuses config paths not declared in a `system.xml`** — declare
  custom module flags in `etc/adminhtml/system.xml` before baking. Cost one bake cycle.
- **`workflow_dispatch` checks out the ref it is dispatched on** — baking from the PR branch lets
  module changes be image-verified before merge.
- **Bakes now take ~8 minutes, not ~40** — runner-side improvements make re-bake cycles cheap.
- **Diagnose with a minimal probe when code-reading stalls.** Three plausible theories (configure
  placement, CJS/ESM dual instances, formatter resolution) were each killed or confirmed in
  minutes by a throwaway feature + wrapper formatter; an hour of source-reading had only produced
  candidates.

---

## Recommendations / Next Steps

- [ ] Merge PR #19, then confirm the published page shows 12 scenarios / 94 steps — the final,
  user-visible proof. **HIGH**
- [ ] Consider a CI guard asserting `docs/reports/*.json` is non-empty before the report step, so
  a future regression of this class fails the run instead of publishing an empty shell. **MEDIUM**
- [ ] `.review/CODE_REVIEW_CLAUDE_v1_20260610T1127Z/` finding statuses could be annotated now that
  R-01…R-07b, R-10 and both Next-Steps items are closed (or fold into a future review v2). **LOW**

---

*Session logged: 2026-06-11. Author: Claude Code (Fable 5), directed by Gary Brooks.*
