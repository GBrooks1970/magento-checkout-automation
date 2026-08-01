import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { artifactSlug } from '../../src/hooks/artifact-slug';
import { productSlug } from '../../src/config/product-slugs';

describe('artifactSlug (deterministic trace/video slug)', () => {
    test('lowercases, collapses non-slug chars, and appends the 8-char id', () => {
        assert.equal(
            artifactSlug('Reject checkout with missing shipping details', 'abcdef1234567890'),
            'reject-checkout-with-missing-shipping-details-abcdef12',
        );
    });

    test('caps the readable part at 64 characters', () => {
        const slug = artifactSlug('a'.repeat(100), 'idididid9999');
        assert.equal(slug, `${'a'.repeat(64)}-idididid`);
    });

    test('is deterministic for the same inputs (id kept verbatim, not lowercased)', () => {
        const a = artifactSlug('Guest checkout', 'zzzz0000ffff');
        const b = artifactSlug('Guest checkout', 'zzzz0000ffff');
        assert.equal(a, b);
        assert.equal(a, 'guest-checkout-zzzz0000');
    });
});

describe('productSlug (product-name -> slug config parsing)', () => {
    test('resolves each configured product', () => {
        assert.equal(productSlug('Push It Messenger Bag'), 'push-it-messenger-bag');
        assert.equal(productSlug('Fusion Backpack'), 'fusion-backpack');
    });

    test('throws with a clear message for an unconfigured product', () => {
        assert.throws(() => productSlug('Unknown Widget'), /No URL slug configured for product: "Unknown Widget"/);
    });
});
