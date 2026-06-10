<?php
/**
 * Portfolio_CartSeed — TEST FIXTURE module (see ADR-0006).
 *
 * Lets the automation suite seed a guest cart through the REST API
 * (POST /V1/guest-carts + /items) and then bind that quote to the browser
 * session via a frontend adopt endpoint, completing the "API setup,
 * UI assertion" pattern (ADR-0003) for cart preconditions.
 *
 * NEVER install on a non-test store. The adopt endpoint is gated behind the
 * cartseed/general/active config flag, which defaults to OFF.
 */
declare(strict_types=1);

use Magento\Framework\Component\ComponentRegistrar;

ComponentRegistrar::register(
    ComponentRegistrar::MODULE,
    'Portfolio_CartSeed',
    __DIR__
);
