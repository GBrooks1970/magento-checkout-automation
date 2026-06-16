# Risks and Issues

[<- Back to Index](00_CODE_REVIEW_CLAUDE_Opus_4_8_v1_20260616T1544Z.md) | [Next: Project Reviews ->](03_PROJECT_REVIEWS/PROJECT_001_Checkout_Automation_Suite.md)

**Reviewer:** AI assistant (CLAUDE_Opus_4_8)

Findings are numbered high to low priority. Severity reflects impact on the repo's stated purpose - a
reviewable portfolio proving senior automation judgement - not production risk. To avoid collision
with the prior review's `R-` numbering, this round uses the `C-` prefix.

> **Context.** A prior comprehensive review (`CODE_REVIEW_CLAUDE_v1_20260610T1127Z`, CLAUDE Fable 5)
> raised R-01..R-10; all are closed and annotated, and this pass independently confirms the fixes in
> code. The findings below are new or residual and are smaller in magnitude. No HIGH-severity issue
> was found in this round.

---

## C-01 (MEDIUM): The documented `smoke` subset is mis-described - 8 scenarios, not 7, and it now includes the decline scenario

**Risk description:** Two user-facing documents describe the `smoke` profile as "the 7 read-only
scenarios ... safe against shared, non-resettable stores". The profile's actual tag expression is
`not @deferred and not @placesOrder`, which selects **8** scenarios, and one of them -
`payment-failure.feature` - is neither read-only (it submits a quote for placement, which the
always-decline observer aborts) nor independent of the in-repo `Portfolio_DeclinePayment` module. So
the count is wrong and the "read-only / safe against shared stores" rationale no longer holds for the
set the profile actually runs.

**Evidence outline:**

- [cucumber.js](../../cucumber.js) (lines 35-39): the `smoke` profile is `tags: 'not @deferred and not @placesOrder'`.
- [features/payment-failure.feature](../../features/payment-failure.feature) (lines 8-26): the scenario carries
  **no** `@placesOrder` and **no** `@deferred` tag, so it is included in `smoke`. Its `When I attempt
  to place the order` step ([src/step-definitions/checkout.steps.ts](../../src/step-definitions/checkout.steps.ts)
  lines 86-90) clicks Place Order, which requires `label[for="declinepayment"]`
  ([src/tasks/ProvidePaymentDetails.ts](../../src/tasks/ProvidePaymentDetails.ts) lines 18-22) - present only on a
  store with the baked decline module.
- [README.md](../../README.md) (lines 106-109): "The `smoke` profile (`npm run test:smoke`) runs only the 7
  scenarios that neither place orders nor depend on the decline module".
- [docs/qa-strategy.md](../../docs/qa-strategy.md) (lines 28-29): "the `smoke` profile ... runs the 7 read-only
  scenarios - safe against shared, non-resettable stores."
- **Verified by command (this review):** `npx cucumber-js --profile smoke --dry-run` reports
  `Scenarios: 8` (1 guest-checkout + 4 cart-management + 2 checkout-validation + 1 payment-failure).
  `--profile default --dry-run` reports `Scenarios: 12`.

**Impact analysis:** A reviewer who runs the smoke profile against a public demo (which the docs once
recommended and the rationale still implies is safe) gets a confusing failure: the decline scenario
cannot find its module-specific label and times out. More importantly for a portfolio, a precise
count and a safety claim that are both falsifiable in thirty seconds undercut the "everything here is
accurate" impression the rest of the repo earns. The cart-management scenarios in the smoke set also
mutate cart state, so "read-only" was already a loose description even before the decline scenario
crept in.

**Refactor recommendation and strategy:** Decide what `smoke` should mean and make the docs and the
tag expression agree. Two clean options: (a) keep `smoke` genuinely read-only/shared-store-safe by
tightening the expression to also exclude the decline scenario - e.g. add `@usesDeclineModule` (or
reuse a `@placesOrder`-style tag) to `payment-failure.feature` and set `smoke` to
`not @deferred and not @placesOrder and not @usesDeclineModule`, then state the real count; or
(b) accept that `smoke` is now "the non-order-placing subset against the local baked store" and
rewrite both doc sentences to say 8 scenarios and drop the "read-only / shared store" framing. Either
way, re-derive the number from a dry-run rather than hard-coding it, and add the dry-run count check
to the docs-reconciliation norm the prior review introduced.

---

## C-02 (LOW): The backlog's metadata header and Summary table have drifted from its own body

**Risk description:** [docs/backlog.md](../../docs/backlog.md) is the project's canonical source of truth, and the
prompts and prior review lean on it heavily. Its front-matter and roll-up table no longer match the
body, which records progress through 2026-06-11.

**Evidence outline:**

- [docs/backlog.md](../../docs/backlog.md) (lines 3-5): "Version: 1 - Initial backlog from phases 1-3 / Last
  Updated: 2026-06-02 / Based on: Session notes v2" - yet the body contains dated updates up to
  2026-06-11 (e.g. line 367 "Update (2026-06-11) - cart seeding is now API-driven too").
- [docs/backlog.md](../../docs/backlog.md) (lines 549-555): the Summary table says "HIGH (20-30): 4" and lists
  "#1, #2, #8, #9", but Item #2 is scored 21 (HIGH) and Items #10 (18) and #11 (16) are MEDIUM by the
  document's own banding - the HIGH/MEDIUM grouping in the table does not line up with the per-item
  scores, and the table omits #3/#10/#11 from any band line while still totalling them.
- The "Last Updated" and "Version" never advanced even though the backlog was the instrument that
  tracked R-01..R-10 to closure.

**Impact analysis:** Low and purely documentary, but this is the one file the whole portfolio
toolchain treats as authoritative; a stale "Last Updated: 2026-06-02" on the source of truth is
exactly the kind of small tell a careful reviewer notices, and the prior round's flagship finding
(R-01) was documentation drift. Keeping the canonical file's own header honest matters more than for
an ordinary doc.

**Refactor recommendation and strategy:** Bump the header (`Version`, `Last Updated`, `Based on`) to
reflect the latest reconciliation, and either correct the Summary table's band groupings to match the
per-item scores or replace it with a simple "all items closed" statement plus the credibility
checklist that already follows. Docs-only change; no code gate needed beyond a link re-check.

---

## C-03 (LOW): The Docker `app` service waits only for `phpfpm` to *start*, and `phpfpm` has no healthcheck

**Risk description:** In the base compose, the nginx `app` service declares
`depends_on: phpfpm: condition: service_started`, but the `phpfpm` service defines no healthcheck. So
`docker compose up --wait` has nothing to gate php-fpm readiness on; bring-up correctness depends
entirely on nginx's own curl healthcheck retrying until php-fpm happens to be ready.

**Evidence outline:**

- [docker-compose.yml](../../docker-compose.yml) (lines 41-43): `app` -> `depends_on: phpfpm: condition: service_started`.
- [docker-compose.yml](../../docker-compose.yml) (lines 45-62): the `phpfpm` service has `depends_on` (db/redis/
  opensearch/rabbitmq) but no `healthcheck` block, so `--wait` treats it as ready the instant the
  container process starts, not when php-fpm can serve.
- This is masked today because `app`'s healthcheck (lines 36-40) curls `127.0.0.1:8000` and retries
  6x5s, which usually outlasts php-fpm warm-up - but it is an implicit dependency, not an asserted one.

**Impact analysis:** Low in practice - CI is green and the nginx healthcheck provides a backstop - but
on a slow or loaded runner the app healthcheck's 30s budget (6 retries x 5s, no `start_period`) could
expire before php-fpm answers, producing an "app is unhealthy" bring-up failure with a misleading
signal (nginx blamed for a php-fpm warm-up race). For a portfolio that elsewhere models careful
lifecycle reasoning, the looser link here is worth tightening.

**Refactor recommendation and strategy:** Add a lightweight `healthcheck` to `phpfpm` (e.g.
`cgi-fcgi`/`php-fpm -t`, or a TCP/socket probe of the fpm listener) and change `app`'s dependency to
`condition: service_healthy`; or, more cheaply, add a `start_period` to the `app` healthcheck so its
retry budget comfortably covers php-fpm warm-up. Validate by a cold `docker compose up --wait`.

---

## C-04 (LOW): `DeclineCommand` remains wired into the gateway command pool but never executes (residual from R-05)

**Risk description:** The `Portfolio_DeclinePayment` module maps a `DeclineCommand` into the gateway
command pool, but the documented and as-built decline mechanism is the observer on
`sales_model_service_quote_submit_before`; offline-style placement never invokes the command. The
prior review (R-05) chose to **retain** the command with explanatory comments rather than remove it.
This is noted again only as a residual comprehension cost.

**Evidence outline:**

- [app/code/Portfolio/DeclinePayment/Observer/DeclineOrder.php](../../app/code/Portfolio/DeclinePayment/Observer/DeclineOrder.php)
  (lines 31-41): the observer throws the `LocalizedException` that actually declines the order.
- [app/code/Portfolio/DeclinePayment/Gateway/Command/DeclineCommand.php](../../app/code/Portfolio/DeclinePayment/Gateway/Command/DeclineCommand.php)
  and [etc/di.xml](../../app/code/Portfolio/DeclinePayment/etc/di.xml): the command is registered but,
  per ADR-0005 and the observer comment, is not reached at runtime.
- [docs/adr/0005-deterministic-payment-failure.md](../../docs/adr/0005-deterministic-payment-failure.md): records the
  rationale (the command is retained for gateway-contract completeness).

**Impact analysis:** Low. A reader of the module in isolation could still infer the command is the
decline path, but the observer's docblock and ADR-0005 now correct that promptly. The cost is the
small one of carrying a deliberately inert class.

**Refactor recommendation and strategy:** Accept as-is (the documentation now makes the intent
explicit), or, for maximum clarity, collapse the gateway to the value handler only and drop the
command-pool mapping, letting the observer stand alone. No action is required for portfolio
correctness; this is recorded for completeness and to confirm the prior decision still holds.

---

## C-05 (INFO): Positive confirmations worth recording

Not a defect - logged so the review is balanced and so the next maintainer knows what was checked and
found sound.

- **Dependency pins are honest.** [package.json](../../package.json) (lines 13-28) exact-pins every
  `@serenity-js/*` package, `@cucumber/cucumber`, `@playwright/test` and `playwright` to the versions
  the ADRs cite (3.43.2 / 11.3.0 / 1.60.0), and `playwright` is now an explicit devDependency - the
  prior R-04 phantom-dependency and caret-range concerns are fully resolved.
- **Localhost-gated credentials are implemented as recommended.**
  [src/api/MagentoApiClient.ts](../../src/api/MagentoApiClient.ts) (lines 43-83) refuses the `admin`/`Password123!`
  fallback against any non-localhost host - R-09 closed in code, not just in docs.
- **Immutable bake tags and derived GHCR owner are in place.** [.github/workflows/bake.yml](../../.github/workflows/bake.yml)
  (lines 45-46, 69-78) pushes unique `:2.4.8-b<run_number>` tags and derives the lowercased owner;
  [docker-compose.ci.yml](../../docker-compose.ci.yml) pins `:2.4.8-b24` and interpolates `${GHCR_OWNER}` -
  R-06b/R-06c closed.
- **The empty-report defect cannot silently recur.** The CI guard at
  [.github/workflows/ci.yml](../../.github/workflows/ci.yml) (lines 221-246) fails the run if `docs/reports/`
  has no non-empty Serenity JSON, and `cucumber.js` keeps the Serenity adapter as the sole stdout
  formatter ([cucumber.js](../../cucumber.js) lines 10-21).

---

[<- Previous: Executive Summary](01_EXECUTIVE_SUMMARY.md) | [Back to Index](00_CODE_REVIEW_CLAUDE_Opus_4_8_v1_20260616T1544Z.md) | [Next: Project Reviews ->](03_PROJECT_REVIEWS/PROJECT_001_Checkout_Automation_Suite.md)
