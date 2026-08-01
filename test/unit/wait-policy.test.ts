import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { browserEngine, waitPolicyFor } from '../../src/config/wait-durations';

const original = process.env.BROWSER;
afterEach(() => {
    if (original === undefined) {
        delete process.env.BROWSER;
    } else {
        process.env.BROWSER = original;
    }
});

describe('browserEngine (browser selection)', () => {
    test('defaults to chromium when BROWSER is unset', () => {
        delete process.env.BROWSER;
        assert.equal(browserEngine(), 'chromium');
    });

    test('accepts chromium/firefox/webkit case-insensitively and trimmed', () => {
        const cases: Array<[string, string]> = [
            ['firefox', 'firefox'],
            ['WEBKIT', 'webkit'],
            ['  Chromium  ', 'chromium'],
        ];
        for (const [input, expected] of cases) {
            process.env.BROWSER = input;
            assert.equal(browserEngine(), expected, input);
        }
    });

    test('throws loudly on an unsupported engine (invalid input)', () => {
        process.env.BROWSER = 'safari';
        assert.throws(() => browserEngine(), /Unsupported BROWSER/);
    });
});

describe('waitPolicyFor (engine wait tiers)', () => {
    test('chromium tier is the documented baseline', () => {
        assert.deepEqual(waitPolicyFor('chromium'), {
            responsiveUi: 15,
            asynchronousUpdate: 25,
            complexRender: 30,
            routeTransition: 15,
            cucumberStep: 90,
        });
    });

    test('firefox and webkit widen the render/async/step ceilings', () => {
        assert.equal(waitPolicyFor('firefox').complexRender, 45);
        assert.equal(waitPolicyFor('webkit').complexRender, 60);
        assert.equal(waitPolicyFor('webkit').cucumberStep, 180);

        // Monotonic: webkit >= firefox >= chromium on the tiers that scale with engine speed.
        for (const tier of ['responsiveUi', 'asynchronousUpdate', 'complexRender', 'cucumberStep'] as const) {
            assert.ok(
                waitPolicyFor('webkit')[tier] >= waitPolicyFor('firefox')[tier],
                `webkit ${tier} >= firefox`,
            );
            assert.ok(
                waitPolicyFor('firefox')[tier] >= waitPolicyFor('chromium')[tier],
                `firefox ${tier} >= chromium`,
            );
        }
    });
});
