# Migration Strategy and Plans

[<- Back to Index](00_CODE_REVIEW_CLAUDE_v1_20260610T1127Z.md) | [Next: Annex - Metrics ->](ANNEX/METRICS.md)

**Reviewer:** AI assistant (CLAUDE Fable 5)

Three forward plans, per the template. "Current status" reflects HEAD `d50bb8a`.

## Plan 1: Single Source of Truth for Features

- **Current status:** Feature files are already the single executable specification; suite membership is defined once in [cucumber.js](cucumber.js) profiles; shared step vocabulary is listed in [features/_manifest.md](features/_manifest.md). The drift is in *descriptive* metadata: the manifest's CI column and several docs assert membership/states the profiles no longer produce.
- Make the manifest's per-feature "CI" column derivable, not asserted: a tiny npm script (`cucumber-js --dry-run --format json` per profile) can emit the active/excluded table; regenerate it in CI and fail on diff, so the manifest can never silently lie again.
- Move scenario-state semantics fully into tags: the quarantine workflow already defines `@deferred` (and qa-strategy mentions `@pending`); document the tag taxonomy in one place (the manifest) and reference it from qa-strategy and the style guide instead of restating it.
- Treat [backlog.md](docs/backlog.md) as the *only* status narrative: replace duplicated status prose in README/architecture/qa-strategy with one-line pointers to the backlog, shrinking the surface that can drift (the root cause of R-01).
- Extract shared test data referenced by multiple layers (product names, prices, slugs, the decline-message phrase) into a single `test-data` module consumed by steps/tasks, with the Gherkin remaining the human-readable mirror - eliminates the PHP/TS message duplication (R-05) at the same time.
- Acceptance: a grep for "payment-failure" across docs returns consistent state claims; CI fails if the regenerated manifest table differs from the committed one.

## Plan 2: Docker Compose for Local Development

- **Current status:** A pinned, healthchecked six-service stack ([docker-compose.yml](docker-compose.yml)) validated end-to-end, plus a CI overlay swapping in pre-baked GHCR images. Local bring-up currently means the full ~30-40 min install runbook - and produces a store *without* the decline module (R-02).
- Promote the pull-based path to the default local route: document `docker compose -f docker-compose.yml -f docker-compose.ci.yml up -d --wait` in the README as "fastest local store" - the images are public, so this needs no secrets and lands an identical store to CI, decline module included.
- Keep the install runbook as the from-source route (it is also the bake's specification), and add the missing module-install step 6e so both routes converge on the same store state.
- Script the from-source route (`scripts/install-store.sh`, mirroring bake.yml steps 2-6e) so the runbook and the bake can never drift apart again - the runbook becomes the script's narrative.
- Add a `make`/npm convenience layer (`store:up`, `store:up:prebaked`, `store:down`) so the compose-file pairing is not something users must remember; keep `down` *without* `-v` as the default to preserve the seeded store, matching the documented working norm.
- Acceptance: a fresh machine reaches a green `npm test` (all 12 scenarios) from the README alone, via either route, with `BASE_URL` defaulting sensibly (R-02 fix).

## Plan 3: GitHub Actions / Workflow

- **Current status:** Mature two-workflow design - `bake.yml` (manual, secret-gated, self-validating image builder) and `ci.yml` (secret-free e2e with preflight gate, warm-up, Serenity report, Pages deploy on main). Badge green; Pages live. Recorded pipeline time ~15-25 min.
- Close the preflight gap: manifest-inspect both images (the empty-db incident is the recorded counterexample to "they ship together"); fail the warm-up step on non-200 codes so a half-up store dies with the right diagnosis.
- Move to immutable image promotion: bake to `:2.4.8-<run_number>`, smoke it, then bump `docker-compose.ci.yml` by PR (or pin by digest) - turns a bad re-bake from a silent global change into a reviewable diff (R-06).
- Parameterise the registry owner (`ghcr.io/${{ github.repository_owner }}/...` in workflows; env substitution or documented edit for the overlay) so forks work without hand-editing three files.
- Add a scheduled (`cron`) weekly run of the e2e workflow: with pushes infrequent on a finished portfolio, the badge's freshness decays; a weekly run keeps "demonstrably non-flaky" a live claim and catches GHCR/runner/upstream rot.
- Consider artifact retention for failed runs (Playwright traces/screenshots on failure uploaded as workflow artifacts) - currently the Serenity report is the only failure evidence, and it lacks browser-level traces.
- Acceptance: preflight covers both images; a re-bake cannot alter `main` CI without a commit; a fork's first push reaches the neutral-skip preflight path unmodified.

---

[<- Previous: Architecture Assessment](06_ARCHITECTURE_ASSESSMENT.md) | [Back to Index](00_CODE_REVIEW_CLAUDE_v1_20260610T1127Z.md) | [Next: Annex - Metrics ->](ANNEX/METRICS.md)
