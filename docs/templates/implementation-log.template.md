<!--
  AUDIENCE: Engineers and AI agents reviewing development session history.
  PURPOSE:  Record what was built, what was decided, what broke, and what was learned
            during a development session. Immutable once written — append only.
  LOCATION: docs/implementation-logs/YYYY-MM-DD_short-slug.md
  TEMPLATE: docs/templates/implementation-log.template.md
-->

# [REQUIRED: Topic / Feature / Phase Title] — [REQUIRED: YYYY-MM-DD]

## Session Summary

[REQUIRED: 2–4 sentences. What was the goal? What was achieved? What is the resulting state?]

---

## Objectives

[REQUIRED: Numbered list of what this session set out to do. Mark each as complete or deferred.]

1. ✅ / ❌ / ⏸️ [Objective 1]
2. ✅ / ❌ / ⏸️ [Objective 2]
3. [Add as needed]

---

## Test Results

[REQUIRED if tests were run: Scenarios passing vs total. Omit section if no tests were executed.]

| Feature | Scenarios passing | Total | Status |
|---|---|---|---|
| guest-checkout | [N] | [N] | ✅ PASS / ❌ FAIL |
| cart-management | [N] | [N] | ✅ PASS / ❌ FAIL |
| checkout-validation | [N] | [N] | ✅ PASS / ❌ FAIL |

---

## Changes Implemented

[REQUIRED: One subsection per logical change. Include file paths and brief rationale where non-obvious.]

### [REQUIRED: Change 1 — descriptive title]

**Files changed:**
- `[path/to/file.ext]` — [what changed and why]

[OPTIONAL: code snippet or before/after if the change is subtle]

### [REQUIRED: Change 2 — descriptive title]

[Repeat as needed]

---

## Technical Decisions

[REQUIRED: List decisions made during this session not already in docs/adr/.
 If a decision is structural, create a new ADR in docs/adr/.]

| Decision | Rationale | Alternatives rejected |
|---|---|---|
| [decision] | [why] | [what was considered] |

---

## Documentation Updates

[REQUIRED: List every documentation file modified as a direct result of this session.]

- `[path/to/doc.md]` — [what was updated]

---

## Lessons Learned

[REQUIRED: Key takeaways — what would you do differently? What was surprising? What is a reusable pattern?]

- [lesson 1]
- [lesson 2]

---

## Recommendations / Next Steps

[REQUIRED: What should happen next? Link to docs/backlog.md items or create new ones.]

- [ ] [action 1] — [priority]
- [ ] [action 2]

---

*Session logged: [REQUIRED: YYYY-MM-DD]. Author: [REQUIRED: Gary Brooks / Claude Code / etc.]*
