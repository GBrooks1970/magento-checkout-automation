<?php
/**
 * A deterministic always-decline payment command.
 *
 * TEST FIXTURE, not a real payment integration. It exists so the portfolio's
 * payment-failure.feature scenario has a payment method that fails every time,
 * exercising the storefront's decline-handling path without a real PSP, network
 * call, or credentials. See docs/adr/0005-deterministic-payment-failure.md.
 */
declare(strict_types=1);

namespace Portfolio\DeclinePayment\Gateway\Command;

use Magento\Framework\Phrase;
use Magento\Payment\Gateway\Command\CommandException;
use Magento\Payment\Gateway\CommandInterface;

class DeclineCommand implements CommandInterface
{
    /**
     * Always declines. Throwing CommandException is the gateway contract for a
     * declined transaction: Magento aborts order placement and surfaces the
     * message to the shopper on the checkout page, leaving the quote (cart) intact.
     *
     * @param array $commandSubject
     * @return void
     * @throws CommandException
     */
    public function execute(array $commandSubject)
    {
        throw new CommandException(
            new Phrase('Your payment was declined. Please try a different payment method.')
        );
    }
}
