import { Task } from '@serenity-js/core';
import { Navigate } from '@serenity-js/web';
import { BASE_URL } from '../serenity.config';

export const BrowseStorefront = {
    asGuest: () =>
        Task.where('#actor opens the storefront as a guest',
            Navigate.to(BASE_URL),
        ),
};
