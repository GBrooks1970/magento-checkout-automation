import { Task } from '@serenity-js/core';
import { PlaceTheOrder } from './PlaceTheOrder';
import { ProvidePaymentDetails } from './ProvidePaymentDetails';
import { ProvideShippingDetails } from './ProvideShippingDetails';
import { SelectShippingMethod } from './SelectShippingMethod';

export const CompleteCheckout = {
    withValidDetails: () =>
        Task.where('#actor completes checkout with valid details',
            ProvideShippingDetails.valid(),
            SelectShippingMethod.flatRate(),
            ProvidePaymentDetails.checkMoneyOrder(),
            PlaceTheOrder.now(),
        ),
};
