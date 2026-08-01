import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { scenarioFailed, traceDisposition, videoDisposition } from '../../src/config/artifact-retention';

describe('scenarioFailed (pass/fail determination for retention)', () => {
    test('only an explicit PASSED counts as not-failed; anything else (incl. missing) is failed', () => {
        assert.equal(scenarioFailed('PASSED'), false);
        assert.equal(scenarioFailed('FAILED'), true);
        assert.equal(scenarioFailed('AMBIGUOUS'), true);
        assert.equal(scenarioFailed('SKIPPED'), true);
        assert.equal(scenarioFailed(undefined), true);
    });
});

describe('traceDisposition (trace .zip retention)', () => {
    test('retained only for a failed scenario', () => {
        assert.equal(traceDisposition(true), 'retain');
        assert.equal(traceDisposition(false), 'discard');
    });
});

describe('videoDisposition (video .webm retention)', () => {
    test('retain on failure, discard on pass, and none when no video was recorded', () => {
        assert.equal(videoDisposition(true, true), 'retain');
        assert.equal(videoDisposition(true, false), 'discard');
        assert.equal(videoDisposition(false, true), 'none');
        assert.equal(videoDisposition(false, false), 'none');
    });
});
