<!--
  AUDIENCE: Engineers and AI agents reviewing development session history.
  PURPOSE:  Record what was built, what was decided, what broke, and what was learned
            during a development session. Immutable once written — append only.
  LOCATION: docs/implementation-logs/YYYY-MM-DD_short-slug.md
  TEMPLATE: docs/templates/implementation-log.template.md
-->

# Backlog #3 — API-driven Background — 2026-06-06

## Session Summary

Wired backlog Item #3: the Background product-availability step now establishes its precondition
through the Magento REST API instead of the storefront UI, realising the "API setup, UI assertion"
pattern (ADR-0003). Proving the path first surfaced a real Magento 2.4.x blocker — mandatory admin
2FA blocks the admin-token endpoint — which was resolved (test-target only) and documented. The full
suite is green with the API precondition exercised in every scenario.

---

## Objectives

1. ✅ Prove the admin API token path works against the Docker store.
2. ✅ Implement real admin auth + product verification in `MagentoApiClient`.
3. ✅ Switch the Background step from UI navigation to the API.
4. ✅ Grant the actor the `CallAnApi` ability and bootstrap the token once per run.
5. ✅ Document the token process pedagogically and update ADR-0003 / README / runbook.

---

## Test Results

| Suite | Passing | Total | Status |
|---|---|---|---|
| read-only smoke (`npm run test:smoke`) | 7 scenarios / 43 steps | 7 / 43 | ✅ PASS |
| `@placesOrder` (`--profile default --tags @placesOrder`) | 4 scenarios / 40 steps | 4 / 40 | ✅ PASS |
| `npx tsc --noEmit` | — | — | ✅ clean |

Both suites exercise the API-driven Background in every scenario (each feature's Background calls
`a product "…" priced at "…" is available`).

---

## Changes Implemented

### API client — auth + real product verification

**Files changed:**
- `src/api/MagentoApiClient.ts` — added `authenticate()` (resolves an admin bearer token once per
  run: prefers `MAGENTO_ADMIN_TOKEN`, else mints one via `POST /rest/V1/integration/admin/token`
  from `MAGENTO_ADMIN_USERNAME`/`MAGENTO_ADMIN_PASSWORD`, default `admin`/`Password123!`) and a
  `token()` accessor. Rewrote `verifyProductIsAvailable(name, price)` to send the bearer token and
  assert HTTP 200, `total_count > 0`, `items[0].name`, and `items[0].price`. Uses the camelCase
  `searchCriteria[filterGroups]`/`conditionType` keys (the snake_case form the stub used is not what
  Magento's query parser expects).

### Background step → API

**Files changed:**
- `src/step-definitions/background.steps.ts` — the product-availability step calls
  `MagentoApi.verifyProductIsAvailable(name, Number.parseFloat(price))`; removed the UI fallback
  (`Navigate`/`StorefrontPage`/`isVisible`).

### Actor abilities + token bootstrap

**Files changed:**
- `src/hooks/browser.hooks.ts` — `await MagentoApi.authenticate()` in `BeforeAll`; actor now has
  both `BrowseTheWebWithPlaywright.using(browser)` and `CallAnApi.at(BASE_URL)`.

### Documentation

**Files changed:**
- `docs/adr/0003-api-driven-test-data-setup.md` — marked Implemented; concrete endpoint, auth flow,
  response shape, and assertions.
- `README.md` — Environment variables table (`MAGENTO_ADMIN_TOKEN`/`USERNAME`/`PASSWORD`) + 2FA caveat.
- `docs/docker-magento-setup.md` — step 6c (disable admin 2FA on the test target).
- `docs/admin-api-token-guide.md` — new pedagogical guide (committed earlier on this branch).

---

## Technical Decisions

| Decision | Rationale | Alternatives rejected |
|---|---|---|
| Mint the token in-suite (fallback to env) | Turnkey local runs (no manual token step) while still honouring an explicit `MAGENTO_ADMIN_TOKEN` for CI | Require a pre-minted token always — extra manual step for local dev |
| Disable admin 2FA on the test target | 2.4.x blocks the token endpoint until 2FA is set; TOTP can't be fed to a headless run | Configure OTP 2FA — defeats automation; leave #3 blocked |
| Use global `fetch` for token minting | Node ≥18 provides it; avoids adding an `axios` direct dependency | Import `axios` directly — relies on a transitive dep |
| camelCase `searchCriteria` keys | What Magento's query parser expects; verified returns `total_count=1` | snake_case (stub's form) — not what the API parses |

---

## Lessons Learned

- **Prove the integration path before wiring it.** A throwaway token request surfaced the 2.4.x
  2FA block immediately — far cheaper than discovering it through a failing suite.
- **HTTP 200 ≠ found.** A Magento product search with no matches still returns 200; existence must
  be asserted on `total_count`, not the status code.
- **The actor can hold multiple abilities.** Granting both `CallAnApi` and
  `BrowseTheWebWithPlaywright` is exactly what "API setup, UI assertion" needs.

---

## Recommendations / Next Steps

- [ ] **#2 — `payment-failure.feature`** — still BLOCKED: needs a declining test payment gateway.
- [ ] **#4 — living docs + CI badge** — still BLOCKED: needs CI Marketplace secrets; also fold the
  2FA-disable (step 6c) and admin-token env vars into `ci.yml`.
- [ ] Consider tearing the token out of any logs/reports if verbosity is ever raised (it is a secret).

---

*Session logged: 2026-06-06. Author: Claude Code with Gary Brooks.*
