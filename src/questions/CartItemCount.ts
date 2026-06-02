import { Text } from '@serenity-js/web';
import { CartPage } from '../interactions/CartPage';

export const CartItemCount = () =>
    Text.of(CartPage.itemCounter).describedAs('cart item count');
