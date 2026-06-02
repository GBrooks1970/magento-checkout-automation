<!--
  AUDIENCE: Engineers and AI agents working in or onboarding this project.
  PURPOSE:  Describe how this project is composed, how its components interact,
            and what constraints or decisions are specific to this implementation.
  LOCATION: docs/architecture.md
  TEMPLATE: docs/templates/stack-architecture.template.md
-->

# [REQUIRED: Project Name] — Architecture Guide

**Version:** [REQUIRED: N]
**Last Updated:** [REQUIRED: YYYY-MM-DD]

---

## 1. Overview

- **Purpose:** [REQUIRED: One sentence — what does this project demonstrate or test?]
- **Surface type:** UI (Magento Luma storefront — guest checkout journey)
- **Language / Framework:** TypeScript + Serenity/JS + Playwright + Cucumber
- **Test target:** [REQUIRED: URL of Magento instance once resolved — see docs/backlog.md]
- **Automation entry point:** `npm test` — runs Cucumber with `--tags "not @deferred"`

---

## 2. Project Composition

### Test Target (Subject Application)

[REQUIRED: Describe the Magento instance being tested.]

- **URL:** [REQUIRED: `BASE_URL` env var, default to be set once live target is resolved]
- **Configuration:** Set `BASE_URL`, `HEADLESS`, and `MAGENTO_ADMIN_TOKEN` environment variables
- **Sample data:** Luma sample products (`Push It Messenger Bag`, `Fusion Backpack`) assumed pre-loaded

### Test Runtime

- **Feature files:** `features/**/*.feature` — discovered by Cucumber profile
- **Step definitions:** `src/step-definitions/**/*.ts`
- **Screenplay components:** `src/tasks/`, `src/interactions/`, `src/questions/`, `src/actors/`
- **Hooks:** `src/hooks/browser.hooks.ts` — manages Playwright browser lifecycle per scenario
- **Serenity config:** `src/serenity.config.ts` — crew: ArtifactArchiver, SerenityBDDReporter, ConsoleReporter

### Tooling

| Command | Purpose |
|---|---|
| `npm test` | Run active suite (excludes `@deferred`) |
| `npx tsc --noEmit` | TypeScript type check |
| `HEADLESS=false npm test` | Run with visible browser (debug mode) |
| `npm run test:report` | Generate Serenity BDD HTML report from JSON artifacts |

---

## 3. Folder Map

```
magento-checkout-automation/
├── features/                        # Gherkin specifications (committed before implementation)
│   ├── _manifest.md
│   ├── guest-checkout.feature
│   ├── cart-management.feature
│   ├── checkout-validation.feature
│   └── payment-failure.feature      # @deferred — excluded from CI
├── src/
│   ├── serenity.config.ts           # Crew configuration (reporters)
│   ├── hooks/
│   │   └── browser.hooks.ts         # Playwright browser lifecycle (Before/After)
│   ├── interactions/                # PageElement definitions per page area
│   │   ├── StorefrontPage.ts
│   │   ├── CartPage.ts
│   │   └── CheckoutPage.ts
│   ├── tasks/                       # Screenplay Tasks (composed activities)
│   ├── questions/                   # Screenplay Questions (assertions)
│   ├── api/                         # Magento REST API client (data setup)
│   ├── actors/                      # Reserved — actor setup via hooks
│   └── step-definitions/            # Cucumber step wiring
├── docs/
│   ├── adr/                         # Architecture Decision Records
│   ├── templates/                   # Document templates
│   ├── reports/                     # Serenity BDD output (gitignored runtime files)
│   └── *.md                         # Project documentation
├── .github/workflows/ci.yml         # CI skeleton (pending target decision)
├── docker-compose.yml               # Docker skeleton (pending target decision)
├── cucumber.js                      # Cucumber profile
├── tsconfig.json
└── package.json
```

---

## 4. Runtime Sequence

What happens when `npm test` runs:

1. Cucumber discovers `features/**/*.feature` (excluding `@deferred`)
2. `ts-node/register` compiles TypeScript on-the-fly
3. `src/serenity.config.ts` is loaded — configures crew (reporters)
4. `src/hooks/browser.hooks.ts` `Before` hook runs — launches Chromium, engages Cast
5. For each scenario: Cucumber calls step definitions, which delegate to `actorCalled('User')`
6. The actor performs Tasks → Interactions (Playwright via Serenity/JS web) → Magento storefront
7. Questions assert page state; Serenity captures artifacts on pass or failure
8. `After` hook runs — browser closed, actor dismissed
9. `ArtifactArchiver` writes Serenity JSON to `docs/reports/`
10. `SerenityBDDReporter` processes events; `npm run test:report` converts to HTML

---

## 5. Magento-Specific Constraints

| Area | Constraint | Reason | ADR |
|---|---|---|---|
| Async checkout | Wait on network/state; never hard waits | Knockout.js renders checkout asynchronously | — |
| Indexer / cache | CI must reindex and flush before tests | Catalogue changes invisible until reindexed | — |
| Payment testing | Requires Docker + configurable test gateway | Public sandbox cannot deterministically decline cards | `@deferred` tag |
| Test data setup | API-driven via `src/api/MagentoApiClient.ts` | UI-based setup is slow and brittle with EAV model | ADR-0003 |
| Assertion style | Subtotals asserted as bare numbers using `includes()` | Currency symbol varies by locale/config | — |

---

## 6. Known Issues / Technical Debt

- **Live test target unresolved** — `BASE_URL` defaults to `softwaretestingboard.com` which has an SSL error (526) as of 2026-06-02. Docker Magento is the recommended resolution. See `docs/backlog.md`.
- **API client is a stub** — `src/api/MagentoApiClient.ts` is scaffolded but Background steps currently verify product availability via UI navigation, not API. Full API wiring is a backlog item.
- **ADR skeletons incomplete** — `docs/adr/0001–0004` have structure but examples are not yet populated. See `docs/backlog.md`.
- **CI workflow is a skeleton** — `.github/workflows/ci.yml` and `docker-compose.yml` are not functional pending the live target decision.
