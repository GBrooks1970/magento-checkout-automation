# Dependency audit and freshness policy

**Status:** Executable policy (SEC-01, from code review `CLAUDE_Opus_4_8 v2`, 2026-07-30). This is
the single source of truth for how dependency vulnerabilities gate the build, and for the manual
freshness cadence around them. SEC-01 subsumes the former worklist item CODEX-11 (CODEX review v1
Risk 8): an enforced gate replaces a documented-only cadence, and CODEX-11's residual manual review
notes are recorded here.

## The gate

```
npm run audit:ci    # -> npm audit --audit-level=high
```

- **Severity threshold: `high`.** The command exits non-zero - failing the build - on any advisory
  of **high** or **critical** severity, across runtime and dev/test dependencies (a compromised
  test toolchain is still a supply-chain risk). Moderate and low findings are reported by a plain
  `npm audit` but do not fail the gate; they are triaged into the backlog instead.
- **Where it runs:** a dedicated `audit` job in [.github/workflows/ci.yml](../.github/workflows/ci.yml)
  runs on every push and pull request, **independent of the Docker preflight** - so a transitive
  HIGH is caught even when the store images are not baked, and without running once per browser in
  the matrix `test` job.
- **Local:** run `npm run audit:ci` before committing a lockfile or dependency change; run a bare
  `npm audit` to see the full moderate/low picture.

## Current state

- **0 vulnerabilities** (`npm audit`, 2026-07-30).
- **0 active exceptions.**

## Temporary exceptions

`npm audit` has no native time-boxed allowlist, so an unavoidable HIGH+ finding that cannot yet be
remediated is **recorded here** and the gate is narrowed only for that advisory, never disabled
wholesale. Every exception MUST carry: the advisory id (`GHSA-...`/CVE), the package and dependency
path, an accountable owner, the reason it cannot be remediated now, a hard **expiry** review date,
and a link to the advisory and tracking issue. An exception past its expiry is treated as a failure
at review time. There are no active exceptions today.

## Remediation history

- **`brace-expansion` -> `5.0.8`** (advisory GHSA-mh99-v99m-4gvg, DoS/OOM). A transitive dev-only
  advisory reached the tree via `@cucumber/cucumber -> glob -> minimatch@10.2.5 -> brace-expansion@5.0.7`.
  npm's advisory range is `<=5.0.7`, so `5.0.8` is the clearing release; it is a dual package whose
  `require` export resolves to a CommonJS build, so the CJS `minimatch` consumer still loads it, and
  its `expand()` API is stable. Pinned via `overrides` in [package.json](../package.json); the
  Cypress/Serenity pins are untouched. `npm audit` = 0 after the override.

## Manual freshness cadence (subsumes CODEX-11)

The automated gate covers HIGH+ advisories; the following are reviewed manually on a **quarterly**
cadence (or sooner if an advisory or a required upgrade forces it):

- `npm audit` moderate/low findings - triage into the backlog; do not let them accrete silently.
- `npm outdated` - note majors behind and the reason each is deferred.
- **GitHub Actions SHA review** - third-party actions are periodically re-reviewed (see CODEX-08 when
  actioned; until then actions are tag-pinned).
- **Base-image / GHCR digest review** - the baked Magento store images and the markoshust base
  images are checked for security refreshes (see CODEX-09 for digest pinning when actioned).
- **Serenity / Node / Playwright upgrade boundary** - the Serenity-JS suite, Node engine floor
  (`>=20`), and Playwright are upgraded deliberately, verifying the single-stdout-formatter
  constraint and the `@serenity-js/cucumber` supported range each time.

A finding opens **required backlog work** when it is a HIGH+ advisory, a security refresh of a
consumed image, or an upgrade blocking a supported-version boundary; anything else may be recorded
as an **accepted deferred update** with a dated note.
