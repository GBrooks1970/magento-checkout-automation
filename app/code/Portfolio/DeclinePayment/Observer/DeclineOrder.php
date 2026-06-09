<?php
/**
 * Forces order placement to fail for the declinepayment test method.
 *
 * Fires on sales_model_service_quote_submit_before (during quote submission,
 * before the order is saved). Throwing here aborts placement deterministically
 * and leaves the quote (cart) intact, so the storefront shows the decline
 * message and the shopper stays on checkout. This is the reliable decline
 * trigger for the test method — the gateway authorize command was not invoked
 * by offline-style placement. See ADR-0005 / backlog #2.
 */
declare(strict_types=1);

namespace Portfolio\DeclinePayment\Observer;

use Magento\Framework\Event\Observer;
use Magento\Framework\Event\ObserverInterface;
use Magento\Framework\Exception\LocalizedException;

class DeclineOrder implements ObserverInterface
{
    /**
     * @param Observer $observer
     * @return void
     * @throws LocalizedException
     */
    public function execute(Observer $observer): void
    {
        $quote = $observer->getEvent()->getData('quote');
        $payment = $quote ? $quote->getPayment() : null;

        if ($payment && $payment->getMethod() === 'declinepayment') {
            throw new LocalizedException(
                __('Your payment was declined. Please try a different payment method.')
            );
        }
    }
}
