# Magento Checkout Automation — Backlog

**Version:** 1 — Initial backlog from phases 1–3
**Last Updated:** 2026-06-02
**Based on:** Session notes v2 (2026-06-02), Phase 1–3 implementation

Tracks all outstanding work needed to reach a reviewer-ready portfolio state. Items are ordered by
priority score. The portfolio credibility checklist at the bottom tracks headline deliverables.

**Priority Scoring System:**
- **Score = Breakage Probability (0–10) + Portfolio Impact (0–10) + Maintenance Burden (0–10)**
- **HIGH (20–30):** Blocking — immediate action required
- **MEDIUM (10–19):** Important — schedule within current phase
- **LOW (0–9):** Desirable — schedule when capacity allows

---

## Outstanding Items

### HIGH Priority (Score: 20–30)

#### Item #1: Resolve live test target — Score: 27

**Priority Score:** Breakage Probability (10) + Portfolio Impact (10) + Maintenance Burden (7) = **27 points**
**Impact:** No scenario can run. The entire suite is untested against a real Magento instance.
**Effort:** 4–8 hours (Docker route) or 1–2 hours (public sandbox, if one becomes available)
**Status:** READY TO START
**Area:** Infrastructure / CI

**Problem:**
The default `BASE_URL` (`https://magento.softwaretestingboard.com`) returns an SSL error 526 as of
2026-06-02. No replacement public sandbox has been identified. The suite is structurally complete
and TypeScript-clean but has never executed against a live Magento store.

**Resolution Strategy:**

*Recommended route — Dockerised Magento:*
1. Source a pre-built Magento 2 Open Source Docker image with Luma sample data
2. Complete `docker-compose.yml` with service definitions, health checks, and port mapping
3. Complete `.github/workflows/ci.yml` with startup sequence: `indexer:reindex` + `cache:flush` before test run
4. Set `BASE_URL=http://localhost:8080` (or mapped port) in CI environment
5. Configure a test payment method (enables Item #2)
6. Verify all 9+ active scenarios pass; publish run report

*Fallback route — alternative public sandbox:*
1. Identify a stable, publicly accessible Magento Luma store (check Magebit, Mageplaza demos)
2. Verify guest checkout is enabled and sample products are present
3. Set `BASE_URL` to the confirmed URL

**Success Criteria:**
- [ ] `npm test` completes with all active scenarios passing
- [ ] CI run produces a green badge on the GitHub repo
- [ ] `BASE_URL` documented in README run-instructions

**Update (2026-06-02):** A read-only smoke test was run against the **Magebit** public demo
(`https://magento2-demo.magebit.com`, Luma sample data) to de-risk ahead of Docker — see
`docs/implementation-logs/2026-06-02_live-smoke-test.md`. The `mageplaza.com` demo returned HTTP 403
and was discarded. The smoke test validated the live target and the core methodology (one scenario
passed end-to-end) but surfaced two new blockers, Items #8 and #9 below, which gate any green run
regardless of target. Docker remains the route for checkout/API/payment work.

---

#### Item #8: Fix browser-lifecycle defect in Cucumber hooks — Score: 26

**Priority Score:** Breakage Probability (10) + Portfolio Impact (10) + Maintenance Burden (6) = **26 points**
**Impact:** Blocks every multi-scenario run, and therefore any green CI badge — on Docker or anywhere.
Discovered by the 2026-06-02 live smoke test.
**Effort:** 30 minutes
**Status:** ✅ DONE (2026-06-02)
**Area:** Implementation / Infrastructure

**Problem:**
`src/hooks/browser.hooks.ts` launched a fresh browser in `Before` and closed it in `After`. Only the
first scenario per process passed; every subsequent scenario failed at its first navigation with
`browserContext.newPage: Target page, context or browser has been closed`. The reused actor stayed bound
to the closed browser. This was a lifecycle bug, not a selector/assertion failure (see smoke-test log §3.2).

**Resolution Strategy:**
1. Move the browser launch to `BeforeAll`, keep `engage(Cast.where(...))` in `Before`, close in `AfterAll`
2. Rely on Serenity/JS to manage a fresh browser context per scenario
3. Re-run the read-only subset against Magebit; confirm the lifecycle error is gone

**Success Criteria:**
- [x] Multi-scenario runs no longer fail with "browser has been closed" — every scenario reaches the storefront
- [x] `npx tsc --noEmit` stays clean

**Outcome:** Fixed in `src/hooks/browser.hooks.ts` (launch once in `BeforeAll`, `engage` per `Before`,
close in `AfterAll`), with a comment warning against reverting. Confirmed by re-run: all 7 read-only
scenarios now navigate successfully; remaining failures are genuine selector/timeout drift (Item #10).

---

#### Item #9: Tag order-placing scenarios and add a smoke profile — Score: 20

**Priority Score:** Breakage Probability (6) + Portfolio Impact (7) + Maintenance Burden (7) = **20 points**
**Impact:** CLI path/line filters do not reliably scope this project (the auto-loaded `default` profile's
`paths` glob always wins), so there is currently no safe way to exclude order-placing scenarios when
running against a shared/non-resettable store. Discovered by the 2026-06-02 live smoke test (§3.3).
**Effort:** 30–45 minutes
**Status:** ✅ DONE (2026-06-02)
**Area:** Test infrastructure / CI

**Problem:**
Against `magento2-demo.magebit.com`, neither positional paths nor `feature:line` arguments restricted the
run — the full suite executed. Once Item #8 was fixed, an unscoped run would place real orders on a shared
demo via the `guest-checkout` happy path and quantity outline.

**Resolution Strategy:**
1. Tag order-placing scenarios in `guest-checkout.feature` (e.g. `@placesOrder`)
2. Filter via tags, which combine reliably with the profile: `--tags "not @deferred and not @placesOrder"`
3. Add a dedicated `smoke` profile in `cucumber.js` for the read-only subset

**Success Criteria:**
- [x] A profile runs only the read-only subset, verified to exclude all order-placing scenarios
- [x] `cucumber.js` carries a `smoke` profile

**Outcome:** `@placesOrder` added to the two order-placing scenarios in `guest-checkout.feature`; a `smoke`
profile (`tags: 'not @deferred and not @placesOrder'`) added to `cucumber.js`. Verified: `npx cucumber-js
--profile smoke` runs exactly 7 read-only scenarios and no order-placing ones. Safe to run against shared stores.

---

#### Item #10: Harden live-run selectors and step timeouts — Score: 18

**Priority Score:** Breakage Probability (8) + Portfolio Impact (5) + Maintenance Burden (5) = **18 points**
**Impact:** With the lifecycle bug fixed, the read-only smoke run surfaced genuine selector/behaviour drift
against live Luma. These must be resolved for a reliable pass; best finished against the clean Docker instance.
Discovered by the 2026-06-02 live smoke test re-run (§7).
**Effort:** 1–2 hours (some items only confirmable on a clean store)
**Status:** 🟡 CODE FIXES DONE & validated 2026-06-02; remaining validation confirmed Docker-gated (Item #1)
**Area:** Implementation

**Problem / findings:**
1. `ProceedToCheckout` selector `button.action.primary.checkout` matches **two** elements on live Luma
   (mini-cart `#top-cart-btn-checkout` and the cart-page `[data-role="proceed-to-checkout"]`) → Playwright
   strict-mode violation. Needs a single unambiguous locator.
2. Several steps hit Cucumber's default **5000 ms** timeout against live network + KO.js re-renders. Raise
   via `setDefaultTimeout` (and/or scope Serenity interaction timeouts) for live/CI runs.
3. Cart-count/subtotal assertions are unreliable on the shared Magebit demo (observed cart count "8" where
   "1" expected — contaminated shared state). Confirms these assertions need the clean, resettable Docker store.

**Resolution Strategy:**
1. Tighten the `ProceedToCheckout` / `CartPage` checkout locator to a single element
2. Add `setDefaultTimeout` (e.g. 15–30 s) and review per-interaction waits
3. Re-validate count/subtotal assertions on the Docker instance (Item #1), not the shared demo

**Success Criteria:**
- [x] `ProceedToCheckout` resolves to exactly one element on Luma — strict-mode violation gone, click executes
- [x] No spurious 5 s step timeouts — Cucumber step ceiling raised to 30 s; KO.js checkout-render wait raised to 20 s
- [ ] Cart-count and subtotal scenarios pass on the clean Docker store — still pending Item #1

**Outcome (2026-06-02):** Code fixes applied and validated against the Magebit demo as far as the shared
store allows:
- `CartPage.proceedToCheckoutButton` → `button[data-role="proceed-to-checkout"]` (was the ambiguous
  `button.action.primary.checkout`). Confirmed: the strict-mode violation is gone and the proceed click executes.
- `CheckoutPage.placeOrderButton` → scoped to `.payment-method-content` (same latent ambiguity). Validated by
  reasoning only — it is on the `@placesOrder` path, not run against the shared demo; confirm on Docker.
- `setDefaultTimeout(30 s)` in `browser.hooks.ts`; `ProceedToCheckout` email-field wait raised to `Wait.upTo(20 s)`.

Remaining failures on Magebit are **environmental, not code**: the shared cart is nondeterministic (item count
returned 3/7/8 across runs) so the Background cannot build a controlled cart, and the checkout email field
therefore never renders for the validation scenarios. This confirms checkout-flow and count/subtotal assertions
require the clean, resettable Docker store (Item #1). The shared demo remains useful only for cart/selector smoke.

---

#### Item #2: Activate `payment-failure.feature` — Score: 21

**Priority Score:** Breakage Probability (7) + Portfolio Impact (8) + Maintenance Burden (6) = **21 points**
**Impact:** The `@deferred` payment failure scenario is written and tagged but excluded from every run. It is the primary quarantine-strategy demonstration in the credibility checklist.
**Effort:** 2–4 hours (once Docker CI is in place)
**Status:** BLOCKED on Item #1
**Area:** Implementation / Infrastructure

**Problem:**
`features/payment-failure.feature` requires a payment gateway that can deterministically decline a
card (e.g. a "magic number" test card). This is not achievable on a public sandbox. The scenario
is fully specified and tagged `@deferred`; it needs only one new Task and a test gateway configuration.

**Resolution Strategy:**
1. Confirm Docker Magento instance is running (depends on Item #1)
2. Configure a test payment method (e.g. Magento's built-in "Fake Payment" or Braintree sandbox)
3. Implement `ProvidePaymentDetails.cardThatWillBeDeclined()` task in `src/tasks/ProvidePaymentDetails.ts`
4. Drop the `@deferred` tag from `features/payment-failure.feature`
5. Verify the scenario passes and is included in the CI run

**Success Criteria:**
- [ ] Payment failure scenario runs and passes in CI
- [ ] `@deferred` tag removed from `payment-failure.feature`
- [ ] Quarantine rationale comment in the feature file updated to reflect completion

---

### MEDIUM Priority (Score: 10–19)

#### Item #3: Wire API-driven Background steps — Score: 17

**Priority Score:** Breakage Probability (5) + Portfolio Impact (7) + Maintenance Burden (5) = **17 points**
**Impact:** Background steps currently verify product availability via UI navigation (a fallback). The stated pattern — API setup, UI assertion — is not yet demonstrated in the Background steps.
**Effort:** 3–5 hours
**Status:** BLOCKED on Item #1 (needs a live Magento instance with admin API access)
**Area:** Implementation

**Problem:**
`src/api/MagentoApiClient.ts` is scaffolded but the Background step `Given a product "..." priced at "..." is available` navigates to the product page rather than calling the REST API. This means:
- Product must already exist in the store (relies on sample data)
- Price is not verified via the API
- The API setup pattern ADR-0003 promises is not demonstrated in the running code

**Resolution Strategy:**
1. Obtain a Magento admin token and set `MAGENTO_ADMIN_TOKEN` env var
2. Complete `MagentoApiClient.verifyProductIsAvailable()` with a working REST V1 search query
3. Add `CallAnApi.at(BASE_URL)` to the actor's abilities in `src/hooks/browser.hooks.ts`
4. Update `src/step-definitions/background.steps.ts` to use `MagentoApi.verifyProductIsAvailable(name, price)`
5. Document the REST endpoints used in `docs/adr/0003-api-driven-test-data-setup.md`

**Success Criteria:**
- [ ] Background steps call the Magento REST API, not the UI
- [ ] `MAGENTO_ADMIN_TOKEN` documented in README and CI env vars
- [ ] ADR-0003 updated with the concrete endpoint and response shape

---

#### Item #4: Publish living documentation — Score: 15

**Priority Score:** Breakage Probability (3) + Portfolio Impact (8) + Maintenance Burden (4) = **15 points**
**Impact:** The Serenity BDD HTML report is a key portfolio artifact — reviewers click through narrated, passing scenarios. Without publishing it, the report only exists locally.
**Effort:** 1–2 hours
**Status:** BLOCKED on Item #1 (needs passing runs to have something to publish)
**Area:** CI / Documentation

**Resolution Strategy:**
1. Add a GitHub Actions step to run `npm run test:report` after the test step
2. Configure GitHub Pages to serve from `docs/reports/` or use the `peaceiris/actions-gh-pages` action
3. Add the published URL to the README
4. Optionally add a report badge alongside the CI badge

**Success Criteria:**
- [ ] GitHub Pages URL serves the Serenity BDD report
- [ ] Report URL linked in the README
- [ ] Report updates automatically on every passing CI run

---

#### Item #5: Complete ADR concrete examples — Score: 12

**Priority Score:** Breakage Probability (2) + Portfolio Impact (6) + Maintenance Burden (4) = **12 points**
**Impact:** All four ADRs have "skeleton — expand with concrete example" markers. A reviewer reading them sees the reasoning but not the proof. Concrete before/after code examples make the decisions tangible.
**Effort:** 2–3 hours
**Status:** READY TO START (implementation exists; examples can be written now)
**Area:** Documentation

**Resolution Strategy:**
1. **ADR-0001** — Add a side-by-side `PageObject` vs Screenplay example using `ProceedToCheckout` as the subject
2. **ADR-0002** — Pin the Serenity/JS version (3.43.2) and add a link to the living-documentation URL once published
3. **ADR-0003** — Link to `src/api/MagentoApiClient.ts`; list the REST V1 endpoints used in the Background steps
4. **ADR-0004** — Note the Playwright version (1.60.0); add a code snippet showing `Wait.until(element, isVisible())` vs a hypothetical Cypress `cy.wait(2000)` anti-pattern

**Success Criteria:**
- [ ] All four ADRs have at least one concrete code example
- [ ] No "Skeleton" markers remaining in any ADR

---

### LOW Priority (Score: 0–9)

#### Item #6: Complete Gherkin style guide worked example — Score: 8

**Priority Score:** Breakage Probability (1) + Portfolio Impact (5) + Maintenance Burden (2) = **8 points**
**Impact:** `docs/gherkin-style-guide.md` has a placeholder for the before/after refactor example. The principles are documented; the illustrative example is not.
**Effort:** 1 hour
**Status:** ✅ DONE (2026-06-02)
**Area:** Documentation

**Resolution Strategy:**
1. Replace the placeholder comment in `docs/gherkin-style-guide.md` with a real bad scenario (UI-mechanic steps, hard waits, over-specified selectors)
2. Show the same behaviour written declaratively using the real step library from `features/guest-checkout.feature`
3. Add inline commentary on each change and why it matters

**Success Criteria:**
- [x] No placeholder comments remaining in `docs/gherkin-style-guide.md`
- [x] Before/after example uses real step text from the suite

**Outcome:** Placeholder replaced with a bloated `before` (URL navigation, hard waits, over-specified selectors, currency symbols, grand-total assertion) refactored into the real `Complete a guest order with valid details` scenario, with seven commentary sections each mapping a change to a documented principle.

---

#### Item #7: Update README run-instructions — Score: 7

**Priority Score:** Breakage Probability (1) + Portfolio Impact (4) + Maintenance Burden (2) = **7 points**
**Impact:** The README has a "Placeholder. To be completed..." note in the Running the suite section.
**Effort:** 30 minutes (once Item #1 is resolved)
**Status:** BLOCKED on Item #1
**Area:** Documentation

**Resolution Strategy:**
1. Replace the placeholder with the confirmed `BASE_URL`, install steps, and run commands
2. Add `HEADLESS`, `MAGENTO_ADMIN_TOKEN` env var documentation
3. Add link to the published Serenity BDD report (once Item #4 is done)

---

## Resolved Items

#### Phase 1–3 implementation ✅ Resolved 2026-06-02

**Resolution:** Repository established from bundle; author email rewritten to noreply; pushed to GitHub. Serenity/JS project initialised. Full Screenplay layer (interactions, tasks, questions, hooks, step definitions) implemented. TypeScript compiles clean.
**See:** Commit `9e3f8e6` — `Implement Screenplay layer: interactions, tasks, questions and step definitions`

---

## Summary

| Priority | Count | Total Effort | Status |
|---|---|---|---|
| HIGH (20–30) | 2 | 6–12 hrs | Item #1 ready to start; Item #2 blocked on #1 |
| MEDIUM (10–19) | 3 | 6–10 hrs | Items #3 and #4 blocked on #1; Item #5 ready |
| LOW (0–9) | 2 | 1.5–2 hrs | Items #6 ready; #7 blocked on #1 |
| **Total Outstanding** | **7** | **13.5–24 hrs** | |
| Resolved | 1 | ~20 hrs completed | |

---

## Portfolio Credibility Checklist

| Item | Status | Backlog ref |
|---|---|---|
| Commit history shows specs before implementation | ✅ Done | — |
| ADRs complete with concrete examples | ⏸ In progress | Item #5 |
| Green CI badge, demonstrably non-flaky | ❌ Blocked | Item #1 |
| Living documentation published (GitHub Pages) | ❌ Blocked | Items #1, #4 |
| Gherkin style guide with refactor example | ✅ Done | Item #6 |
| Quarantine strategy demonstrated (`@deferred`) | ✅ Scaffolded | Item #2 to activate |

---

## Phase Plan

| Phase | Items | Effort | Gate |
|---|---|---|---|
| Phase 4 — CI target | #1 (Docker or sandbox) | 4–8 hrs | Tests run green |
| Phase 4b — Payment | #2 (activate @deferred) | 2–4 hrs | Payment scenario passes |
| Phase 4c — API wiring | #3 (Background steps) | 3–5 hrs | No UI fallback in Background |
| Phase 5 — Polish | #4 (living docs), #5 (ADRs), #6 (style guide), #7 (README) | 4–6 hrs | All checklist items green |
