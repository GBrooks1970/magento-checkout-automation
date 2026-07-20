import { Numeric } from '@serenity-js/core';
import { Value } from '@serenity-js/web';
import { CartPage } from '../interactions/CartPage';

// The header counter is a Knockout customer-data cache and can stay empty or
// stale even after the server-rendered cart is correct. Sum the authoritative
// cart-row quantities for the hard assertion; the header remains a soft signal.
export const CartTotalQuantity = () =>
    Numeric.sum(
        CartPage.items
            .eachMappedTo(Value.of(CartPage.itemQuantity))
            .eachMappedTo(Numeric.intValue()),
    ).describedAs('total cart quantity');
