# Recommendations

[<- Back to Index](00_CODE_REVIEW_CLAUDE_v1_20260610T1127Z.md) | [Next: Architecture Assessment ->](06_ARCHITECTURE_ASSESSMENT.md)

**Reviewer:** AI assistant (CLAUDE Fable 5)

## Recommended Refactors (priority order)

- **Docs reconciliation pass (R-01).** One docs-only push to `main` fixing screenplay-guide.md (lifecycle, abilities, hooks, question inventory), README Status, architecture.md, qa-strategy.md, features/_manifest.md, adr/README.md (add 0005), gherkin-style-guide.md composite-step paragraph, and docker-magento-setup.md "Still open". Highest value-to-effort ratio in this review.
- **Local reproducibility (R-02).** Default `BASE_URL` to `http://localhost:8080` (or fail fast); add runbook step 6e installing Portfolio_DeclinePayment locally; document the pull-based local bring-up via `docker-compose.ci.yml`; re-validate or drop the Magebit smoke path now that Backgrounds need admin API access.
- **Dependency pinning (R-04).** Exact-pin `@serenity-js/*`, `@cucumber/cucumber`, `@playwright/test`; declare `playwright` explicitly; reconcile ADR version claims. Code change is one file plus a lockfile refresh.
- **Decline-path hardening (R-05).** Scope `paymentErrorMessage` to the checkout messages region; add the "the observer is the real mechanism" comment to di.xml/DeclineCommand; consider a shared constant or cross-reference for the decline message text.
- **Dead-code prune (R-07).** Delete unused Questions/PageElements; decide `CompleteCheckout`'s fate (delete + update style guide and ADR-0001 example, or re-adopt in a feature); fix the stale 30 s comment.

## Next Steps (immediate action items)

- Run the docs reconciliation and dead-code prune as two small changes (docs direct to `main`; code via PR per the working norms), gated by `npx tsc --noEmit` + dry-run.
- Extend CI preflight to manifest-inspect **both** GHCR images, and add `-f`/code-check to the warm-up curls ([ci.yml](.github/workflows/ci.yml)) - two-line changes that close real recorded failure modes.
- Decide the R-03 posture explicitly: either implement API guest-cart seeding or amend ADR-0003/style guide to the as-built claim. Record the decision (new ADR or 0003 amendment) either way.
- Add a one-sentence README note on the publish-on-failure Pages policy and the report's two-stage artifact path (R-10).
- Update the portfolio root's session-notes handover (v10 is one session stale) so the next agent does not re-derive the #2 completion - the same staleness this review hit on entry.

## Future Project Ideas (long-term enhancements)

- **API-driven guest-cart seeding** (Magento `guest-carts` REST endpoints + masked-quote-to-session binding) - completes the headline pattern and is a genuinely instructive Magento problem; pairs with a new ADR.
- **A thin unit/component tier**: PHPUnit for the observer; a few Vitest/Jest tests for pure TypeScript helpers if any grow (e.g. a future test-data module) - converts the Test Pyramid gap from "absent" to "proportionate".
- **Flake-trend telemetry**: persist per-run scenario timings/outcomes (the Serenity JSON already contains them) to a small dashboard or a committed CSV per main run, demonstrating the "demonstrably non-flaky" claim with longitudinal data rather than a point-in-time badge.
- **Digest-pinned image promotion**: bake to a unique tag, verify, then promote by digest via PR - closes the mutable-tag window (R-06) and demonstrates supply-chain thinking.
- **The hand-rolled Screenplay companion repo** already envisioned in [ADR-0002](docs/adr/0002-use-serenity-js.md) (lines 13-17) - the strongest cross-repo story this portfolio could add.

---

[<- Previous: Cross-Project Analysis](04_CROSS_PROJECT_ANALYSIS.md) | [Back to Index](00_CODE_REVIEW_CLAUDE_v1_20260610T1127Z.md) | [Next: Architecture Assessment ->](06_ARCHITECTURE_ASSESSMENT.md)
