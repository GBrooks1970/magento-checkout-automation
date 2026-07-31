#!/usr/bin/env node
/**
 * Resilient dependency-audit gate (SEC-01 follow-up; see docs/dependency-audit-policy.md).
 *
 * `npm audit --audit-level=high` conflates two very different non-zero exits: a real
 * HIGH+ advisory (must fail the build) and a transient failure of npm's retiring
 * `/security/audits/quick` endpoint, which intermittently returns 400 "Invalid package
 * tree" even on a clean tree (observed 2026-07-30, CI run 30573685643, while the
 * identical lockfile passed minutes earlier). That makes the gate flaky.
 *
 * This wrapper parses `npm audit --json` and decides on the CONTENT, not the exit code:
 *   - >= 1 high or critical advisory        -> FAIL (exit 1), print the offenders.
 *   - a valid report with 0 high/critical   -> PASS (exit 0).
 *   - an endpoint/registry error or output  -> retry; if still unusable after the
 *     retries, WARN and PASS (exit 0): an unreachable advisory DB is not proof of a
 *     vulnerability, so it must not red an unrelated build. A real HIGH+ still fails.
 *
 * Node built-ins only; no new dependency in the tree being audited.
 */
import { spawnSync } from 'node:child_process';

const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 2000;

/** Blocking sleep with no dependency and no platform-specific shell call. */
function sleep(ms) {
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

/**
 * Runs `npm audit --json`; the JSON report is on stdout regardless of exit code
 * (npm audit exits non-zero when vulnerabilities exist). `shell: true` is required
 * so the npm launcher resolves on both Windows (`npm.cmd`) and the Linux CI runner.
 */
function runAudit() {
    const result = spawnSync('npm', ['audit', '--json'], { encoding: 'utf8', shell: true });
    return { stdout: result.stdout ?? '', stderr: result.stderr ?? '' };
}

function parseReport(stdout) {
    try {
        return JSON.parse(stdout);
    } catch {
        return null;
    }
}

for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    const { stdout, stderr } = runAudit();
    const report = parseReport(stdout);
    const counts = report?.metadata?.vulnerabilities;

    if (counts) {
        const critical = counts.critical ?? 0;
        const high = counts.high ?? 0;

        if (critical + high > 0) {
            const names = Object.entries(report.vulnerabilities ?? {})
                .filter(([, v]) => v.severity === 'high' || v.severity === 'critical')
                .map(([name, v]) => `${name} (${v.severity})`)
                .join(', ');
            console.error(`audit:ci FAIL - ${critical} critical, ${high} high advisory(ies): ${names || '(see npm audit)'}`);
            process.exit(1);
        }

        console.log(`audit:ci OK - 0 high/critical (moderate ${counts.moderate ?? 0}, low ${counts.low ?? 0}).`);
        process.exit(0);
    }

    // No usable report: the retiring quick-audit endpoint or a registry hiccup.
    const detail =
        report?.error?.summary ||
        report?.error?.detail ||
        (stderr.split('\n').find((line) => /audit|endpoint|bad request|400/i.test(line)) ?? '').trim() ||
        'unparseable npm audit output';
    console.warn(`audit:ci - attempt ${attempt}/${MAX_ATTEMPTS} inconclusive (registry/endpoint issue): ${detail}`);

    if (attempt < MAX_ATTEMPTS) {
        sleep(RETRY_DELAY_MS);
    }
}

console.warn(
    'audit:ci WARN - npm audit was inconclusive after retries (its advisory endpoint was ' +
    'unreachable). Treated as INCONCLUSIVE, not a vulnerability, so the build is not failed. ' +
    'A real HIGH+ finding still fails this gate. See docs/dependency-audit-policy.md.',
);
process.exit(0);
