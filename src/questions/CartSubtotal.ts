import { Text } from '@serenity-js/web';
import { CartPage } from '../interactions/CartPage';

export const CartSubtotal = () =>
    Text.of(CartPage.subtotal).describedAs('cart subtotal');
