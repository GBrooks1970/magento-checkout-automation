# Recommendations

[<- Previous: Cross-Cutting Analysis](04_CROSS_PROJECT_ANALYSIS.md) | [Back to Index](00_CODE_REVIEW_CODEX_v1_20260723T2335Z.md) | [Next: Architecture Assessment ->](06_ARCHITECTURE_ASSESSMENT.md)

**Reviewer:** AI assistant (OpenAI Codex, GPT-5)
**Date:** 2026-07-23T23:35Z

## Recommended Refactors

- **P1 - Enforce the test-target boundary:** bind port 8080 to loopback and default the decline
  payment method off. Preserve explicit fixture activation in bake/local setup.
- **P1 - Strengthen validation evidence:** add a positive required-field invalid-state assertion
  before asserting that payment remains hidden.
- **P1 - Correct execution contracts:** rename smoke as non-ordering/dedicated-target and make the
  documented quarantine tag match Cucumber filters.
- **P2 - Add a fast policy-test layer:** cover engine selection, wait tiers, screenshot modes,
  auth host gating, trace retention, and route recovery; include it in `npm run verify`.
- **P2 - Refresh and reduce current-state documentation:** update guides, then link historical
  detail to logs instead of duplicating values.

## Next Steps

1. Create one bounded safety PR for Risk 1 and verify Compose from the host plus CI.
2. Create one test-correctness PR for Risks 2-4, including dry-run selection evidence and a live
   validation scenario run against the Docker store.
3. Decide whether the resting project should accept a small unit-test dependency; if yes, implement
   Risk 5 as a separate architecture PR.
4. Add Pages deployment concurrency and content pins when next touching CI.
5. Refresh the guides after behaviour changes land so the docs describe the final state once.

## Future Project Ideas

- Promote proposal 0004 into a focused accessibility smoke only if the owner wants a new committed
  learning objective; do not silently expand the resting backlog.
- Convert MAG-15 recovery telemetry into an uploaded per-engine summary so promotion evidence is
  queryable without reading raw logs.
- Add a catalogue-only, genuinely read-only probe for externally hosted Magento targets.
- Add a contract test around baked image metadata: Magento version, module state, fixture flags,
  and digest.

## Recorded Owner Questions

The review ran unattended, so these questions are recorded rather than blocking:

1. Is the local Magento port intentionally reachable from other machines, or should loopback be
   the enforced boundary?
2. Should `smoke` remain a non-ordering cart suite for dedicated stores, or should a separate
   genuinely read-only profile be added?
3. Which quarantine vocabulary is canonical for future flakes: `@deferred` or `@pending`?
4. Does the owner want ongoing freshness automation for this resting reference project, or a
   documented manual cadence?

## Acceptance Evidence for the First Work Wave

- `docker compose config` shows `127.0.0.1:8080` as the host binding.
- The decline method is disabled from module defaults and enabled only by explicit test-store
  setup.
- The missing-details scenario observes a positive validation state and then non-advancement.
- Dry-run fixtures prove both profiles exclude the canonical quarantine tag.
- Smoke documentation says whether it creates guest carts and whether cleanup is provided.

---

[<- Previous: Cross-Cutting Analysis](04_CROSS_PROJECT_ANALYSIS.md) | [Back to Index](00_CODE_REVIEW_CODEX_v1_20260723T2335Z.md) | [Next: Architecture Assessment ->](06_ARCHITECTURE_ASSESSMENT.md)
