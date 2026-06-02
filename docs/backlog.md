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
