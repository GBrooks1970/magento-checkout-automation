# PROJECT 003 - Docker and CI Infrastructure

[<- Back to Index](../00_CODE_REVIEW_CLAUDE_v1_20260610T1127Z.md) | [Next: Cross-Project Analysis ->](../04_CROSS_PROJECT_ANALYSIS.md)

**Reviewer:** AI assistant (CLAUDE Fable 5)

The test-target infrastructure: [docker-compose.yml](../../docker-compose.yml) (six-service pinned stack), [docker-compose.ci.yml](../../docker-compose.ci.yml) (pre-baked image overlay), two Dockerfiles, the nginx vhost override, and the two GitHub Actions workflows ([bake.yml](../../.github/workflows/bake.yml), [ci.yml](../../.github/workflows/ci.yml)).

- **The bake-once/pull-many design is the right call and is well executed.** A ~30-40 min Magento install is amortised into two immutable-ish GHCR images; CI pulls them and relies on documented Docker/MariaDB volume-seeding semantics ([docker-compose.ci.yml](../../docker-compose.ci.yml) (lines 11-24) explains the mechanism rather than assuming it). Recorded CI time ~15-25 min. The overlay-file approach keeps local and CI topologies identical except for two image references - minimal-diff engineering.

- **Self-validating guards are the standout feature.** The bake asserts >=2000 catalog products via SQL ([bake.yml](../../.github/workflows/bake.yml) (lines 185-199)) and a >1 MB DB dump with `set -o pipefail` (lines 226-239) - both guards built from a real shipped failure (the masked `mysqldump` 127 that produced an empty store-db image). This converts "the pipeline went green" into "the artifact is real".

- **Health and ordering discipline:** Every service carries a healthcheck; OpenSearch's 60 s `start_period` is documented with the exact arithmetic that motivated it ([docker-compose.yml](../../docker-compose.yml) (lines 101-110)); the bake deliberately starts nginx only after `nginx.conf` exists (lines 66-72), recording the failure it prevents. The CI warm-up step (cold FPC/OPcache priming) is well reasoned, though it does not fail on non-200 responses (finding R-06).

- **Bootstrap ergonomics:** The preflight job converts "images not yet baked" into a neutral skip with an actionable warning rather than a red X ([ci.yml](../../.github/workflows/ci.yml) (lines 44-81)) - thoughtful for forks and first-time setup. Weakness: it inspects only the app image as "proxy for both", which the project's own incident history contradicts (finding R-06).

- **Secrets posture is clean:** Marketplace keys confined to the `bake` environment; the e2e workflow needs no secrets at all; `auth.json` is stripped before image export and gitignored; permissions blocks are minimal per job (`contents: read`, `packages: write` only where needed; Pages permissions only on deploy).

- **Reproducibility edges:** the mutable `:2.4.8` tag (a re-bake silently rewrites what CI tests), hardcoded `gbrooks1970` registry namespace across three files, and the publish-on-failure Pages policy (intentional, commented, but undocumented for report readers) - all catalogued in finding R-06.

- **Documentation of this layer is the best in the repo:** [docker-magento-setup.md](../../docs/docker-magento-setup.md) records the four bring-up snags with their resolutions and which are solved in-repo, and the CI strategy section explains image contents, seeding, rebuild triggers, and the public-visibility step. Its "Still open" list is stale (finding R-01) and the local install sequence misses the decline module (finding R-02).

---

[<- Previous: PROJECT 002](PROJECT_002_DeclinePayment_Module.md) | [Back to Index](../00_CODE_REVIEW_CLAUDE_v1_20260610T1127Z.md) | [Next: Cross-Project Analysis ->](../04_CROSS_PROJECT_ANALYSIS.md)
