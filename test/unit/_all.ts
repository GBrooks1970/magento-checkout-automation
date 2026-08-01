/**
 * Entry point for the fast, deterministic policy-test layer (CODEX-05).
 *
 * Imports every `*.test.ts` in this folder so their `node:test` registrations
 * run in one process; node's built-in test runner executes them on load and
 * sets the exit code, so no CLI glob or extra dependency is needed. Run via
 * `npm run test:unit` (`node --require ts-node/register test/unit/_all.ts`),
 * which `npm run verify` invokes before the Cucumber dry-runs. Pure config /
 * policy modules only - no live Magento store, no browser, no network.
 */
import './wait-policy.test';
import './screenshots.test';
import './target-host.test';
import './slugs.test';
import './artifact-retention.test';
import './route-recovery.test';
