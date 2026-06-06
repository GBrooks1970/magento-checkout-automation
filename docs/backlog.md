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

**Update (2026-06-02, Session v4 follow-up) — Docker route researched, scaffolding authored:**
The "pin a known-good image and go" framing was **wrong**. There is no official pull-and-run Magento
image with Luma sample data; a working store is *installed* at run time. Grounded in Mark Shust's
docker-magento v53.0.0 (the maintained reference config):
- `docker-compose.yml` rewritten from skeleton to a **pinned, healthchecked** infra stack — nginx
  `markoshust/magento-nginx:1.28-0`, php `markoshust/magento-php:8.4-fpm-2`, `mariadb:11.4`,
  `valkey/valkey:8.1-alpine`, `markoshust/magento-opensearch:3-0`, `markoshust/magento-rabbitmq:4.2-0`;
  storefront on `:8080`. Dev-only services (Xdebug/Mailcatcher/Blackfire) and host SSH/Composer mounts dropped.
- **`docs/docker-magento-setup.md`** authored — the full bring-up runbook (Composer auth → create-project
  with samples → `setup:install` → `sampledata:deploy` → reindex → cache flush → `npm test`).
- `.github/workflows/ci.yml` reconciled to the real service names (`phpfpm`, not `magento`) + auth-keys secrets.

**Two facts that resize this item:** (1) it **requires Adobe Commerce Marketplace auth keys** (free account;
real secret, local + CI) — a hard dependency the old notes missed; (2) a from-scratch install is **~30 min**
and needs **≥6 GB RAM** on Docker. Revised effort: **6–10 hrs**, not 4–8.

**Update (2026-06-03) — VALIDATED end-to-end; store stands up green.** With Marketplace keys supplied, the
runbook sequence brought up a working store: **Magento 2.4.8, 2040 Luma products, HTTP 200 on
`http://localhost:8080`**, reindexed and cached. Four first-bring-up snags were found and resolved (all now
captured in `docs/docker-magento-setup.md`): (1) Git-Bash MSYS path mangling of `/var/www/html` →
`MSYS_NO_PATHCONV=1`; (2) `sampledata:deploy` 401 — its child composer needs a **project-root** `auth.json`,
not just the global one; (3) the upstream nginx redirects `:8000`→HTTPS — **solved in-repo** via a committed
`docker/nginx/default.conf` serving plain HTTP on `:8080`; (4) a manual install ships only `nginx.conf.sample`
— copy to `nginx.conf` + reload. Also corrected the version pin to **2.4.8** (2.4.7 fails the PHP-8.4 platform
check). Remaining for full closure: flesh out `ci.yml`'s install step + CI auth-key secrets, and the
test-isolation defect below (now in #10). Infra (compose nginx mount, vhost, gitignored auth.json) committed.

**Update (2026-06-02):** A read-only smoke test was run against the **Magebit** public demo
(`https://magento2-demo.magebit.com`, Luma sample data) to de-risk ahead of Docker — see
`docs/implementation-logs/2026-06-02_live-smoke-test.md`. The `mageplaza.com` demo returned HTTP 403
and was discarded. The smoke test validated the live target and the core methodology (one scenario
passed end-to-end) but surfaced two new blockers, Items #8 and #9 below, which gate any green run
regardless of target. Docker remains the route for checkout/API/payment work.

**Update (2026-06-06) — cold-bring-up quick win applied.** Raised the OpenSearch healthcheck
`start_period` `5s`→`60s` in `docker-compose.yml`. OpenSearch boots in ~50s, longer than
`retries × interval` (6 × 5s = 30s), so the first cold `compose up` aborted with "opensearch is
unhealthy" and `phpfpm`/`app` never started — the double-`compose up` documented in session-notes v6
§3. With the generous `start_period` a **single** cold `compose up` now reaches all-healthy +
storefront HTTP 200. Validated 2026-06-06: smoke 7/7 (43/43), `@placesOrder` 4/4 (40/40), `tsc` clean.

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
- [x] Cart-count and subtotal scenarios pass on the clean Docker store — **DONE; full read-only smoke suite green**

**RESOLVED (2026-06-03): the read-only smoke suite is fully green — 7/7 scenarios, 43/43 steps — against the
Dockerised Magento 2.4.8 store** (`BASE_URL=http://localhost:8080 npm run test:smoke`). The two
checkout-validation scenarios were reconciled with the version's real behaviour: invalid-email asserts the
email field's stable `aria-invalid="true"` attribute (visibility checks are unreliable — the post-submit
Knockout.js `blockLoader` overlays the field and Serenity's `isVisible()` is occlusion-aware); missing-details
asserts only non-advancement (Magento surfaces no message there). Final fix in commit `9f322b4`.

**Update (2026-06-03) — ran on the clean Docker store (Item #1); the "contamination" theory was WRONG.**
The v3/v4 notes attributed the cart count "8" to shared-demo contamination. On the **pristine, single-user
Docker store** the same happens: adding 1 item reads 3, then 8 across the run. Two genuine defects, both
previously masked:
1. **Test-isolation bug (dominant).** Guest-cart state **leaks across scenarios** — the run reuses one
   browser session, so carts accumulate (sc2 expected 2 got 3 = 1 leftover + 2; sc7 expected 1 got 8). The
   hooks comment claims Serenity gives each scenario a fresh context; empirically it does not with this
   `BrowseTheWebWithPlaywright.using(browser)` wiring. Fix: a fresh browser context per scenario, or clear
   cart/cookies/localStorage per scenario. `CartItemCount` reads `span.counter-number` (the mini-cart total),
   which faithfully reflects the leaked cart — the selector is fine; the isolation is not.
2. **`AddToCart` success-message wait too short.** `Wait.until(StorefrontPage.successMessage, isVisible())`
   uses Serenity's **5 s default**, NOT the 30 s Cucumber `setDefaultTimeout` (which only bounds step length).
   Scenario 1's cold first add exceeded 5 s. Fix: `Wait.upTo(Duration.ofSeconds(15)).until(...)`.

Both must be fixed for a green run. This is the headline value of the Docker target: it exposed a real
test-isolation defect the shared demo had hidden.

**Update (2026-06-03, cont.) — isolation fixed; smoke at 42/44 steps (5/7 scenarios green).** After the
isolation + add-to-cart-wait fix, the remaining failures were genuine Luma 2.4.8 selector/behaviour drift,
now mostly resolved:
- ✅ Cart subtotal selector `.cart-totals .subtotal .price` → `.totals.sub .price`; the subtotal step now
  navigates to the cart page first (some scenarios asserted it without viewing the cart).
- ✅ Cart-row selectors: scope by the product *photo* link `a[title="..."]` (the name link has no title);
  the delete link lives in a sibling `tr.item-actions`, so scope to `tbody.cart.item:has(...)`.
- ✅ Cart-quantity count: the header counter shows distinct-item count until `checkout/cart_link/use_qty=1`
  (now set in the bring-up). Count assertions also poll (`Wait.until`) to ride out the async customer-data
  refresh after a cart-update reload.
- ✅ "Should not advance to payment": assert the payment section is not visible (robust) instead of the
  email field staying visible (the post-submit loader transiently hides it).

**Two scenarios still red — checkout validation messages (need a decision, not just a selector):**
1. **Reject checkout with an invalid email** — Magento *does* validate (`#customer-email` gets
   `aria-invalid="true"` + class `mage-error`, stable; a `div.mage-error` renders), but asserting the
   transient `div.mage-error` is flaky under the KO.js re-render, and Serenity's `:visible` pseudo
   misbehaves. A robust fix: assert `CheckoutPage.emailFieldInvalid` (`#customer-email.mage-error`) — the
   stable signal — added but not yet wired into the shared step.
2. **Reject checkout with missing shipping details** — clicking "Next" with only an email and an empty
   address surfaces **no validation message at all** (no `div.mage-error`, no `aria-invalid`); Magento
   simply declines to advance. The scenario's "I should see a validation message" expectation does not
   match this Magento version. Options: change the scenario (assert non-advancement only, which already
   passes), make `incomplete()` trigger real field validation (e.g. submit a touched-then-emptied field),
   or drop the message assertion for this case. **Spec decision required.**

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

#### Item #11: Make the `@placesOrder` end-to-end checkout suite pass — Score: 16 — ✅ DONE 2026-06-05

**Priority Score:** Breakage Probability (6) + Portfolio Impact (7) + Maintenance Burden (3) = **16 points**
**Impact:** The two order-placing scenarios (`@placesOrder`) had never been executed — the multi-step
Knockout.js checkout (shipping address → shipping method → payment → confirmation) was only ever validated by
reasoning. This is the headline end-to-end proof of the suite.
**Effort:** ~2 hours (diagnosed against the live Docker store)
**Status:** ✅ DONE & validated 2026-06-05 — **4/4 scenarios, 40/40 steps green** (`BASE_URL=http://localhost:8080
npx cucumber-js --profile default --tags "@placesOrder"`); read-only smoke still 7/7; `npx tsc --noEmit` clean.
**Area:** Implementation

**Problem / findings (all diagnosed with throwaway Playwright probes against the live Luma DOM, then deleted):**
1. **Payment radio is hidden by design.** Luma renders `input[value="checkmo"]` as a zero-size, `display:none`
   input (`offsetParent` null) and overlays a styled label, so the radio is *never* `isVisible()` — the task
   timed out waiting for it. With a single payment method Magento auto-selects checkmo. Same class of issue as
   Item #10's invalid-email field: act on what Magento keeps visible.
2. **Order-number selector matched nothing.** The success page renders `<p>Your order # is: <span>…</span></p>`
   — there is no `.order-number` element.
3. **The success page has no order-totals block at all.** The old `orderSubtotal` success-page selector was
   unsatisfiable. Luma exposes totals only in the checkout Order Summary sidebar
   (`.opc-block-summary .table-totals`), which is Knockout-rendered and appears only *after* a shipping method
   is chosen (not at the shipping-address step).

**Resolution:**
1. Act on the visible `label[for="checkmo"]` (`CheckoutPage.checkMoneyOrderLabel`); `Wait.upTo(15 s)` for the
   AJAX-rendered payment step (past Serenity's 5 s default).
2. `CheckoutPage.orderNumber` → `.checkout-success p span`.
3. **Spec decision (user, 2026-06-05): verify the subtotal on the checkout Order Summary.** New
   `CheckoutPage.orderSummarySubtotal` (`.opc-block-summary .table-totals .totals.sub .price`), new
   `OrderSummary` question, new step `the order summary subtotal should be "…"`. The "Order multiple
   quantities" outline was rewritten into explicit steps that assert the subtotal at the **payment step**,
   before placing the order. `OrderConfirmation` slimmed to `orderNumber` only.
4. `PlaceTheOrder` confirmation wait hardened to `upTo(20 s)` (AJAX submit + redirect exceeds 5 s default).

**Success Criteria:**
- [x] Both `@placesOrder` scenarios place a real order and reach the confirmation page on the Docker store
- [x] Quantity outline verifies the subtotal (45/90/135) at a real Magento surface
- [x] Read-only smoke unaffected (still 7/7); `tsc` clean

**Follow-up:** `CompleteCheckout` task + the "I complete checkout with valid details" step are now unused (the
outline uses explicit steps) — left as a reusable composite; candidate to prune.

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
**Status:** ✅ DONE & validated 2026-06-06 — Background is API-driven; smoke 7/7 (43/43) and `@placesOrder` 4/4 (40/40) green with the API precondition exercised in every scenario; `tsc` clean.
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
- [x] Background steps call the Magento REST API, not the UI
- [x] `MAGENTO_ADMIN_TOKEN` documented in README and CI env vars
- [x] ADR-0003 updated with the concrete endpoint and response shape

**Outcome (2026-06-06):** `MagentoApiClient` now authenticates (resolves an admin bearer token once
per run — prefers `MAGENTO_ADMIN_TOKEN`, else mints one from `MAGENTO_ADMIN_USERNAME`/`PASSWORD`) and
`verifyProductIsAvailable(name, price)` queries `/rest/V1/products` (camelCase `searchCriteria`
filter), asserting HTTP 200, `total_count > 0`, the matched name, and the price. The Background step
`background.steps.ts` calls it instead of navigating the UI; the actor gains the `CallAnApi` ability
in `browser.hooks.ts`. A real Magento 2.4.x blocker was found and documented: mandatory admin 2FA
blocks the token endpoint until disabled on the test target (runbook step 6c +
`docs/admin-api-token-guide.md`). Verified green: smoke 7/7, `@placesOrder` 4/4, `tsc` clean.

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
**Impact:** ADRs need concrete before/after code examples so a reviewer sees the proof, not just the reasoning.
**Effort:** 2–3 hours
**Status:** ✅ DONE (2026-06-02)
**Area:** Documentation

**Resolution Strategy:**
1. **ADR-0001** — Add a side-by-side `PageObject` vs Screenplay example using `ProceedToCheckout` as the subject
2. **ADR-0002** — Pin the Serenity/JS version (3.43.2) and add a link to the living-documentation URL once published
3. **ADR-0003** — Link to `src/api/MagentoApiClient.ts`; list the REST V1 endpoints used in the Background steps
4. **ADR-0004** — Note the Playwright version (1.60.0); add a code snippet showing `Wait.until(element, isVisible())` vs a hypothetical Cypress `cy.wait(2000)` anti-pattern

**Success Criteria:**
- [x] All four ADRs have at least one concrete code example
- [x] No "Skeleton" markers remaining in any ADR

**Outcome (2026-06-02):** Verified all four ADRs already carry concrete examples (0001 Page-Object-vs-Screenplay,
0002 crew/hook wiring + version pin, 0003 REST V1 endpoints + indexer/cache, 0004 KO.js wait vs `cy.wait` anti-pattern)
with no skeleton markers. The one genuine fix: **ADR-0002's hook example and note were corrected** — they showed the
per-`Before` browser launch that backlog #8 proved defective, and asserted it was canonical. Now they show the
launch-once `BeforeAll`/`Before`/`AfterAll` pattern and reference the defect record.

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
**Effort:** 30 minutes
**Status:** ✅ DONE (2026-06-02) — unblocked early; the smoke command needs no live target
**Area:** Documentation

**Resolution Strategy:**
1. Replace the placeholder with the confirmed `BASE_URL`, install steps, and run commands
2. Add `HEADLESS`, `MAGENTO_ADMIN_TOKEN` env var documentation
3. Add link to the published Serenity BDD report (once Item #4 is done)

**Outcome (2026-06-02):** README "Running the suite" placeholder replaced with two documented paths —
the live read-only smoke (`BASE_URL=https://magento2-demo.magebit.com npm run test:smoke`, with the
tag-scoping safety warning and a Windows PowerShell note) and the Docker full-suite path. Added
`npx playwright install chromium` step and a "Continuous integration" section. Added a `test:smoke`
npm script. "Status" section updated to reflect the validated live methodology. Forward-referenced
items remain: `MAGENTO_ADMIN_TOKEN` (with #3) and the published report link (with #4).

---

## Resolved Items

#### Phase 1–3 implementation ✅ Resolved 2026-06-02

**Resolution:** Repository established from bundle; author email rewritten to noreply; pushed to GitHub. Serenity/JS project initialised. Full Screenplay layer (interactions, tasks, questions, hooks, step definitions) implemented. TypeScript compiles clean.
**See:** Commit `9e3f8e6` — `Implement Screenplay layer: interactions, tasks, questions and step definitions`

---

## Summary

| Priority | Count | Status |
|---|---|---|
| HIGH (20–30) | 4 | #1 ready to start; #2 blocked on #1; #8 ✅ done; #9 ✅ done |
| MEDIUM (10–19) | 4 | #3, #4 blocked on #1; #5 ✅ done; #10 code done & validated, full validation Docker-gated |
| LOW (0–9) | 2 | #6 ✅ done; #7 ✅ done |
| **Outstanding (not fully done)** | **#1, #2, #3, #4, #10** | Most gated on the Docker target (#1) |
| Done this work | #5, #6, #7, #8, #9 (+#10 code) | 2026-06-02 |
| Resolved (phases 1–3) | 1 | ~20 hrs completed |

---

## Portfolio Credibility Checklist

| Item | Status | Backlog ref |
|---|---|---|
| Commit history shows specs before implementation | ✅ Done | — |
| ADRs complete with concrete examples | ✅ Done | Item #5 |
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
