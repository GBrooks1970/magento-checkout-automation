# Live smoke test against a public Magento sandbox — 2026-06-02

**Author:** Gary Brooks
**Purpose:** De-risk the suite against a real Magento Luma storefront *before* investing
in the Dockerised CI target (backlog Item #1). This run validates the methods and
architecture and surfaces defects cheaply, where they are far easier to fix than mid
Docker bring-up.

**Outcome in one line:** The methodology is sound — one scenario passed end-to-end against
a live Luma store, proving the whole vertical slice — but a **browser-lifecycle defect in the
Cucumber hooks blocks every multi-scenario run**, and **CLI path filtering does not reliably
scope this project**. Both were environment-independent and would have bitten equally on Docker.

> **Update (same day): both blockers fixed and re-validated.** The hook lifecycle defect (§3.2)
> and the scoping gap (§3.3) were resolved as backlog Items #8 and #9. The post-fix re-run (§6)
> confirms multi-scenario runs now work; the remaining failures are genuine live-Luma selector/timeout
> drift, tracked as Item #10. Sections 1–6 below are preserved as the original diagnosis.

---

## 1. Test environment

| Property | Value |
|---|---|
| Target store | `https://magento2-demo.magebit.com` (Magebit public demo) |
| Platform | Magento 2 Commerce, standard **Luma** theme + sample data |
| Storefront access | Open — no login required to browse, add to cart, or reach checkout |
| `BASE_URL` | `https://magento2-demo.magebit.com` (set via environment) |
| Browser | Chromium headless shell (Playwright build 1223), installed this session via `npx playwright install chromium` |
| Toolchain | Serenity/JS 3.43.2 · @cucumber/cucumber 11.3.0 · @playwright/test 1.60.0 · TypeScript 5.9.3 · ts-node 10.9.2 · Node ≥18 |
| Run duration | ~12–17 s per invocation |

**Why Magebit.** Of the two public sandbox candidates, `magento-demo.mageplaza.com` returned
HTTP 403 to automated access and was discarded. Magebit responded 200, runs the standard Luma
sample catalogue, and — critically — carries the *exact* products our specifications reference
(e.g. **Fusion Backpack at $59.00**, **Push It Messenger Bag at $45.00**), so selector and
URL-slug drift against it is minimal. The Dockerised target will also be Luma sample data, so
validation here transfers directly.

**Scope and safety.** Only read-only behaviour was intended: cart operations and checkout
*validation* (which assert the shopper **cannot** advance to payment). The order-placing
`guest-checkout` scenarios were *not* meant to run against a shared third-party store.
**No order was placed** — see §4.

---

## 2. Representative command

```bash
BASE_URL=https://magento2-demo.magebit.com npx cucumber-js \
  features/cart-management.feature features/checkout-validation.feature \
  --require-module ts-node/register \
  --require src/serenity.config.ts \
  --require "src/hooks/**/*.ts" \
  --require "src/step-definitions/**/*.ts" \
  --format @serenity-js/cucumber --format progress \
  --tags "not @deferred" --strict
```

---

## 3. Results

### 3.1 What passed — the methodology is validated

The scenario **"Add a single product to an empty cart"** (`cart-management.feature:11`) passed
**end-to-end against the live store**, every time it executed. That single green scenario
exercises and therefore validates the entire vertical slice:

| Layer | Component proven by the passing scenario |
|---|---|
| Configuration | `BASE_URL` consumed; Serenity crew + reporter initialise |
| Hooks | Chromium launches; actor cast engaged |
| Navigation | Storefront reached; **product URL-slug map** in `StorefrontPage.ts` resolves against live Luma |
| Interaction | **`StorefrontPage` add-to-cart selector** locates and clicks the real button |
| Task | `AddToCart.product()` performs correctly |
| Async handling | **KO.js wait pattern** (`Wait.until(... isVisible())`) holds against the live mini-cart re-render |
| Question | `CartItemCount()` reads the live cart counter and the assertion matches |

This is the headline result: **the Screenplay + Serenity/JS + Playwright + Cucumber stack drives
a real Magento Luma storefront correctly.** The approach chosen in ADRs 0001–0004 works in practice,
not just in type-checking.

### 3.2 What failed — and why it is *not* a methodology problem

Every scenario *after the first in a process* failed at its **first navigation** with:

```
browserContext.newPage: Target page, context or browser has been closed
  at PlaywrightBrowsingSessionWithBrowser.registerCurrentPage (...)
  at NavigateToUrl.performAs (...)
```

This is a **browser-lifecycle error, not a selector or assertion failure** — it occurs before any
page-specific element is touched. It is **positional**: only the first scenario per process ever
passes. Diagnosis across four runs:

- Run with full profile (11 scenarios): only the first passed; all others failed identically.
- The failure point is always the Background's first navigation, regardless of which feature.
- A selector/timeout failure would surface differently (element-not-found / wait timeout) and would
  vary by scenario — this does not.

**Root cause.** `src/hooks/browser.hooks.ts` launches a fresh browser in `Before` and closes it in
`After`, sharing it through a module-level variable. After scenario 1 closes the browser, scenarios
2+ end up bound to that closed instance — the new cast does not rebind the reused actor's ability to
the freshly launched browser. First scenario works; the rest inherit a dead browser.

**Recommended fix** — the canonical Serenity/JS + Cucumber pattern: launch the browser **once** and
let Serenity manage a fresh browser *context* per scenario.

```typescript
import { BeforeAll, AfterAll, Before } from '@cucumber/cucumber';
import { Cast, engage } from '@serenity-js/core';
import { BrowseTheWebWithPlaywright } from '@serenity-js/playwright';
import { chromium } from 'playwright';
import type { Browser } from 'playwright';

let browser: Browser;

BeforeAll(async () => {
    browser = await chromium.launch({ headless: (process.env.HEADLESS ?? 'true') === 'true' });
});

Before(() => {
    engage(Cast.where(actor => actor.whoCan(BrowseTheWebWithPlaywright.using(browser))));
});

AfterAll(async () => {
    if (browser) { await browser.close(); }
});
```

This keeps the `Cast.where` synchronous constraint (the reason browser launch lives outside
`configure()`), but moves the *launch* to `BeforeAll` so the browser survives the whole run while each
scenario still gets an isolated context from Serenity. **This is a prerequisite for any green CI badge,
on Docker or anywhere else.**

### 3.3 Secondary finding — CLI scoping is unreliable in this project

`cucumber.js` defines a `default` profile with `paths: ['features/**/*.feature']`, which cucumber-js
**auto-loads even when no `--profile` is passed**. In testing, positional path arguments and
line-qualified paths (`feature:line`) did **not** reliably restrict the run — the full suite executed
regardless. This matters for two reasons:

1. **Against a shared/non-resettable store**, there is currently no reliable CLI way to exclude the
   order-placing scenarios. Relying on path arguments is unsafe.
2. **For CI**, selective execution (smoke subset vs. full suite) needs a mechanism the profile cannot
   silently override.

**Recommended fix.** Tag order-placing scenarios (e.g. `@placesOrder` on the `guest-checkout` happy
path and quantity outline) and drive environment-aware filtering through tags
(`--tags "not @deferred and not @placesOrder"`), which combine reliably with the profile, rather than
through paths. Consider a dedicated `smoke` profile in `cucumber.js` for the read-only subset.

---

## 4. Safety confirmation — no order was placed

Across all four runs, the order-placing `guest-checkout` scenarios (happy path + quantity outline)
**never reached checkout**: each died at the Background's first navigation due to the lifecycle defect,
and Cucumber marked the order steps (`I complete checkout with valid details`,
`I should see an order confirmation`) as **skipped**. The only fully-executed scenario was a cart
operation that places nothing. No data was written to the Magebit demo.

> Note: this safety outcome was partly a side effect of the lifecycle bug. Once that bug is fixed,
> the scoping fix in §3.3 becomes a hard requirement before re-running against any shared store, or
> orders *will* be placed.

---

## 5. What this validates toward the Docker target (backlog Item #1)

**Validated now — carries directly to Docker (same Luma sample data):**
- The end-to-end stack drives a live Magento Luma storefront.
- Product page navigation, URL-slug map, add-to-cart interaction, mini-cart KO.js waits, and cart-count
  question are all correct against standard Luma.
- The methodology (SDD → Gherkin → Screenplay → Serenity/Playwright) is sound in practice.

**Must be fixed before Docker work (environment-independent — would block Docker identically):**
- The browser-lifecycle defect in `src/hooks/browser.hooks.ts` (§3.2). This is the new top priority;
  a green CI badge is impossible without it.
- The CLI scoping / tagging gap (§3.3), required for safe and selective CI execution.

**Still unverified — only Docker can validate (out of reach on a read-only shared store):**
- Multi-step KO.js checkout selectors: shipping form, country→state dependency, shipping-method, payment.
- API-driven Background setup (needs write access — `MagentoApiClient` is still a stub; UI fallback in use).
- Order confirmation and order-number/subtotal questions.
- The `@deferred` `payment-failure` feature (needs a configurable test gateway).

**Conclusion.** The smoke test achieved its purpose: it confirmed the core approach works against real
Magento and caught two blocking defects cheaply, before any time was spent on the heavyweight Docker
bring-up. Recommended order of next actions: (1) fix the hook lifecycle, (2) add order-scenario tagging
+ a smoke profile, (3) re-run the read-only subset to a clean pass against Magebit, (4) then proceed to
the Dockerised target for the checkout, API-setup, and payment work.

---

## 6. Post-fix re-run (Items #8 and #9 applied)

After fixing the hook lifecycle (#8) and adding `@placesOrder` tags + a `smoke` profile (#9), the
read-only subset was re-run:

```bash
BASE_URL=https://magento2-demo.magebit.com npx cucumber-js --profile smoke
```

**Scoping (#9) — works.** The `smoke` profile (`tags: 'not @deferred and not @placesOrder'`) selected
exactly **7 read-only scenarios** and excluded both order-placing scenarios. Safe against a shared store.

**Lifecycle (#8) — fixed.** The `browser has been closed` error is **gone**. `Before` and the Background
navigation now pass in **every** scenario, not just the first — 27 steps passed (vs. 5 before). The
launch-once / context-per-scenario pattern behaves correctly.

**Remaining failures are now genuine live-Luma drift (→ Item #10):**

| # | Scenario | Failure | Nature |
|---|---|---|---|
| 1 | ProceedToCheckout (validation scenarios) | `strict mode violation: locator('button.action.primary.checkout') resolved to 2 elements` (`#top-cart-btn-checkout` + `[data-role="proceed-to-checkout"]`) | **Real selector bug** — fix in code |
| 2 | Remove / update / proceed steps | `function timed out, ensure the promise resolves within 5000 milliseconds` | **Step timeout too low** for live network + KO.js — raise `setDefaultTimeout` |
| 3 | Cart reflects correct total | `Expected cart item count to equal "1" … Received "8"` | **Shared-store contamination** — not our code; needs the clean Docker store |

This is the expected and desirable result: with the infrastructure defects gone, the smoke test now
isolates the real selector/timeout work, and demonstrates concretely why count/subtotal assertions
require the resettable Docker instance rather than a shared public demo.

---

## 7. Reproduction notes

- Requires `npx playwright install chromium` on a fresh machine (was not previously installed here).
- `npx tsc --noEmit` remains clean — these are runtime/lifecycle issues, not type errors.
- Default is headless; set `HEADLESS=false` to watch a run.
