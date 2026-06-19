<!--
  AUDIENCE: Engineers and AI agents working in this repository.
  PURPOSE:  Register of future-work proposals + a record of which have been delivered.
  LOCATION: docs/planning/
  NOTE:     The project was closed on 2026-06-19 (terminal handover v16) and then
            reopened the same day to deliver item 0001. Items 0002-0007 remain
            proposals, not committed work. The source of truth for delivered work
            is docs/backlog.md.
-->

# Future Work — proposals and delivery record

This folder holds **proposals**, plus a record of which have since been delivered. The project
shipped its bounded scope (one guest-checkout journey, 12 scenarios / 94 steps green, living
documentation published) and was closed on 2026-06-19, then reopened the same day to deliver
**0001 (screenshots in the report)** — now committed as backlog Item #12. Items 0002–0007 remain
improvements a future maintainer could pick up — each is recorded here so the thinking is not lost.

**Status vocabulary:** `Proposed` (idea captured) → `Designed` (a design + implementation plan
exists in this folder) → `Accepted` (moved into `docs/backlog.md` as committed work) →
`Done` (delivered; leaves this register).

## Register

| # | Proposal | Status | Design doc | Rough effort |
|---|---|---|---|---|
| 0001 | Screenshots in the test reports (CI/local configurable) | ✅ **Done** (backlog #12, ADR-0007) | [0001-screenshots-in-test-reports.md](0001-screenshots-in-test-reports.md) | 3–5 h |
| 0002 | Trace + video capture on failure (CI debugging) | Proposed | — | 2–4 h |
| 0003 | Cross-browser run matrix (Firefox / WebKit) | Proposed | — | 4–6 h |
| 0004 | Accessibility smoke checks on key pages | Proposed | — | 4–8 h |
| 0005 | Visual-regression baseline on the checkout pages | Proposed | — | 6–10 h |
| 0006 | Scheduled "freshness" CI run + dependency/image drift watch | Proposed | — | 3–5 h |
| 0007 | Performance budget on checkout page loads | Proposed | — | 5–8 h |

---

## 0001 — Screenshots in the test reports

Fully designed. See **[0001-screenshots-in-test-reports.md](0001-screenshots-in-test-reports.md)**
for the design, the configuration model (CI vs local, default screenshots **on** locally), the
implementation plan, validation steps, and the trade-offs.

---

## Further proposals (sketches)

These are lighter-weight ideas — captured enough to triage, not yet designed. Each notes the
problem it solves, a one-line implementation sketch, and the main trade-off.

### 0002 — Trace + video capture on failure

**Problem.** When a CI scenario fails, the only forensic evidence today is the Serenity narrative
and (once 0001 lands) a failure screenshot. A single still frame often does not explain a
Knockout.js timing failure — what the page was doing *before* the assertion matters.

**Sketch.** Enable Playwright tracing and video on the browser context for failed scenarios:
`browser.newContext({ recordVideo: …, /* trace via context.tracing.start */ })`, started in
`Before` and discarded on pass / archived on fail (attach the `.zip` trace + `.webm` as Serenity
artifacts alongside the failure screenshot). Gate it the same way as 0001 — off by default,
opt-in via an env var (e.g. `TRACE=on-failure`), and **on locally only when explicitly asked**
(traces are large).

**Trade-off.** Tracing changes the context-creation path, which the per-scenario isolation reset
(`browser.hooks.ts`) is carefully tuned around — see the cart-leak lesson (backlog #10). Any
trace work must re-verify isolation, because recreating the context per scenario is exactly what
that code deliberately avoids. This coupling is why it is a separate, later proposal rather than a
rider on 0001.

### 0003 — Cross-browser run matrix (Firefox / WebKit)

**Problem.** The suite only ever runs on Chromium. "Works in Chromium" is not "works in the
storefront" — Luma's Knockout.js checkout can behave differently across engines.

**Sketch.** Parameterise the browser launch in `browser.hooks.ts` by a `BROWSER`
env var (`chromium` | `firefox` | `webkit`, default `chromium`) and add a CI matrix dimension.
Keep Chromium the required gate; Firefox/WebKit as **non-blocking** matrix legs first, promoting
to required only once green and stable.

**Trade-off.** Triples CI minutes on the slowest part of the pipeline and will surface
engine-specific selector/timing drift that needs real triage — budget for the findings, not just
the wiring.

### 0004 — Accessibility smoke checks on key pages

**Problem.** A checkout journey is exactly where accessibility failures hurt real users, yet the
suite asserts nothing about a11y.

**Sketch.** Run `axe-core` against the storefront, cart, and checkout pages as a small additional
Screenplay question (a `PerformAccessibilityScan` interaction), asserting **no new** critical/
serious violations against a committed baseline (Magento core will have pre-existing ones — gate
on regressions, not absolute zero). Surface the violations as a Serenity artifact.

**Trade-off.** Magento core ships with known a11y issues, so a zero-tolerance gate is unrealistic;
a baseline-diff approach needs the baseline curated and re-reviewed when Magento is re-baked.

### 0005 — Visual-regression baseline on the checkout pages

**Problem.** Layout/style regressions in the checkout are invisible to functional assertions.

**Sketch.** Capture deterministic screenshots of stable checkout states (masking dynamic regions —
order numbers, dates) and diff against committed baselines (Playwright's `toHaveScreenshot` or a
Serenity-archived comparison). Run only against the pinned, pre-baked store so pixels are stable.

**Trade-off.** Visual baselines are notoriously flaky across fonts/renderers and OS; they need the
single pinned image (`:2.4.8-b<run>`) and a tolerance policy, and they add a baseline-maintenance
burden on every intentional UI change. Highest-effort, lowest-certainty item here — depends on
0001's screenshot plumbing landing first.

### 0006 — Scheduled "freshness" CI run + dependency/image drift watch

**Problem.** The project is closed with pinned dependencies and a pinned GHCR bake
(`:2.4.8-b24`). Pins silently rot: an image gets pruned, a transitive dep gets a CVE, GitHub
Actions versions deprecate. The terminal handover's "if reopened, check these first" list is
exactly what a schedule could check automatically.

**Sketch.** A scheduled (`cron`) GitHub Actions workflow that re-runs the suite on `main` weekly
and runs `npm audit` + a check that the pinned GHCR images still pull, opening an issue on
failure. Keeps the green badge **honestly** green rather than green-as-of-last-merge.

**Trade-off.** A scheduled job on a closed project needs an owner for the issues it raises,
otherwise it just generates noise. Cheap to build; only worth it if someone watches it.

### 0007 — Performance budget on checkout page loads

**Problem.** The suite proves the checkout *works*, not that it is *fast*. Cold-store render
penalties have already bitten the test timing (the CI warm-up step exists because of it).

**Sketch.** Capture navigation timings (e.g. `page.evaluate(() => performance.timing)` or a CDP
performance trace) for the key page transitions and assert against a generous budget, reported as
a Serenity artifact. Run against the warmed store only, to measure steady-state not cold-start.

**Trade-off.** Performance numbers on a single-container Docker store are not production-representative;
the budget would catch gross regressions only, and must be lenient enough not to flake on a busy CI
runner. Document it as indicative, not a production SLO.
