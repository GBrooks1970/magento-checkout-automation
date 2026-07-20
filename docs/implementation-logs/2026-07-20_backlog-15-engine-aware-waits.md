# Backlog #15: Engine-aware waits and cross-browser stabilisation — 2026-07-20

## Session Summary

Resolved backlog Item #15 by reproducing the Firefox/WebKit drift against the Dockerised Magento
2.4.8 store, separating genuine timing pressure from visibility, cache, and route-transition
defects, and implementing a central engine-aware wait policy. All three engines completed the full
12-scenario suite locally; Chromium remains strict, while Firefox/WebKit retain visible recovery
telemetry and stay non-blocking until the documented promotion evidence exists. A newly reported
Axios advisory found during final validation was also cleared without breaking the Node 20 CI
contract.

---

## Objectives

1. ✅ Reproduce Item #15's Firefox/WebKit failures against a live local Magento store.
2. ✅ Replace scattered Chromium-tuned wait literals with one engine-aware semantic policy.
3. ✅ Fix observed off-viewport visibility, cached cart-count, and checkout-route failure modes.
4. ✅ Define a measurable promotion-to-required gate without claiming fallback-assisted green as
   native stability.
5. ✅ Restore the dependency tree to zero known vulnerabilities after a new Axios audit finding.

---

## Test Results

| Validation | Scenarios passing | Total | Status |
|---|---:|---:|---|
| Baseline Chromium full live suite | 12 | 12 | ✅ PASS in 2m37s |
| Baseline Firefox full live suite | 9 | 12 | ❌ FAIL — cached cart count and add-to-cart visibility |
| Baseline WebKit full live suite | 6 | 12 | ❌ FAIL — six checkout state-selector visibility timeouts |
| Final Chromium full live suite before dependency follow-up | 12 | 12 | ✅ PASS in 2m55s |
| Final Firefox full live suite | 12 | 12 | ✅ PASS in 4m11s, with observable route recovery |
| Final WebKit full live suite | 12 | 12 | ✅ PASS in 3m20s, with observable recovery retained |
| Targeted WebKit guest checkout after bootstrap telemetry was added | 1 | 1 | ✅ PASS in 34s; `[MAG-15 bootstrap recovery]` emitted |
| `npm run verify` after all source/dependency changes | 12 default + 7 smoke dry | 19 | ✅ PASS; TypeScript clean |
| `npm audit` after Axios 1.18.1 override | 0 vulnerabilities | 0 | ✅ PASS |
| Final Chromium full live suite on the exact dependency tree | 12 | 12 | ✅ PASS in 2m53s |

---

## Changes Implemented

### Central engine-aware wait policy

**Files changed:**

- `src/config/wait-durations.ts` — added one validated `BROWSER` selector and semantic ceilings for
  responsive UI, asynchronous updates, complex renders, route transitions, and Cucumber steps.
- `src/hooks/browser.hooks.ts` — reuses the central engine selector and applies the selected
  Cucumber step ceiling.
- `src/tasks/*.ts` and `src/step-definitions/*.ts` — replaced every scattered explicit
  `Duration.ofSeconds(...)` literal with the relevant semantic tier.

The values are polling ceilings, not sleeps: a condition that becomes true returns immediately.

### Visibility and state-oracle root-cause fixes

**Files changed:**

- `src/tasks/AddToCart.ts` — waits for the AJAX success banner to be present, scrolls it into the
  viewport, then asserts visibility. Firefox had rendered the banner above the viewport after the
  click scrolled down to the button.
- `src/tasks/ProvideShippingDetails.ts` — scrolls the dependent state selector before asserting
  visibility. WebKit rendered the enabled control below the viewport; longer ceilings alone still
  failed because Serenity's visibility check is viewport/occlusion-aware.
- `src/interactions/CartPage.ts`, `src/questions/CartTotalQuantity.ts`, and
  `src/step-definitions/cart.steps.ts` — keep Magento's asynchronous header customer-data counter as
  a soft diagnostic signal, but make the hard Gherkin assertion sum authoritative cart-row quantity
  inputs.

### Observable exploratory-engine route recovery

**Files changed:**

- `src/interactions/StabiliseCheckoutRoute.ts` — proves the cart-to-checkout URL transition after
  the button click. Chromium throws strictly if it fails; Firefox/WebKit can navigate to the same
  canonical checkout route after an observed stall. WebKit also performs a clean canonical reload
  after reaching checkout because its first Knockout bootstrap can remain stuck.
- `src/tasks/ProceedToCheckout.ts` — applies the interaction before waiting for the checkout form.

Every fallback writes a `[MAG-15 ... recovery]` message to stderr. A green exploratory scenario
therefore cannot conceal the workaround from the promotion decision.

### Dependency security follow-up

**Files changed:**

- `package.json` and `package-lock.json` — override Serenity/JS 3.43.2's exact Axios 1.16.0
  dependency to Axios 1.18.1 for both REST and reporting consumers.

The latest coherent Serenity/JS line (3.44.1) was not selected because it requires Node 22.12+ and
Playwright 1.61.1, conflicting with the repository's Node 20 CI contract. The bounded Axios override
restored `npm audit` to zero vulnerabilities and the final Chromium 12/12 run exercised the REST
precondition path on every scenario.

---

## Technical Decisions

| Decision | Rationale | Alternatives rejected |
|---|---|---|
| Use named wait tiers with explicit per-engine values | Test intent states the kind of asynchronous boundary; one policy can be tuned from evidence without editing every task | A global multiplier, which hides the meaning of each ceiling; blind uniform increases, which did not fix WebKit's visibility failure |
| Separate presence, viewport positioning, and visibility | The failing elements existed but were outside Serenity's viewport-aware visibility model | Increasing waits further; replacing visibility with presence only, which would weaken user-visible assertions |
| Treat cart rows as the hard quantity oracle and the header counter as telemetry | Magento's customer-data counter can remain empty/stale while server cart state is correct | Reload-and-poll the same cache; failing correct cart behaviour on a product cache race |
| Permit only observable recovery on exploratory engines | Provides functional coverage while preserving honest evidence about native stability; Chromium remains strict | Silently navigating directly to checkout; making fallback-assisted Firefox/WebKit required gates |
| Require three consecutive eligible 12/12, zero-recovery CI runs before promotion | Prevents one local or fallback-assisted green run from being treated as stable cross-browser support | Immediate promotion from this session; indefinite “consider later” wording with no measurable gate |
| Override Axios 1.18.1 beneath Serenity 3.43.2 | Clears the advisories while retaining Node 20 and the validated framework/Playwright versions | Serenity 3.44.1, which forces Node 22.12+ and Playwright 1.61.1; leaving three moderate advisories accepted |

No new ADR was created: these decisions tune the existing Screenplay wait/oracle strategy and the
already accepted cross-browser CI matrix rather than changing the project's architectural boundary.

---

## Documentation Updates

- `.github/workflows/ci.yml` — recorded the three-run, zero-recovery promotion gate next to the
  non-blocking matrix policy.
- `README.md` — documented all-browser installation, the central wait policy, Item #15 completion,
  and the deferred promotion state.
- `CHANGELOG.md` — recorded engine-aware waits, root-cause fixes, observable recovery, and the Axios
  security override.
- `docs/backlog.md` — advanced to v8, closed Item #15 with measured baseline/final evidence, reduced
  outstanding items to zero, and recorded the dependency follow-up.
- `docs/qa-strategy.md` — documented the wait tiers, promotion gate, and authoritative cart-count
  assertion.
- `docs/implementation-logs/2026-07-20_backlog-15-engine-aware-waits.md` — this immutable record.

---

## Lessons Learned

- A longer wait cannot fix a visibility predicate that is permanently false because the element is
  outside the viewport. Probe presence, geometry, enabled state, and occlusion separately before
  tuning a ceiling.
- Browser portability failures can expose an invalid oracle rather than a slow browser. Magento's
  cached header counter was useful telemetry but not authoritative cart state.
- Recovery-assisted green is valuable exploratory coverage only when the recovery is impossible to
  miss in logs and excluded from promotion evidence.
- A framework upgrade suggested by `npm audit fix --force` can broaden the runtime/platform change
  far beyond the vulnerable leaf. Inspect engine and peer constraints before accepting it.

---

## Recommendations / Next Steps

- [ ] Observe Firefox and WebKit on the next eligible weekly/main CI runs against backlog Item #15's
  12/12 and zero-recovery gate. — MEDIUM, operational evidence
- [ ] Once one engine has three consecutive qualifying runs and its fallback is unnecessary, remove
  that fallback and set `continue-on-error: false` for that engine only. — MEDIUM, conditional on
  backlog Item #15 evidence
- [ ] Reconcile the portfolio registry to resting/zero outstanding after this project PR is merged.
  — HIGH, cross-repository follow-up

---

*Session logged: 2026-07-20. Author: Codex, directed by Gary Brooks.*
