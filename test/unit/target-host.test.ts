import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { isLocalhostTarget } from '../../src/config/target-host';

describe('isLocalhostTarget (credential-safety boundary, R-09)', () => {
    test('true only for the local Docker test targets (case-insensitive host)', () => {
        for (const url of [
            'http://localhost:8080',
            'https://LOCALHOST',
            'http://127.0.0.1',
            'http://127.0.0.1:8080',
            'http://[::1]:8080',
        ]) {
            assert.equal(isLocalhostTarget(url), true, url);
        }
    });

    test('false for real stores, LAN hosts, and unparseable input', () => {
        for (const url of [
            'https://magento2-demo.magebit.com',
            'http://example.com',
            'http://192.168.1.10',
            'http://127.0.0.1.evil.com',
            'not-a-url',
            '',
        ]) {
            assert.equal(isLocalhostTarget(url), false, url);
        }
    });
});
