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

```bash
# install dependencies
npm install

# install the Playwright browser (once per machine)
npx playwright install chromium
```

There are two ways to run, depending on the target store.

**Live read-only smoke (no setup required).** A public Magento Luma demo serves as
a read-only target. Only the read-only subset is run — scenarios that place an
order are excluded — so it is safe against a shared, non-resettable store:

```bash
BASE_URL=https://magento2-demo.magebit.com npm run test:smoke
```

The `smoke` profile filters by tag (`not @deferred and not @placesOrder`). Scope
the run through this profile, **not** through CLI path or `feature:line`
arguments — the default profile's path glob wins over those, and an unscoped run
would place real orders on the shared demo. On Windows PowerShell set the
variable first: `$env:BASE_URL = 'https://magento2-demo.magebit.com'`.

**Full suite (order placement and checkout).** The order-placing and `@deferred`
scenarios need a clean, resettable store — a shared demo's cart is
nondeterministic and cannot be asserted on. This runs against the ephemeral
Dockerised Magento target:

```bash
docker compose up -d --wait
BASE_URL=http://localhost:8080 npm test          # active suite, excludes @deferred
```

See `docs/docker-magento-setup.md` for the first-time bring-up sequence (requires
Adobe Marketplace auth keys). The Docker store is what CI uses; the pre-baked
GHCR images mean CI skips the ~30-min install — see `docs/docker-magento-setup.md`
§ CI section.

### Environment variables

| Variable | Default | Purpose |
|---|---|---|
| `BASE_URL` | `https://magento.softwaretestingboard.com` | Target store base URL (set to `http://localhost:8080` for Docker). |
| `HEADLESS` | `true` | Set `false` to watch the browser during a run. |
| `MAGENTO_ADMIN_TOKEN` | *(unset)* | Admin bearer token for the API-driven Background (ADR-0003). If set, used directly. |
| `MAGENTO_ADMIN_USERNAME` | `admin` | Used to **mint** an admin token when `MAGENTO_ADMIN_TOKEN` is unset. |
| `MAGENTO_ADMIN_PASSWORD` | `Password123!` | Password for token minting (the Docker test-target admin password). |

The Background step verifies product preconditions through the Magento REST API, so it needs an
admin token. The suite resolves one once per run (`MagentoApi.authenticate()` in the `BeforeAll`
hook): it uses `MAGENTO_ADMIN_TOKEN` if provided, otherwise mints one from the admin
username/password. **Magento 2.4.x blocks admin-token issuance until admin 2FA is disabled** on the
test target — see `docs/admin-api-token-guide.md` and `docs/docker-magento-setup.md` (step 6c).
Never commit a real token; the defaults above are local Docker test-target credentials only.

## Continuous integration

`.github/workflows/ci.yml` (the `e2e` workflow) runs on every push to `main` and on pull requests.
It pulls two pre-baked GHCR images (built once by `.github/workflows/bake.yml`), starts the full
Magento stack via `docker compose`, runs the active suite, and publishes the Serenity BDD living
documentation to GitHub Pages.

**Living documentation:** https://gbrooks1970.github.io/magento-checkout-automation/

The pre-baked images eliminate the ~30-min from-scratch Magento install from each CI run, keeping
total pipeline time under 25 minutes. See `docs/docker-magento-setup.md` for the image strategy and
`docs/adr/0003-api-driven-test-data-setup.md` for the API-driven Background that runs on every scenario.

## Design decisions

The architectural decisions are recorded as short ADRs in `docs/adr/`:

- Screenplay over Page Objects
- Serenity/JS as the framework
- API-driven test-data setup
- Playwright over Cypress

## Status

All active scenarios pass against the Dockerised Magento 2.4.8 target: read-only
smoke 7/7 (43/43 steps) and end-to-end guest checkout 4/4 (40/40 steps). The
Background step verifies product availability through the Magento REST API on
every scenario. CI is wired; the green badge above reflects the current `main`
state. The one remaining backlog item is activating the `@deferred`
payment-failure scenario, which needs a deterministically-declining test gateway.
