import { Interaction, Task, Wait } from '@serenity-js/core';
import { PlaywrightPage } from '@serenity-js/playwright';
import { Click, Navigate, isVisible } from '@serenity-js/web';
import { CartPage } from '../interactions/CartPage';
import { waitFor } from '../config/wait-durations';

// Magento delegates data-post clicks through a widget on the document.
const WaitForCartPostHandler = Interaction.where(
    '#actor waits for Magento to initialise cart post actions',
    async actor => {
        const page = await (await actor.answer(PlaywrightPage.current())).nativePage();
        await page.waitForFunction(
            "Boolean(window.jQuery && window.jQuery.data(document, 'mage-dataPost'))",
            undefined,
            { timeout: waitFor.asynchronousUpdate.inMilliseconds() },
        );
    },
);

export const RemoveFromCart = {
    product: (productName: string) =>
        Task.where(`#actor removes "${productName}" from their cart`,
            Navigate.to(CartPage.url()),
            Wait.upTo(waitFor.asynchronousUpdate).until(CartPage.deleteButtonFor(productName), isVisible()),
            WaitForCartPostHandler,
            Click.on(CartPage.deleteButtonFor(productName)),
            // Removing the last item triggers Magento's AJAX cart-empty
            // transition, which exceeds Serenity's 5 s default wait on the
            // slower CI runner (passed locally). Allow up to 15 s.
            Wait.upTo(waitFor.asynchronousUpdate).until(CartPage.emptyCartMessage, isVisible()),
        ),
};
