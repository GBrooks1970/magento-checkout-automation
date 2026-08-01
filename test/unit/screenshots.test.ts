import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { resolveMode } from '../../src/config/screenshots';

const originalScreens = process.env.SCREENSHOTS;
const originalCI = process.env.CI;
const restore = (key: 'SCREENSHOTS' | 'CI', value: string | undefined) => {
    if (value === undefined) {
        delete process.env[key];
    } else {
        process.env[key] = value;
    }
};
afterEach(() => {
    restore('SCREENSHOTS', originalScreens);
    restore('CI', originalCI);
});

describe('resolveMode (screenshot modes / defaults)', () => {
    test('an explicit SCREENSHOTS value wins, case-insensitively', () => {
        const cases: Array<[string, string]> = [
            ['off', 'off'],
            ['Failures', 'failures'],
            ['ALL', 'all'],
        ];
        for (const [input, expected] of cases) {
            process.env.SCREENSHOTS = input;
            assert.equal(resolveMode(), expected, input);
        }
    });

    test('with no override, defaults to off in CI and all locally', () => {
        delete process.env.SCREENSHOTS;
        process.env.CI = 'true';
        assert.equal(resolveMode(), 'off');
        process.env.CI = 'false';
        assert.equal(resolveMode(), 'all');
        delete process.env.CI;
        assert.equal(resolveMode(), 'all');
    });

    test('an unrecognised SCREENSHOTS value falls back to the environment default', () => {
        process.env.SCREENSHOTS = 'yes-please';
        delete process.env.CI;
        assert.equal(resolveMode(), 'all');
    });
});
