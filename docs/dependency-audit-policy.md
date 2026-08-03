# Dependency audit and freshness policy

**Status:** Executable policy (SEC-01, from code review `CLAUDE_Opus_4_8 v2`, 2026-07-30). This is
the single source of truth for how dependency vulnerabilities gate the build, and for the manual
freshness cadence around them. SEC-01 subsumes the former worklist item CODEX-11 (CODEX review v1
Risk 8): an enforced gate replaces a documented-only cadence, and CODEX-11's residual manual review
notes are recorded here.

## The gate

```
npm run audit:ci    # -> node scripts/audit-ci.mjs (parses `npm audit --json`)
```

- **Severity threshold: `high`.** The gate fails the build on any advisory of **high** or
  **critical** severity, across runtime and dev/test dependencies (a compromised test toolchain is
  still a supply-chain risk). Moderate and low findings are reported but do not fail the gate; they
  are triaged into the backlog instead.
- **Resilient to npm's retiring audit endpoint.** `npm audit` conflates two different non-zero
  exits: a real HIGH+ finding, and a transient failure of npm's legacy `/security/audits/quick`
  endpoint (which is being retired and intermittently returns `400 "Invalid package tree"` even on
  a clean tree - observed 2026-07-30, CI run 30573685643, while the identical lockfile passed
  minutes earlier). [scripts/audit-ci.mjs](../scripts/audit-ci.mjs) therefore decides on the JSON
  **content**, not the exit code: `>= 1` high/critical advisory fails; a valid report with none
  passes; an endpoint/registry error is **retried** (3 attempts) and, if still unusable, treated as
  **inconclusive** - it warns and does not red the build, because an unreachable advisory database
  is not proof of a vulnerability. A real HIGH+ still fails the gate. Node built-ins only; no new
  dependency in the tree being audited.
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
- **GitHub Actions SHA review** - the workflow actions are pinned to full commit SHAs (CODEX-08, see
  the runbook below); the pins are periodically re-reviewed and refreshed to the current patch of the
  same major.
- **Base-image / GHCR digest review** - the baked Magento store images are digest-pinned in
  `docker-compose.ci.yml` (CODEX-09); the pins and the markoshust base images are checked for
  security refreshes, adopting a fresh bake (whose digest the bake run summary prints) when one is
  warranted.
- **Serenity / Node / Playwright upgrade boundary** - the Serenity-JS suite, Node engine floor
  (`>=20`), and Playwright are upgraded deliberately, verifying the single-stdout-formatter
  constraint and the `@serenity-js/cucumber` supported range each time.

A finding opens **required backlog work** when it is a HIGH+ advisory, a security refresh of a
consumed image, or an upgrade blocking a supported-version boundary; anything else may be recorded
as an **accepted deferred update** with a dated note.

## GitHub Actions pin runbook (CODEX-08)

Every `uses:` in [.github/workflows/ci.yml](../.github/workflows/ci.yml) and
[.github/workflows/bake.yml](../.github/workflows/bake.yml) is pinned to a **full 40-character commit
SHA** with a trailing `# vX.Y.Z` comment recording the human-readable version it resolves to. A
mutable tag (`@v4`) lets the referenced code change with no repository diff; a SHA is immutable, so
what CI executes is exactly what was reviewed. The comment is the only thing a reader scans; the SHA
is the thing Actions runs.

Currently pinned (all at the latest patch of their reviewed major — a SHA pin is supply-chain
hardening, **not** a version bump):

| Action | Version | SHA |
|---|---|---|
| `actions/checkout` | v4.4.0 | `11d5960a326750d5838078e36cf38b85af677262` |
| `actions/setup-node` | v4.4.0 | `49933ea5288caeca8642d1e84afbd3f7d6820020` |
| `actions/upload-pages-artifact` | v3.0.1 | `56afc609e74202658d3ffba0e8f6dda462b719fa` |
| `actions/deploy-pages` | v4.0.5 | `d6db90164ac5ed86f2b6aed7e0febac5b3c0c03e` |
| `docker/login-action` | v3.7.0 | `c94ce9fb468520275223c153574b00df6fe4bcc9` |

**To refresh a pin** (quarterly, or when a security advisory or required feature forces it):

1. Pick the target release. Stay within the reviewed major unless a major bump is a deliberate,
   separately-reviewed change (e.g. `actions/checkout@v5` moves the action runtime to Node 24 and
   would clear the Node-20-action deprecation annotations — a behaviour change, not a pin refresh).
   List releases with `gh api repos/<owner>/<action>/releases --jq '.[].tag_name'`.
2. Resolve that tag to its commit SHA, dereferencing annotated tags to the underlying commit:

   ```bash
   TAG=v4.4.0; REPO=actions/checkout
   REF=$(gh api repos/$REPO/git/ref/tags/$TAG --jq '.object.sha')
   TYPE=$(gh api repos/$REPO/git/ref/tags/$TAG --jq '.object.type')
   [ "$TYPE" = tag ] && REF=$(gh api repos/$REPO/git/tags/$REF --jq '.object.sha')
   echo "$REPO@$TAG -> $REF"
   ```

3. Replace the SHA **and** update the trailing `# vX.Y.Z` comment together — a stale comment is worse
   than none. Update the table above.
4. Open the change as a normal branch + PR; the required Chromium gate re-runs every pinned action,
   proving the new SHA works before merge.

Dependabot's `github-actions` ecosystem, if later enabled, keeps SHA pins current automatically and
rewrites the version comment for you — the manual runbook above is the fallback until then.
