# Recommendations

[<- Back to Index](00_CODE_REVIEW_CLAUDE_Fable_5_v2_20260718T0033Z.md) | [Next: Architecture Assessment ->](06_ARCHITECTURE_ASSESSMENT.md)

**Reviewer:** AI assistant (CLAUDE Fable 5)
**Date:** 2026-07-18T00:33Z

## Recommended Refactors (priority order)

- **Docs reconciliation PR (Risk 1):** backlog header -> v5 with a current Last Updated; #13/#14
  Status fields -> DONE; Summary table -> 0 outstanding; README Status refreshed; CHANGELOG
  entries for the PR #36/#37 waves; an implementation log for PR #37. One small PR, no code.
- **Guard-gated publishing (Risk 2):** give the MAG-C09 guard `if: always()` and an `id`, then
  condition the render and Pages-upload steps on the guard's outcome so a zero/partial-JSON run
  can never republish over the live report, while failing-scenario runs still publish.
- **WebKit follow-up item (Risk 3):** raise backlog #15 for engine-aware wait tuning with
  promotion criteria; until then move the Firefox/WebKit legs to schedule-only (or main-only)
  to stop paying for known-red bring-ups on every PR.
- **Add `npm run verify` (Risk 4):** `tsc --noEmit` + both profile dry-runs; aligns the repo with
  its registry row and gives contributors a store-free gate.
- **Release hygiene (Risk 5):** cut `[1.0.0]` in the CHANGELOG and start `[1.1.0]` for the
  #13/#14 wave.

## Next Steps (immediate action items)

- Merge the docs reconciliation PR before any further lifecycle steps - the backlog is the
  source of truth for every downstream prompt and currently misleads them.
- Update `portfolio-prompts/registry.yml` (row notes + gates) once the repo-side fixes land, and
  re-render the registry table.
- Decide the WebKit matrix policy (accepted-red vs schedule-only) and record it in the backlog
  either way.
- Re-run `bake`-independent CI once after the guard change to confirm the skip/publish semantics
  behave as intended on a forced failure (e.g. a scratch branch with a deliberately broken step).

## Future Project Ideas

- **Engine-aware timing profile:** a small `durations.ts` exposing wait ceilings scaled by
  `BROWSER` (e.g. 1.5x for WebKit), replacing the scattered 15-20s literals; would resolve
  Risk 6's second item structurally.
- **Accessibility smoke lane:** planning proposal 0004 already sketches it; the portfolio's P-08
  accessibility lane (markdown-renderer MR-09) gives a working pattern to copy.
- **Visual regression baseline (proposal 0005)** on the three stable read-only pages, gated the
  same way screenshots/trace were (off by default, env-var opt-in) - consistent with the repo's
  established capture-gating idiom.
- **Scheduled freshness watch (proposal 0006):** a weekly scheduled CI run would catch
  image/registry/Pages rot now that pushes are infrequent.

---

[<- Previous: Cross-Project Analysis](04_CROSS_PROJECT_ANALYSIS.md) | [Back to Index](00_CODE_REVIEW_CLAUDE_Fable_5_v2_20260718T0033Z.md) | [Next: Architecture Assessment ->](06_ARCHITECTURE_ASSESSMENT.md)
