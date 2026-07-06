# Recommendations

[<- Back to Index](00_CODE_REVIEW_CLAUDE_Fable_5_v1_20260706T1048Z.md) | [Next: Architecture Assessment ->](06_ARCHITECTURE_ASSESSMENT.md)

**Reviewer:** AI assistant (CLAUDE Fable 5)
**Date:** 2026-07-06T10:48Z

## Recommended Refactors (priority order)

- **Clear the audit high now:** `npm audit fix` resolves the `form-data` CRLF
  finding within existing semver ranges (evidence:
  [Risk 1](02_RISKS_AND_ISSUES.md#risk-1)); commit the lockfile, re-run gates
  and one CI cycle.
- **Reconcile the README Status section** with the backlog: delivered scope
  #1-#12 complete, Items #13/#14 open ([Risk 2](02_RISKS_AND_ISSUES.md#risk-2)).
- **Declare a licence** - `LICENSE` file plus `package.json` `license` field;
  owner to choose (MIT suggested; question recorded in
  [Risk 3](02_RISKS_AND_ISSUES.md#risk-3) because this review ran unattended).
- **Raise `engines.node` to `>=20`** to match CI and drop the EOL floor
  ([Risk 4](02_RISKS_AND_ISSUES.md#risk-4)).
- **Fix the stale comment path** in `src/config/screenshots.ts` line 14 at the
  next code touch ([Risk 6](02_RISKS_AND_ISSUES.md#risk-6)).

## Next Steps (immediate action items)

- Fold the five refactors above into the next worklist derivation; the first
  two are 10-15 minute items.
- Plan the `@cucumber/cucumber` 11 -> 12 major bump as its own backlog item
  with explicit re-verification of the single-stdout-formatter constraint and
  the Serenity adapter's supported range (the empty-report defect class lives
  exactly there).
- Strengthen the CI Serenity-JSON guard from "at least one non-empty file" to
  "expected scenario count present"
  ([Risk 5](02_RISKS_AND_ISSUES.md#risk-5)) - ideally in the same PR as
  Item #13, which will touch CI anyway.
- Merge or close the open docs-only PR #34 (backlog verification note) so the
  backlog header's date reflects the latest verification pass.

## Future Project Ideas (long-term enhancements)

- Deliver backlogged Items #13 (trace/video on failure - re-verify the
  per-scenario isolation reset after any context-path change, as the backlog
  itself warns) and #14 (Firefox/WebKit matrix, non-blocking legs first).
- Promote proposals 0004-0007 selectively; accessibility smoke checks (0004)
  would add a distinct, hiring-visible competence at low infrastructure cost on
  the pages the suite already visits.
- Consider a scheduled freshness watch (proposal 0006) once Items #13/#14
  land - the pre-baked-image strategy means bit-rot shows up only on push
  today.

---

[<- Previous: Cross-Project Analysis](04_CROSS_PROJECT_ANALYSIS.md) | [Back to Index](00_CODE_REVIEW_CLAUDE_Fable_5_v1_20260706T1048Z.md) | [Next: Architecture Assessment ->](06_ARCHITECTURE_ASSESSMENT.md)
