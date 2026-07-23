# Risks and Issues

[<- Back to Index](00_CODE_REVIEW_CODEX_v1_20260723T2335Z.md) | [Next: Project Review ->](03_PROJECT_REVIEWS/PROJECT_001_Checkout_Automation_Suite.md)

**Reviewer:** AI assistant (OpenAI Codex, GPT-5)
**Date:** 2026-07-23T23:35Z

Risks are ordered from highest to lowest. No HIGH-severity finding was identified.

## Risk 1 (MEDIUM): The disposable store's documented localhost boundary is not enforced by Docker

**Risk Description/Explanation**

The base Compose file publishes nginx as `8080:8000`, which binds on every host interface by
default. The baked store deliberately uses the public `admin` / `Password123!` credential pair
and disables both admin 2FA modules so the suite can mint admin tokens. This is acceptable inside
an isolated CI runner, but on a developer workstation it makes the test store reachable from the
local network while the documentation and credential guard reason about it as localhost-only.

The fixture safety defaults are also inconsistent: `Portfolio_CartSeed` defaults off, while the
always-declining payment method defaults active even though `bake.yml` already enables it
explicitly.

**Evidence Outline**

- [docker-compose.yml](docker-compose.yml) (line 29): `- "8080:8000"` does not restrict the host
  address to loopback.
- [bake.yml](.github/workflows/bake.yml) (lines 126-143): the store is installed with the known
  admin credentials.
- [bake.yml](.github/workflows/bake.yml) (lines 198-205): mandatory admin 2FA is disabled.
- [MagentoApiClient.ts](src/api/MagentoApiClient.ts) (lines 73-91): localhost targets receive the
  known default credentials and call the admin-token endpoint.
- [config.xml](app/code/Portfolio/DeclinePayment/etc/config.xml) (lines 5-15): the decline method
  defaults active.
- [config.xml](app/code/Portfolio/CartSeed/etc/config.xml) (lines 2-13): the higher-risk cart-adopt
  endpoint correctly demonstrates the safer default-off pattern.

**Impact Analysis**

- A machine on the same network can reach the disposable storefront while it is running and knows
  the admin credentials needed by the token endpoint.
- The target contains no valuable production data, so direct business impact is limited; however,
  an admin-capable test application is still an unnecessary exposed service and broadens the
  workstation attack surface.
- Installing the decline fixture outside the intended bake makes a fake payment method available
  without a separate activation decision.

**Refactor Recommendation and Strategy**

1. Bind the local port to loopback: `127.0.0.1:8080:8000`. Confirm this remains usable in GitHub
   Actions, where all calls originate on the runner host.
2. Default `payment/declinepayment/active` to `0`; keep the existing explicit activation in
   `bake.yml` and the local runbook.
3. Add a CI assertion over `docker compose config` that the published host IP is loopback and the
   two fixture flags in a baked test store are exactly as expected.
4. Keep the existing non-local credential refusal; it is a strong second line of defence.

---

## Risk 2 (MEDIUM): The smoke profile is non-ordering, not read-only

**Risk Description/Explanation**

The Cucumber comment and QA strategy call the seven-scenario smoke profile read-only and safe for
a shared or non-resettable storefront. In fact, every scenario adds to or mutates a guest cart,
and four smoke scenarios use `Given I have ...` to create a guest quote and add a quote item via
REST before binding it to the browser. Per-scenario cookie clearing isolates observations but does
not delete server-side quote records.

**Evidence Outline**

- [cucumber.js](cucumber.js) (lines 31-41): the profile is described as read-only and excludes only
  order placement and the decline module.
- [qa-strategy.md](docs/qa-strategy.md) (lines 26-30): the seven scenarios are stated to be safe
  against shared, non-resettable stores.
- [background.steps.ts](src/step-definitions/background.steps.ts) (lines 25-37): cart
  preconditions create and populate a guest cart before browser adoption.
- [MagentoApiClient.ts](src/api/MagentoApiClient.ts) (lines 143-175): both operations are HTTP
  `POST` requests; there is no teardown operation.
- [cart-management.feature](features/cart-management.feature) (lines 11-30) and
  [guest-checkout.feature](features/guest-checkout.feature) (lines 21-24): even scenarios without
  API seeding mutate a guest cart through the UI.

**Impact Analysis**

- Maintainers can point the profile at a shared store believing it is side-effect-free while it
  accumulates abandoned quotes.
- A non-resettable environment can slowly acquire test data and operational noise even though no
  orders are placed.
- The profile name itself is fine; the safety contract around it is inaccurate.

**Refactor Recommendation and Strategy**

1. Rename the contract to **non-ordering smoke** and document guest-cart writes and the requirement
   for a dedicated test target.
2. If a genuinely read-only public-store probe is wanted, add a small catalogue/navigation feature
   that performs no add-to-cart action and give it a separate tag/profile.
3. If shared-store cart coverage is required, add an authenticated quote-cleanup strategy and
   prove cleanup in an `After` hook without masking failed scenarios.

---

## Risk 3 (MEDIUM): The missing-details scenario can pass before an invalid transition occurs

**Risk Description/Explanation**

After clicking the shipping Next button with only an email filled, the scenario immediately
asserts that the payment section is not visible. Negative visibility is true both when validation
works and during the normal interval before any asynchronous transition completes. Unlike the
invalid-email scenario, the missing-details scenario has no positive validation oracle such as an
`aria-invalid` state or field-error count.

**Evidence Outline**

- [ProvideShippingDetails.ts](src/tasks/ProvideShippingDetails.ts) (lines 64-69): the incomplete
  task enters only the email and clicks Next, then returns without waiting for validation state.
- [validation.steps.ts](src/step-definitions/validation.steps.ts) (lines 21-27): non-advancement is
  an immediate `Ensure.that(..., not(isVisible()))`.
- [checkout-validation.feature](features/checkout-validation.feature) (lines 11-14): the scenario's
  sole Then step is the negative non-advancement check.
- [validation.steps.ts](src/step-definitions/validation.steps.ts) (lines 30-41): the invalid-email
  scenario demonstrates a stronger positive oracle by polling `aria-invalid="true"`.

**Impact Analysis**

- A regression that incorrectly advances after a delayed validation or network cycle can still
  pass because the assertion sampled too early.
- The suite's advertised negative-path coverage is weaker than its green result suggests.

**Refactor Recommendation and Strategy**

1. Assert a positive validation outcome on a required field, for example `aria-invalid="true"` on
   first name, last name, or street, using the existing engine-aware wait policy.
2. Retain non-advancement as a second assertion after the positive signal is observed.
3. Prefer a stable DOM/accessibility state over an arbitrary dwell time; do not replace this with a
   fixed sleep.

---

## Risk 4 (MEDIUM): The documented quarantine tag is not excluded by either profile

**Risk Description/Explanation**

The QA strategy instructs maintainers to tag a newly flaky scenario `@pending`. Cucumber treats
that as an ordinary tag unless the profile excludes it, but both profiles exclude only
`@deferred`. Following the documented process would therefore leave the flaky scenario running in
CI.

**Evidence Outline**

- [qa-strategy.md](docs/qa-strategy.md) (lines 46-51): the flake policy prescribes `@pending`.
- [cucumber.js](cucumber.js) (line 22): the common profile filter is `not @deferred`.
- [cucumber.js](cucumber.js) (lines 38-42): smoke also excludes `@deferred`, `@placesOrder`, and
  `@usesDeclineModule`, but not `@pending`.
- [payment-failure.feature](features/payment-failure.feature) (lines 1-6): the repository's actual
  successful quarantine history used `@deferred`.

**Impact Analysis**

- A maintainer can believe a flake is quarantined while required CI continues to execute it.
- Conflicting tag vocabulary weakens the otherwise strong quarantine teaching example.

**Refactor Recommendation and Strategy**

1. Choose one canonical quarantine tag. `@deferred` has working history and is already encoded in
   the profiles.
2. Update the QA strategy to use that tag, or explicitly add `and not @pending` to both profile
   policies.
3. Add a cheap profile-selection test that introduces tag fixtures or inspects `cucumber.js` so
   quarantine drift fails before an E2E run.

---

## Risk 5 (MEDIUM-LOW): Fast validation checks bindings, not the repository's policy logic

**Risk Description/Explanation**

`npm run verify` is a useful lightweight gate, but it performs TypeScript compilation and Cucumber
dry-runs only. It does not execute browser-engine resolution, wait selection, screenshot mode,
credential-host restrictions, trace cleanup, route recovery, API error paths, report-count shell
logic, or either PHP fixture module. All behavioural confidence comes from the heavyweight E2E
pipeline.

**Evidence Outline**

- [package.json](package.json) (lines 9-14): no unit/component test script exists.
- [wait-durations.ts](src/config/wait-durations.ts) (lines 21-66): pure policy code has multiple
  engine and invalid-input branches.
- [screenshots.ts](src/config/screenshots.ts) (lines 16-44): pure environment-policy code has three
  modes and an environment default.
- [browser.hooks.ts](src/hooks/browser.hooks.ts) (lines 175-213): trace finalisation has failure,
  success, video-present, and video-absent branches.
- [StabiliseCheckoutRoute.ts](src/interactions/StabiliseCheckoutRoute.ts) (lines 16-50): required
  and exploratory engines intentionally diverge.
- [package.json](package.json) (line 13): dry-run validation never starts a store or executes those
  runtime branches.

**Impact Analysis**

- A small policy regression needs the slowest feedback loop to be detected.
- WebKit failures make it harder to tell a fixture/policy unit defect from a browser/store defect.
- The repository teaches a top-heavy test pyramid despite being capable of extracting meaningful
  lower-layer tests.

**Refactor Recommendation and Strategy**

1. Add a small Vitest suite for environment parsing, wait tiers, screenshot mode, URL host safety,
   and slug generation.
2. Extract trace artifact retention and route-recovery decisions behind injectable functions so
   their branch rules can be tested without launching Magento.
3. Add focused PHP unit/integration coverage for fixture activation and decline/adopt behaviour, or
   at minimum a bake-time Magento integration smoke for both module contracts.
4. Extend `npm run verify` to include the fast TypeScript tests.

---

## Risk 6 (MEDIUM-LOW): Pages deployment currency and supply-chain immutability rely on convention

**Risk Description/Explanation**

The E2E workflow has no concurrency policy. GitHub Actions permits concurrent workflow runs by
default, so two long `main` runs can reach the single Pages environment in a different order from
their commits. Inference: without a deployment concurrency group, an older report can be deployed
after a newer one.

Actions and container bases are also pinned to mutable major/version tags rather than commit SHAs
or image digests. The bake summary records digests, but `docker-compose.ci.yml` enforces only
unique-looking tags, whose immutability remains a maintainer convention rather than a registry
property.

**Evidence Outline**

- [ci.yml](.github/workflows/ci.yml) (lines 54-64): multiple triggers exist and there is no
  workflow-level `concurrency` block.
- [ci.yml](.github/workflows/ci.yml) (lines 390-412): `deploy-pages` targets the single
  `github-pages` environment without job-level concurrency.
- [ci.yml](.github/workflows/ci.yml) (lines 189-210, 365-380, 409-412): actions use mutable major
  tags such as `actions/checkout@v4` and `actions/deploy-pages@v4`.
- [docker-compose.ci.yml](docker-compose.ci.yml) (lines 45-50): baked images are selected by tag,
  not digest.
- [bake.yml](.github/workflows/bake.yml) (lines 298-327): digests are recorded as documentation
  but explicitly not used as pins.
- GitHub documents that concurrency groups are the mechanism for limiting deployment concurrency:
  <https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/control-deployments>.

**Impact Analysis**

- The live report can temporarily describe an older commit than `main`.
- A moved action or image tag changes executed code without a repository diff.
- The threat is moderate for a public portfolio and lower than for production deployment, but it
  directly affects provenance claims.

**Refactor Recommendation and Strategy**

1. Add deployment concurrency, for example a `pages` group with `cancel-in-progress: true`, so the
   newest eligible deployment wins.
2. Pin third-party actions to reviewed commit SHAs; consider the same for first-party actions where
   the maintenance overhead is acceptable.
3. Put the recorded GHCR digest into `docker-compose.ci.yml` as `image: tag@sha256:...`, retaining
   the readable tag while enforcing content identity.

---

## Risk 7 (LOW): Current implementation knowledge is fragmented across stale guides

**Risk Description/Explanation**

Backlog v8 and handover v20 are current, but the architecture and Screenplay guides stopped at the
June design. They omit or misstate Cucumber 12, browser selection, trace contexts, engine-aware
waits, route recovery, `CartTotalQuantity`, ADR-0007, and the current hook timeout. One current
backlog checklist row also retains an 11/11 run claim.

**Evidence Outline**

- [architecture.md](docs/architecture.md) (line 12): declares Cucumber 11; the lockfile resolves
  12.9.0.
- [architecture.md](docs/architecture.md) (lines 93-116): folder map says ADRs 0001-0006 and omits
  several current source modules.
- [architecture.md](docs/architecture.md) (lines 123-135): runtime sequence says Chromium and
  15-20 second waits rather than selected engines and central tiers.
- [screenplay-guide.md](docs/screenplay-guide.md) (lines 14-47, 159-172): documents only the shared
  context and a fixed 60-second timeout, omitting the trace path and current 90/120/180-second
  engine policy.
- [screenplay-guide.md](docs/screenplay-guide.md) (lines 137-151): omits `CartTotalQuantity`.
- [backlog.md](docs/backlog.md) (line 874): credibility checklist still reports 11/11 even though
  current suite evidence is 12/12.

**Impact Analysis**

- A learner can reintroduce superseded patterns while believing they are canonical.
- Documentation quality, one of the repository's strongest portfolio claims, looks weaker than
  the implementation deserves.

**Refactor Recommendation and Strategy**

1. Refresh architecture, Screenplay, QA strategy, folder maps, and examples in one docs-only PR.
2. Link deep historical rationale to implementation logs rather than repeating time-sensitive
   numeric values in multiple guides.
3. Add a documentation consistency checklist to release/backlog closure: stack versions, scenario
   counts, wait policy, hook modes, ADR range, and open operational caveats.

---

## Risk 8 (LOW): Dependency currency is deliberate but not automated

**Risk Description/Explanation**

The audit is clean and the important packages are pinned, but `npm outdated` reports newer direct
versions for Playwright, Node types, and TypeScript. Serenity/JS 3.44.x is deliberately avoided
because of its broader Node/Playwright boundary, yet there is no scheduled freshness check to make
that decision expire visibly.

**Evidence Outline**

- [package.json](package.json) (lines 15-33): Serenity and Playwright packages are pinned; TypeScript
  and Node types use ranges.
- Review command `npm outdated`: Playwright 1.61.1, `@types/node` 20.19.43/26.1.1, and TypeScript
  7.0.2 were newer than the installed direct versions.
- [0006-scheduled-freshness-watch.md](docs/planning/proposals/0006-scheduled-freshness-watch.md)
  (lines 19-24): a dependency/image freshness watch remains an optional proposal.

**Impact Analysis**

- No vulnerability exists at review time, so this is not a security incident.
- Delayed upgrades can eventually make the next upgrade larger and reduce confidence that the
  pinned CI runtime remains representative.

**Refactor Recommendation and Strategy**

Adopt proposal 0006 only if the owner wants ongoing maintenance for a resting reference project.
Otherwise, record a manual quarterly audit cadence and keep the explicit upgrade-boundary notes.

---

[<- Back to Index](00_CODE_REVIEW_CODEX_v1_20260723T2335Z.md) | [Next: Project Review ->](03_PROJECT_REVIEWS/PROJECT_001_Checkout_Automation_Suite.md)
