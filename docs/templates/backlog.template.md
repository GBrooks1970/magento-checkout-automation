<!--
  AUDIENCE: Engineers, AI agents, and project leads maintaining work-in-progress tracking.
  PURPOSE:  Single source of truth for outstanding work, risks, and improvement items
            for this project.
  LOCATION: docs/backlog.md
  TEMPLATE: docs/templates/backlog.template.md
-->

# [REQUIRED: Project Name] — Backlog

**Version:** [REQUIRED: N] — [REQUIRED: brief version note]
**Last Updated:** [REQUIRED: YYYY-MM-DD]
**Based on:** [OPTIONAL: link to code review, audit, or session notes that produced this version]

[REQUIRED: One sentence describing what this backlog tracks and the ordering principle used.]

**Priority Scoring System:**
- **Score = Breakage Probability (0–10) + Portfolio Impact (0–10) + Maintenance Burden (0–10)**
- **HIGH (20–30):** Blocking — immediate action required
- **MEDIUM (10–19):** Important — schedule within current phase
- **LOW (0–9):** Desirable — schedule when capacity allows

---

## Outstanding Items

Items are ordered by priority score (highest first).

### HIGH Priority (Score: 20–30)

#### Item #[N]: [REQUIRED: Title] — Score: [N]

**Priority Score:** Breakage Probability ([N]) + Portfolio Impact ([N]) + Maintenance Burden ([N]) = **[N] points**
**Impact:** [REQUIRED: one sentence]
**Effort:** [REQUIRED: estimated hours]
**Status:** [REQUIRED: READY TO START | IN PROGRESS | BLOCKED | COMPLETE]
**Area:** [REQUIRED: e.g. CI, Implementation, Documentation, Infrastructure]

**Problem:**
[REQUIRED: Detailed description of the issue.]

**Resolution Strategy:**
[REQUIRED: Steps to resolve.]

**Success Criteria:**
- [ ] [criterion 1]
- [ ] [criterion 2]

---

### MEDIUM Priority (Score: 10–19)

[Repeat item block as needed]

---

### LOW Priority (Score: 0–9)

[Repeat item block as needed]

---

### Resolved Items

[REQUIRED: Keep resolved items — they are a record that the gap existed.]

#### [Item title] ✅ Resolved [YYYY-MM-DD]

**Resolution:** [Brief summary of what was done.]
**See:** [link to implementation log, commit, or PR]

---

## Summary

| Priority | Count | Total Effort | Status Distribution |
|---|---|---|---|
| HIGH (20–30) | [N] | [N–N hrs] | [distribution] |
| MEDIUM (10–19) | [N] | [N–N hrs] | [distribution] |
| LOW (0–9) | [N] | [N–N hrs] | [distribution] |
| **Total Outstanding** | **[N]** | **[N–N hrs]** | |
| Resolved | [N] | [N hrs completed] | |

---

## Portfolio Credibility Checklist

Tracks the items from the session notes that must be in place before the portfolio is reviewer-ready.

| Item | Status | Backlog ref |
|---|---|---|
| Commit history shows specs before implementation | ✅ Done | — |
| ADRs complete with concrete examples | [ ] | Item #[N] |
| Green CI badge, demonstrably non-flaky | [ ] | Item #[N] |
| Living documentation published (GitHub Pages) | [ ] | Item #[N] |
| Gherkin style guide with refactor example | [ ] | Item #[N] |
| Quarantine strategy demonstrated (`@deferred`) | ✅ Scaffolded | — |

---

## Phase Plan

| Phase | Items | Effort | Status |
|---|---|---|---|
| Phase 4 — CI target decision | [list] | [N hrs] | [status] |
| Phase 5 — Portfolio polish | [list] | [N hrs] | [status] |

---

## Maintenance Notes

- Update version and date when items change status
- Keep resolved items — do not delete them
- Cross-reference implementation logs in `docs/implementation-logs/` when items are resolved
- Link ADR entries where a resolution requires a formal decision record
