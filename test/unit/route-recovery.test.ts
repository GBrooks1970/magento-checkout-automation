import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { needsBootstrapReload, routeRecovery } from '../../src/config/route-recovery';

describe('routeRecovery (Chromium no-recovery contract, MAG-15)', () => {
    test('chromium re-throws (never conceals a broken button); firefox/webkit navigate to recover', () => {
        assert.equal(routeRecovery('chromium'), 'throw');
        assert.equal(routeRecovery('firefox'), 'navigate');
        assert.equal(routeRecovery('webkit'), 'navigate');
    });
});

describe('needsBootstrapReload (exploratory-engine recovery eligibility, MAG-15)', () => {
    test('only webkit needs the canonical bootstrap reload after reaching /checkout', () => {
        assert.equal(needsBootstrapReload('webkit'), true);
        assert.equal(needsBootstrapReload('chromium'), false);
        assert.equal(needsBootstrapReload('firefox'), false);
    });
});
