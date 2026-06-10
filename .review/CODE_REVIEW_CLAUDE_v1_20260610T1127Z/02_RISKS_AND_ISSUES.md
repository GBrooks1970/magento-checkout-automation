# Risks and Issues

[<- Back to Index](00_CODE_REVIEW_CLAUDE_v1_20260610T1127Z.md) | [Next: Project Reviews ->](03_PROJECT_REVIEWS/PROJECT_001_Test_Automation_Suite.md)

**Reviewer:** AI assistant (CLAUDE Fable 5)

Findings are numbered high to low priority. Severity reflects impact on the repo's stated purpose (a reviewable portfolio proving senior automation judgement), not production risk.

---

## R-01 (HIGH): Documentation set contradicts the canonical project state across at least seven files

**Risk description:** [backlog.md](docs/backlog.md) is the accurate, current record (all 11 items done, payment-failure active, 12/12 green). Almost every other narrative document still describes the 2026-06-02 state, including superseded architecture and one actively defective pattern. A reviewer cross-reading docs against code will find contradictions within minutes.

**Evidence outline:**

- [docs/screenplay-guide.md](docs/screenplay-guide.md) (lines 23-35): the "Actor Lifecycle" code sample launches the browser in `Before` and closes it in `After` - the exact lifecycle defect backlog #8 diagnosed ("only the first scenario per process passed") and that [browser.hooks.ts](src/hooks/browser.hooks.ts) (lines 20-25) now carries a do-not-revert warning against. Lines 53-64 say `CallAnApi` is a "Stub - Background steps use UI fallback" (implemented 2026-06-06); lines 113-114 document an `OrderConfirmation.subtotal()` question that does not exist; lines 127-132 repeat the per-scenario launch/close claim.
- [docs/architecture.md](docs/architecture.md): line 36 "browser lifecycle per scenario"; line 37 "API client ... stub"; lines 103-104 "CI skeleton - pending live target decision" and "Docker skeleton"; line 60 payment-failure "@deferred - requires Docker + test gateway"; section 6 lists five "known issues" that are all resolved.
- [docs/qa-strategy.md](docs/qa-strategy.md): line 24 payment-failure "Excluded until Docker CI"; line 39 "Once CI is configured"; lines 91-111 a CI recipe referencing a `magento` container name that has never existed in the compose file; section 7 lists six "open improvements", all completed.
- [features/_manifest.md](features/_manifest.md) (line 30): payment-failure "Tagged `@deferred`, excluded from CI" - the tag was removed and the scenario runs in CI.
- [README.md](README.md) (lines 155-163): the Status section says "The one remaining backlog item is activating the `@deferred` payment-failure scenario" and quotes 7/7 + 4/4 figures (now 12/12, 94/94).
- [docs/adr/README.md](docs/adr/README.md) (lines 18-23): the ADR index lists 0001-0004 only; [0005-deterministic-payment-failure.md](docs/adr/0005-deterministic-payment-failure.md) is missing.
- [docs/docker-magento-setup.md](docs/docker-magento-setup.md) (lines 144-157): "Still open" lists CI auth keys, CI runtime, and the test-isolation defect - all closed.

**Impact analysis:** The repository's explicit audience is a hiring manager or technical lead "assessing automation-architect capability" ([README.md](README.md) (lines 10-13)). Stale docs read as carelessness; the screenplay guide is worse than stale - it teaches a mid-level engineer (its stated audience) a pattern the repo itself proved broken. Documentation consistency is a credibility-checklist-grade concern for this project.

**Refactor recommendation and strategy:** A single docs-reconciliation pass (docs-only changes may be pushed directly to `main` per the project's working norms). Priority order: screenplay-guide.md Actor Lifecycle + Abilities + Hooks sections (copy the corrected pattern from ADR-0002 lines 56-75); README Status section; architecture.md sections 2, 3, 5, 6 plus a version bump; qa-strategy.md inventory, gates, recipes, open improvements; _manifest.md CI column; adr/README.md index row for 0005. Then add a lightweight working norm: any PR that flips a backlog item re-greps the docs for that item's claims.

---

## R-02 (HIGH): A fresh clone cannot run green by following the documentation

**Risk description:** Two compounding gaps mean the documented local paths fail. (a) The default `BASE_URL` targets a public sandbox known dead since 2026-06-02. (b) The local Docker runbook installs a store *without* the Portfolio_DeclinePayment module, while the default profile now includes `payment-failure.feature`, which requires it.

**Evidence outline:**

- [src/serenity.config.ts](src/serenity.config.ts) (line 5): `BASE_URL = process.env.BASE_URL ?? 'https://magento.softwaretestingboard.com'` - the target [backlog.md](docs/backlog.md) (lines 33-34) records as returning SSL error 526. With it unset, the run dies in `BeforeAll` inside `MagentoApi.authenticate()` with a raw fetch error before any scenario starts.
- [docs/docker-magento-setup.md](docs/docker-magento-setup.md) (lines 59-131): the validated local bring-up sequence (steps 1-7) contains no step copying `app/code/Portfolio/DeclinePayment` into the store or running `module:enable` - that exists only in [bake.yml](.github/workflows/bake.yml) (lines 134-144). Step 7 (line 130) then tells the user to run `npm test`, whose default profile now includes the decline scenario; `label[for="declinepayment"]` will never appear and `ProvidePaymentDetails.declined()` ([ProvidePaymentDetails.ts](src/tasks/ProvidePaymentDetails.ts) (lines 18-22)) will time out.
- [README.md](README.md) (lines 101-114): the "Full suite" path (`docker compose up -d --wait` + `npm test`) has the same gap, and never mentions the simpler alternative of pulling the pre-baked public GHCR images locally via the existing [docker-compose.ci.yml](docker-compose.ci.yml) overlay.
- Also stale: [README.md](README.md) (line 92) recommends `BASE_URL=https://magento2-demo.magebit.com npm run test:smoke`, but the Background is now API-driven and needs an admin token for that store, which a public demo will not honour with the default credentials - the documented smoke path against Magebit will fail at `BeforeAll`.

**Impact analysis:** "Clone, follow the README, watch it pass" is the first thing a sceptical reviewer tries. Both documented paths fail - one with a confusing network error, one mid-suite. The CI badge proves the suite works, but local reproducibility is part of the portfolio claim.

**Refactor recommendation and strategy:** (1) Change the default `BASE_URL` to `http://localhost:8080`, or remove the default and fail fast with a clear message naming the env var. (2) Add a runbook step 6e installing the module locally (copy + `module:enable` + `setup:upgrade` + `config:set payment/declinepayment/active 1`), mirroring bake.yml. (3) Document the pull-based local path: `docker compose -f docker-compose.yml -f docker-compose.ci.yml up -d --wait` against the public GHCR images - it is strictly easier than the install path and already exists in-repo. (4) Re-validate or remove the Magebit smoke recommendation now that Backgrounds require admin API access.

---

## R-03 (MEDIUM): "API setup, UI assertion" is overclaimed - cart seeding is UI-driven

**Risk description:** The pattern ADR-0003 calls "the highest-value pattern the portfolio demonstrates" is implemented only for product verification. The Background step `I have {string} in my cart with quantity {int}` seeds the cart by navigating the product page and clicking Add to Cart.

**Evidence outline:**

- [background.steps.ts](src/step-definitions/background.steps.ts) (lines 25-29): the cart-seeding Given delegates to `AddToCart.productWithQuantity(...)`, a UI task ([AddToCart.ts](src/tasks/AddToCart.ts) (lines 20-27): Navigate, Clear, Enter, Click, Wait).
- [docs/adr/0003-api-driven-test-data-setup.md](docs/adr/0003-api-driven-test-data-setup.md) (lines 17-19): "The API ability resolves the Background steps (product availability, guest context, pre-seeded cart)" - the pre-seeded-cart claim is not true of the implementation.
- [docs/gherkin-style-guide.md](docs/gherkin-style-guide.md) (lines 21-23): "a pre-seeded cart are arranged in the Background and resolved through the API ability, never by clicking through the UI."
- Magento's REST API supports guest carts (`POST /rest/V1/guest-carts`, `POST /rest/V1/guest-carts/{cartId}/items`), so an API implementation is feasible, with the known complication of binding the API-created quote to the browser session.

**Impact analysis:** Three scenarios (cart update, cart remove, both validation scenarios, payment failure) spend their Background in the UI doing exactly what the docs say the suite never does. A careful reviewer will notice. The UI seeding is also the slower and more flake-exposed path - the add-to-cart success-message wait exists precisely because this step runs so often.

**Refactor recommendation and strategy:** Either implement API cart seeding (guest-cart endpoints, then inject the masked quote ID into the session - a genuinely instructive piece of Magento knowledge) or - cheaper and honest - re-scope the claim: amend ADR-0003 and the style guide to state that product preconditions are API-verified while cart seeding deliberately reuses the tested `AddToCart` journey, and name the trade-off. Either resolution is defensible; the current mismatch is not.

---

## R-04 (MEDIUM): Dependency declarations contradict the ADRs and hide a phantom dependency

**Risk description:** ADRs claim pinned versions; the manifest uses wide caret ranges; and the suite imports a package it never declares.

**Evidence outline:**

- [package.json](package.json) (lines 14-26): `@serenity-js/*: ^3.0.0`, `@playwright/test: ^1.40.0`, `@cucumber/cucumber: ^11.0.0`.
- [docs/adr/0002-use-serenity-js.md](docs/adr/0002-use-serenity-js.md) (line 36): "Installed version: @serenity-js/* 3.43.2 (all packages pinned to the same minor)". [docs/adr/0004-playwright-over-cypress.md](docs/adr/0004-playwright-over-cypress.md) (line 33): "Installed version: @playwright/test 1.60.0, playwright (peer) 1.60.0".
- [browser.hooks.ts](src/hooks/browser.hooks.ts) (lines 5-6): `import { chromium } from 'playwright'` - `playwright` is not in package.json; it resolves only because `@playwright/test` depends on it (a phantom/transitive dependency).
- The per-scenario isolation strategy ([browser.hooks.ts](src/hooks/browser.hooks.ts) (lines 44-47)) explicitly depends on observed Serenity/JS v3 behaviour ("reuses a SINGLE Playwright browser context ... with this `using(browser)` wiring"). A caret-range `npm install` on a fresh machine may pull a later minor where that observation no longer holds, silently reintroducing the cart-leak defect of backlog #10.

**Impact analysis:** `package-lock.json` protects `npm ci` (CI is safe), but any non-`ci` install, dependency bump, or fork floats versions that load-bearing behaviour was only validated against. The ADR/manifest mismatch also reads as a factual error during doc review.

**Refactor recommendation and strategy:** Pin exact versions (or at least `~` ranges) for `@serenity-js/*`, `@cucumber/cucumber`, and `@playwright/test`; add `playwright` as an explicit devDependency at the same version as `@playwright/test`; reconcile the ADR version statements with the manifest. Optionally add a cheap guard assertion in `Before` (cart counter empty / no cookies) so an isolation regression fails loudly at the first scenario rather than as a count mismatch three scenarios later.

---

## R-05 (MEDIUM): The decline-message selector is page-global and the gateway command is decorative

**Risk description:** Two related sharp edges in the payment-failure path. (a) `paymentErrorMessage` is bare `.message-error`, which matches *any* error banner anywhere on the page, not specifically the decline. (b) The module wires `DeclineCommand` into the gateway command pool, but the recorded behaviour is that placement never invokes it - the observer does all the work - so the command is live-looking dead code.

**Evidence outline:**

- [CheckoutPage.ts](src/interactions/CheckoutPage.ts) (lines 58-65): `paymentErrorMessage: PageElement.located(By.css('.message-error'))`. The comment records that at probe time it was "the only `.message-error` present", which is true today but unscoped: a session-expiry, stock, or totals error would also satisfy the wait in `PlaceTheOrder.attemptExpectingDecline()` ([PlaceTheOrder.ts](src/tasks/PlaceTheOrder.ts) (line 25)). The text assertion `includes('declined')` ([checkout.steps.ts](src/step-definitions/checkout.steps.ts) (line 110)) partially mitigates, but the *wait* can be satisfied by the wrong message and produce a confusing text-mismatch failure.
- [di.xml](app/code/Portfolio/DeclinePayment/etc/di.xml) (lines 45-52) maps `authorize` and `sale` to `DeclineCommand`; [events.xml](app/code/Portfolio/DeclinePayment/etc/events.xml) (lines 2-8) and [ADR-0005](docs/adr/0005-deterministic-payment-failure.md) (lines 54-58) record that "offline-style order placement never invoked its `authorize` command - the order *succeeded*", which is why the observer exists. [DeclineCommand.php](app/code/Portfolio/DeclinePayment/Gateway/Command/DeclineCommand.php) therefore never executes at runtime.

**Impact analysis:** (a) is a latent diagnostic trap: a future unrelated checkout error turns the decline scenario's failure into "expected text 'declined'" instead of "decline message never appeared". (b) is a comprehension trap: a reader of the module alone reasonably concludes the command is the decline mechanism; only ADR-0005 corrects them.

**Refactor recommendation and strategy:** Scope the selector to the checkout messages region (e.g. `.page.messages .message-error` or the OPC wrapper) and re-validate by probe. For the command: either keep it with a comment in `di.xml`/`DeclineCommand.php` stating plainly "retained as gateway-contract completeness; runtime decline is the observer - see events.xml", or remove the command pool mapping and let the adapter carry only the value handler. The first option is fine; the current silence is not.

---

## R-06 (MEDIUM): CI supply-chain and reproducibility edges - mutable image tag, single-image preflight, hardcoded owner

**Risk description:** The bake-once/pull-many design is sound, but three details weaken it: the `:2.4.8` tag is overwritten in place by any re-bake; preflight checks only the app image; and the GHCR namespace is hardcoded, making forks and the repo's own portability brittle.

**Evidence outline:**

- [bake.yml](.github/workflows/bake.yml) (lines 246-250, 260-264) pushes to the same `:2.4.8` tag every run; [docs/docker-magento-setup.md](docs/docker-magento-setup.md) (line 218) confirms "The `:2.4.8` tag is intentionally static". A bad re-bake (the empty-dump incident already happened once - backlog #4 update, bug 4) silently changes what every subsequent CI run tests. The in-bake guards reduce but do not eliminate this class.
- [ci.yml](.github/workflows/ci.yml) (lines 63-67): preflight inspects only `magento-store-app`, with a comment asserting the two images "are always built and pushed together" - yet the recorded incident is exactly a run where store-app was good and store-db was a useless 4 K image.
- `ghcr.io/gbrooks1970/...` is hardcoded in [ci.yml](.github/workflows/ci.yml) (lines 65, 109-110), [bake.yml](.github/workflows/bake.yml) (lines 247-264), and [docker-compose.ci.yml](docker-compose.ci.yml) (lines 31-34) rather than derived from `github.repository_owner`.
- Minor: the warm-up step ([ci.yml](.github/workflows/ci.yml) (lines 141-151)) echoes HTTP codes but does not fail on non-200, so a half-up store proceeds to the suite and fails later with a less specific signal.

**Impact analysis:** Day-to-day risk is low (re-bakes are rare and guarded), but the failure mode is the bad kind: silent, retroactive, and affecting `main`'s badge. The hardcoded owner blocks the most natural portfolio action - someone forking the repo to try it.

**Refactor recommendation and strategy:** Tag bakes uniquely (`:2.4.8-<run_number>` or date) and update the overlay by PR, or pin the overlay to the image digest after each validated bake. Extend preflight to `docker manifest inspect` both images. Parameterise the registry path via `${{ github.repository_owner }}` in workflows and an env-substituted overlay. Add `-f` / a code check to the warm-up curl loop.

---

## R-07 (LOW): Dead code and stale internal references dilute an otherwise tight codebase

**Risk description:** Several Screenplay artifacts are unused, and two documents reference them as if live.

**Evidence outline:**

- [CompleteCheckout.ts](src/tasks/CompleteCheckout.ts) and its step `I complete checkout with valid details` ([checkout.steps.ts](src/step-definitions/checkout.steps.ts) (lines 58-63)) are used by no feature file (the quantity outline was rewritten into explicit steps - backlog #11 follow-up note says "candidate to prune"). [docs/gherkin-style-guide.md](docs/gherkin-style-guide.md) (lines 34-40) still instructs writers to use this composite step "in the quantity Scenario Outline" - guidance that contradicts the current feature file. [ADR-0001](docs/adr/0001-use-screenplay-over-page-objects.md) (lines 59-78) also uses it as the flagship example.
- Unused Questions: [OrderConfirmation.ts](src/questions/OrderConfirmation.ts) (steps assert via `CheckoutPage.orderNumber` + `isVisible()` directly); [ValidationMessage.ts](src/questions/ValidationMessage.ts) (validation steps use `Attribute.called('aria-invalid')` instead).
- Unused PageElements: [CheckoutPage.ts](src/interactions/CheckoutPage.ts) `checkMoneyOrderOption` (line 42), `firstValidationMessage` (line 108, reachable only via the unused Question), `emailFieldInvalid` (line 112); [CartPage.ts](src/interactions/CartPage.ts) `itemRows` (line 24); [StorefrontPage.ts](src/interactions/StorefrontPage.ts) `cartCounter` (line 22, duplicate of `CartPage.itemCounter`).
- Stale comment: [AddToCart.ts](src/tasks/AddToCart.ts) (line 7) cites "Cucumber `setDefaultTimeout(30 s)`" - it has been 60 s since PR #4 ([browser.hooks.ts](src/hooks/browser.hooks.ts) (line 16)).

**Impact analysis:** Individually trivial; collectively they blur the repo's strongest property - that everything present earns its place. In a portfolio, unused exemplary-looking code (an entire composite Task) invites "do they prune?" questions.

**Refactor recommendation and strategy:** One small cleanup PR: delete the unused Questions and PageElements; either delete `CompleteCheckout` + step or restore a feature usage for it and keep the style-guide paragraph truthful - if deleted, update [gherkin-style-guide.md](docs/gherkin-style-guide.md) (lines 34-40) and consider re-pointing ADR-0001's example at a live Task; fix the 30 s comment. `npx tsc --noEmit` and a dry-run gate the change.

---

## R-08 (LOW): Assertion-side mutations and step duplication in cart steps

**Risk description:** Then-steps that mutate state, and twin step definitions, are small pattern wobbles in otherwise clean glue.

**Evidence outline:**

- [cart.steps.ts](src/step-definitions/cart.steps.ts) (lines 26-44): `my cart should contain {int} item(s)` performs `Navigate.reloadPage()` before polling. The reload is a justified, well-documented workaround for the customer-data section race (PR #6), but it means the assertion observes a state the user journey did not produce on its own - if the counter is genuinely broken until reload, the suite still passes. Lines 38-44 define the same behaviour twice (`item` / `items`) where one Cucumber expression (`{int} item(s)` or a regex) would do.
- [cart.steps.ts](src/step-definitions/cart.steps.ts) (lines 46-54): the subtotal Then also navigates (cart page) before asserting - same pattern, same documented justification.

**Impact analysis:** Low. The trade-off is consciously taken and recorded; the residual risk is masking a real product-side counter-refresh bug class, which for a portfolio test target is acceptable. The duplicate step is cosmetic.

**Refactor recommendation and strategy:** Keep the behaviour but consider asserting the pre-reload counter as a soft signal (log on mismatch) so product-side races remain visible; merge the two step definitions via `{int} item(s)`. Document in the QA strategy that count assertions are "settled state" assertions by design.

---

## R-09 (LOW): Hard-coded test credentials are pervasive but consistently flagged - accepted risk, one improvement

**Risk description:** `admin` / `Password123!` appear as code defaults, CI env values, and bake install args. For a disposable test target this is reasonable and every occurrence carries a test-target-only warning; the residual risk is the *code default* silently probing a non-test target.

**Evidence outline:**

- [MagentoApiClient.ts](src/api/MagentoApiClient.ts) (lines 51-52): credential defaults baked into source. [ci.yml](.github/workflows/ci.yml) (lines 158-160), [bake.yml](.github/workflows/bake.yml) (line 109), [README.md](README.md) (lines 123-124).
- Mitigations already present: [Dockerfile.store-app](Dockerfile.store-app) (lines 19-21) SECURITY NOTE; bake removes `auth.json` before export ([bake.yml](.github/workflows/bake.yml) (lines 204-208)); `auth.json` gitignored ([.gitignore](.gitignore) (line 30)); Marketplace keys confined to the `bake` environment.

**Impact analysis:** Low. The only sharp edge: if a user points `BASE_URL` at a non-disposable store, the suite will attempt to mint an admin token with well-known default credentials - harmless against a hardened store, but bad manners and possibly account-locking.

**Refactor recommendation and strategy:** Make the credential fallback conditional: default `admin`/`Password123!` only when `BASE_URL` resolves to localhost; otherwise require explicit env vars. One small `if` in `authenticate()` plus a README line.

---

## R-10 (LOW): Serenity report path and artifact lifecycle quirks

**Risk description:** Run artifacts write into `docs/reports/` (a gitignored docs subfolder) while the HTML renders to `target/site/serenity` - a two-location pipeline that works but is easy to misread, and the Pages deploy publishes even for failed runs by design.

**Evidence outline:**

- [serenity.config.ts](src/serenity.config.ts) (line 9): `ArtifactArchiver.storingArtifactsAt('./docs/reports')`; [ci.yml](.github/workflows/ci.yml) (lines 173-181): Pages artifact taken from `target/site/serenity` with a comment explaining the relay; [.gitignore](.gitignore) (lines 16-19).
- [ci.yml](.github/workflows/ci.yml) (lines 192-199): `deploy-pages` runs with `always()` on main so "a broken run produces a visible report" - intentional and commented, with the side effect that the published living documentation can show failures while the badge is red (coherent, but worth a README sentence so a reviewer who sees a red scenario in the report understands the policy).

**Impact analysis:** Low - cosmetic/communication. JSON artifacts accumulating in `docs/reports/` between local runs can also make `test:report` render stale scenarios into the HTML.

**Refactor recommendation and strategy:** Either move the archive path to `target/serenity-json` so all generated output lives under `target/`, or leave it and add one sentence to the README's CI section explaining both the relay and the publish-on-failure policy. Consider cleaning `docs/reports/*` at suite start locally (Serenity supports this via crew config or an npm prescript).

---

[<- Previous: Executive Summary](01_EXECUTIVE_SUMMARY.md) | [Back to Index](00_CODE_REVIEW_CLAUDE_v1_20260610T1127Z.md) | [Next: Project Reviews ->](03_PROJECT_REVIEWS/PROJECT_001_Test_Automation_Suite.md)
