<?php
/**
 * Portfolio_DeclinePayment — a TEST FIXTURE module.
 *
 * Registers a payment method that declines every transaction, so the
 * portfolio's payment-failure.feature scenario can exercise the storefront's
 * decline-handling path deterministically, with no real PSP, network call, or
 * credentials. See docs/adr/0005-deterministic-payment-failure.md.
 */
declare(strict_types=1);

use Magento\Framework\Component\ComponentRegistrar;

ComponentRegistrar::register(
    ComponentRegistrar::MODULE,
    'Portfolio_DeclinePayment',
    __DIR__
);
