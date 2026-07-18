# Architecture Assessment

[<- Back to Index](00_CODE_REVIEW_CLAUDE_Fable_5_v2_20260718T0033Z.md) | [Next: Migration Plans ->](07_MIGRATION_PLANS.md)

**Reviewer:** AI assistant (CLAUDE Fable 5)
**Date:** 2026-07-18T00:33Z

## Test Pyramid

- Deliberately inverted for a UI-automation showcase: 12 E2E scenarios, no unit or integration
  tier. Defensible - the subject *is* the E2E architecture - and partially mitigated by pushing
  setup below the UI (API Background on every scenario) and by CI-level guards acting as
  pipeline "unit tests" (preflight, warm-up assertions, scenario-count guard).
- Gap acknowledged rather than hidden: pure logic that could be unit-tested (slug map, env
  resolution, `slugFor`) is trivial in size; adding a unit tier would be ceremony here (YAGNI).

## SOLID Principles

- **SRP:** strong - each Task/Question/Interaction file owns one behaviour; hooks own lifecycle;
  the API client owns preconditions; `screenshots.ts` owns capture policy.
- **OCP:** the crew assembly (`...(photo ? [photo] : [])` in
  [src/serenity.config.ts](src/serenity.config.ts) (line 25)) and the dual-path hooks extend
  behaviour by addition, not modification - the TRACE path is a textbook open-for-extension
  change that left the closed default path untouched.
- **LSP/ISP:** N/A at class level (functional/composition style, no inheritance hierarchies);
  Screenplay's Ability interfaces provide the practical interface segregation.
- **DIP:** step definitions depend on Task abstractions, not Playwright APIs; the single direct
  Playwright dependency outside hooks is the deliberate `engage` wiring. Good.

## KISS

- The suite consistently chooses the simplest robust mechanism: label-click for hidden radios,
  attribute assertions over visibility for KO.js-occluded fields, cookie-clear reset over
  context recreation. Comments explain each choice.
- The CI YAML is long but linear; complexity lives in comments, not control flow. The only
  genuinely subtle behaviour (step-skip semantics after failure) is where Risk 2 hides -
  simplicity of the publish path has slightly outrun its correctness.

## YAGNI

- Well observed: dev-only Docker services dropped; `CompleteCheckout` pruned when it became
  unused; screenshots/trace both land as opt-in gates rather than always-on machinery; the slug
  map stays hard-coded until a third product exists.
- The three-engine matrix is the one place ambition ran ahead of need - wired before the timing
  model could support it (Risk 3) - though the non-blocking design contains the damage.

## REST + OpenAPI

- Correct, minimal consumption of Magento's REST V1 contract with status and shape assertions;
  errors surface actionable diagnostics. No OpenAPI authoring required (consumer role);
  the in-repo `CartSeed` endpoint is documented in ADR-0006 where a spec would otherwise live.

## ISTQB Strategies

- Equivalence partitioning and boundary flavour in the quantity outline (1/2/3 with subtotal
  verification at a real Magento surface); negative testing in checkout-validation (invalid
  email, incomplete details) and payment-failure (deterministic decline); state-transition
  thinking evident in the checkout step sequencing and the non-advancement assertions.
- Decision-table and use-case techniques are implicit rather than named; a short mapping note in
  `docs/qa-strategy.md` would make the ISTQB alignment explicit for reviewers who look for it.

## Pedagogical Comments

- Exceptional - the repo's defining quality. Comments explain *why*, cite evidence (CI run
  numbers, probes, incidents), and are placed at the exact point a future maintainer would be
  tempted to "simplify" a hard-won fix (hook lifecycle, formatter slot, cookie-clear ordering,
  outline-aggregation count). The style is consistent across TS, YAML, and compose files.

---

[<- Previous: Recommendations](05_RECOMMENDATIONS.md) | [Back to Index](00_CODE_REVIEW_CLAUDE_Fable_5_v2_20260718T0033Z.md) | [Next: Migration Plans ->](07_MIGRATION_PLANS.md)
