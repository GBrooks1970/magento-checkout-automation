# Magento Checkout Test Automation

[![e2e](https://github.com/GBrooks1970/magento-checkout-automation/actions/workflows/ci.yml/badge.svg)](https://github.com/GBrooks1970/magento-checkout-automation/actions/workflows/ci.yml)

A portfolio repository demonstrating senior test-automation architecture against
Magento (Adobe Commerce open source). The target surface is the storefront guest
checkout journey, browse through to order confirmation, underpinned by API-driven
test-data setup.

This is a showcase of test design and patterns, not a product. The intended
reader is a hiring manager or technical lead assessing automation-architect
capability. It is bounded deliberately: one journey, reviewable in roughly
fifteen minutes.

## Why the checkout journey

Checkout is the hardest surface on the storefront. It is built on Knockout.js,
it is asynchronous, multi-step, and state-dependent. Proving competence here is
the point. It also forces the single highest-value pattern this repository sets
out to demonstrate: setting up state through the API, then asserting through the
UI. And it maps to a real, money-critical user goal, which gives the BDD and
Screenplay layers a meaningful narrative to carry.

The choice was deliberate over the easier admin or catalogue surfaces. See
`docs/adr/` for the reasoning recorded as decisions.

## The methodology stack

Three practices layer here. They do not compete.

Spec-Driven Development sits on the outer loop and answers what and why. The
Gherkin feature files in `features/` are the specification. They are written and
committed before any step definitions exist, and the commit history is meant to
show that ordering plainly.

BDD provides the language. Scenarios are declarative and written in business
terms, with no UI mechanics leaking into the feature files.

The Screenplay pattern provides the implementation architecture. Actors perform
Tasks through Abilities and ask Questions. This replaces Page Objects. Tasks are
written to read like the Gherkin steps that drive them.

## Tooling

| Concern | Choice | Note |
|---|---|---|
| Screenplay framework | Serenity/JS | First-class Playwright and Cucumber integration, TypeScript, living-documentation reports. Hand-rolling Screenplay was an option; choosing not to reinvent the wheel is the senior call. |
| UI driver | Playwright | Stronger multi-context handling and network interception than the alternatives, which the KO.js checkout needs. |
| Language | Cucumber + Gherkin | Declarative scenarios, business language. |
| Runtime | TypeScript | |

The reasoning behind each choice is recorded in `docs/adr/`.

## Repository layout

```
.
├── README.md
├── docs/
│   ├── adr/                   # architecture decision records
│   ├── gherkin-style-guide.md # good vs bad Gherkin, with a refactored example
│   └── reports/               # published Serenity living documentation (generated)
├── features/                  # the specs, committed first
├── src/
│   ├── actors/                # cast and abilities configuration
│   ├── tasks/                 # AddToCart, ProceedThroughCheckout, and so on
│   ├── interactions/          # custom low-level steps where needed
│   ├── questions/             # TheOrderConfirmation, TheCartTotal
│   ├── api/                   # REST client for data setup and teardown
│   └── step-definitions/      # thin glue: Gherkin to Tasks
├── .github/workflows/         # CI: reindex, cache flush, run, publish report
└── docker-compose.yml         # ephemeral Magento (pre-built image)
```

## Running the suite

**Requires Node.js 20+** (matches CI's `actions/setup-node` pin; see `engines.node` in `package.json`).

```bash
# install dependencies
npm install

# install the Playwright browser (once per machine)
npx playwright install chromium
```

The suite runs against the local Dockerised Magento store (the same store CI
uses). The quickest bring-up pulls the pre-baked public GHCR images — no Magento
install, no Marketplace keys, no secrets:

```bash
# bring up the complete store (~5–10 min first start: pull + DB restore).
# GHCR_OWNER names the (lowercase) GHCR namespace holding the baked images —
# the overlay interpolates it so forks pull their own images; put it in a
# .env file next to docker-compose.yml to stop typing it (compose auto-loads it)
GHCR_OWNER=gbrooks1970 docker compose -f docker-compose.yml -f docker-compose.ci.yml up -d --wait

# run the full suite (12 scenarios — BASE_URL already defaults to this store)
npm test
```

The pre-baked images carry everything the suite needs: Luma sample data, the
`Portfolio_DeclinePayment` test module for the payment-failure scenario, admin
2FA disabled for the API-driven Background, and the test admin credentials.
Placing real orders is fine — the store is disposable; tear down with
`GHCR_OWNER=gbrooks1970 docker compose -f docker-compose.yml -f docker-compose.ci.yml down -v`.

**Read-only subset.** The `smoke` profile (`npm run test:smoke`) runs only the 7
scenarios that neither place orders nor depend on the decline module — filter by
this profile (tags `not @deferred and not @placesOrder and not @usesDeclineModule`), **not** by CLI path or
`feature:line` arguments, which the default profile's path glob overrides.

> An earlier README recommended running the smoke subset against a public Luma
> demo (Magebit). That path no longer works: the Background now verifies product
> preconditions through the Magento admin REST API on every scenario, and a
> public demo will not honour the test credentials. Use the local store.

**From-scratch install.** Only needed to change what is baked into the images —
see `docs/docker-magento-setup.md` for the full runbook (requires Adobe
Marketplace auth keys) and the image-baking strategy CI uses.

### Environment variables

| Variable | Default | Purpose |
|---|---|---|
| `BASE_URL` | `http://localhost:8080` | Target store base URL — the default matches the local Docker store. Point it elsewhere only at a store you own (the Background mints an admin token there). |
| `HEADLESS` | `true` | Set `false` to watch the browser during a run. |
| `BROWSER` | `chromium` | Playwright engine: `chromium` \| `firefox` \| `webkit` (case-insensitive). CI runs all three as a matrix — Chromium is the required gate, Firefox/WebKit are non-blocking legs. An unrecognised value fails fast at `BeforeAll`. |
| `SCREENSHOTS` | `all` locally, `off` in CI | Screenshots in the Serenity report: `off` \| `failures` \| `all`. Unset → **on (every interaction) locally, off in CI** (CI detected via `CI=true`). An explicit value overrides the environment default. Recommended CI opt-in for debugging: `SCREENSHOTS=failures`. See `docs/adr/0007-screenshots-in-reports.md`. |
| `MAGENTO_ADMIN_TOKEN` | *(unset)* | Admin bearer token for the API-driven Background (ADR-0003). If set, used directly. |
| `MAGENTO_ADMIN_USERNAME` | `admin` *(localhost only)* | Used to **mint** an admin token when `MAGENTO_ADMIN_TOKEN` is unset. The default applies only when `BASE_URL` resolves to localhost; against any other host this must be set explicitly. |
| `MAGENTO_ADMIN_PASSWORD` | `Password123!` *(localhost only)* | Password for token minting (the Docker test-target admin password). Same localhost-only default as the username — required explicitly for any non-localhost target. |

The Background step verifies product preconditions through the Magento REST API, so it needs an
admin token. The suite resolves one once per run (`MagentoApi.authenticate()` in the `BeforeAll`
hook): it uses `MAGENTO_ADMIN_TOKEN` if provided, otherwise mints one from the admin
username/password. **Magento 2.4.x blocks admin-token issuance until admin 2FA is disabled** on the
test target — see `docs/admin-api-token-guide.md` and `docs/docker-magento-setup.md` (step 6c).
Never commit a real token; the defaults above are local Docker test-target credentials only.
For that reason the `admin`/`Password123!` fallback applies **only when `BASE_URL` resolves to
localhost**: against any other host, `authenticate()` fails fast unless you supply
`MAGENTO_ADMIN_TOKEN` or both `MAGENTO_ADMIN_USERNAME` and `MAGENTO_ADMIN_PASSWORD`, rather than
probing a real store with guessable defaults (review R-09).

## Continuous integration

`.github/workflows/ci.yml` (the `e2e` workflow) runs on every push to `main` and on pull requests.
It pulls two pre-baked GHCR images (built once by `.github/workflows/bake.yml`), starts the full
Magento stack via `docker compose`, runs the active suite, and publishes the Serenity BDD living
documentation to GitHub Pages.

**Living documentation:** https://gbrooks1970.github.io/magento-checkout-automation/

The pre-baked images eliminate the ~30-min from-scratch Magento install from each CI run, keeping
total pipeline time under 25 minutes. See `docs/docker-magento-setup.md` for the image strategy and
`docs/adr/0003-api-driven-test-data-setup.md` for the API-driven Background that runs on every scenario.

Two deliberate quirks of the report pipeline, so they don't read as mistakes: the suite archives
its Serenity JSON to `docs/reports/` (gitignored) and the HTML report is rendered from there to
`target/site/serenity`, which is what Pages publishes — a two-stage path, not a misconfiguration.
And the Pages deploy runs **even when the suite fails** (`always()` on `main`), so a broken run
still produces inspectable living documentation: if you ever see failing scenarios in the
published report while the badge is red, that is the publish-on-failure policy working as
intended, not a stale deploy.

## Design decisions

The architectural decisions are recorded as short ADRs in `docs/adr/`:

- Screenplay over Page Objects
- Serenity/JS as the framework
- API-driven test-data setup
- Playwright over Cypress
- Deterministic payment failure via an in-repo Magento module
- API guest-cart seeding, session-bound via an in-repo test-fixture endpoint

## Status

Backlog items #1–#12 delivered and green. The full suite — **12 scenarios, 94 steps** — runs
green in CI against the pre-baked Dockerised Magento 2.4.8 store, including the payment-failure
scenario, which declines deterministically via the in-repo
`Portfolio_DeclinePayment` test-fixture module (no gateway sandbox, secrets, or
network dependency — see `docs/adr/0005-deterministic-payment-failure.md`).
Backgrounds are fully API-driven: product preconditions are verified through the
Magento REST API on every scenario, and cart preconditions are seeded through the
REST guest-cart endpoints, bound to the browser session via the in-repo
`Portfolio_CartSeed` endpoint (`docs/adr/0006-api-guest-cart-seeding.md`). The
green badge above reflects the current `main` state, and the
Serenity living documentation publishes to GitHub Pages on every `main` run. Items **#13**
(trace + video capture on failure, gated off by default behind `TRACE=on-failure`) and **#14**
(cross-browser run matrix) are also delivered: CI runs Chromium (required) on every push and PR,
with Firefox and WebKit running non-blocking on a weekly schedule and on `main` while real,
documented engine-specific timing drift on those two engines is triaged (Item #15). All 14
originally-scoped backlog items are resolved — see `docs/backlog.md` for full status and evidence
on every item, including Item #15.

## Licence

[MIT](LICENSE) — © 2026 Gary Brooks.

The MIT licence covers the original automation code, test fixtures, and documentation in this
repository. Magento Open Source, container images, and third-party dependencies remain subject to
their own licence terms.
