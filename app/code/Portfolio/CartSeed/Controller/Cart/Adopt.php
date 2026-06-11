<?php
/**
 * Binds an API-created guest quote to the CURRENT browser session.
 *
 * TEST FIXTURE, not a shop feature (see ADR-0006). Magento's REST guest-cart
 * endpoints (POST /V1/guest-carts, POST /V1/guest-carts/{id}/items) create and
 * fill a quote, but core Magento offers no way to attach that quote to a
 * storefront session — the session→quote link lives server-side in
 * checkout/session and the only core re-binding API (PUT /V1/guest-carts/{id})
 * assigns the cart to a logged-in CUSTOMER, not a guest session. This endpoint
 * closes that gap for the automation suite:
 *
 *   GET /cartseed/cart/adopt?id=<maskedQuoteId>
 *
 * resolves the masked id, loads the active quote, and replaces the session's
 * quote with it, so the browser that made the request now owns the seeded cart.
 *
 * Deliberate properties:
 * - GET with a side effect: wrong for a real feature, right for a test hook the
 *   suite drives via a plain browser navigation.
 * - Gated by cartseed/general/active (default 0): on a store where the flag is
 *   off the route 404s, because an open quote-swap endpoint would let any
 *   visitor adopt any masked cart id.
 */
declare(strict_types=1);

namespace Portfolio\CartSeed\Controller\Cart;

use Magento\Checkout\Model\Session as CheckoutSession;
use Magento\Framework\App\Action\HttpGetActionInterface;
use Magento\Framework\App\Config\ScopeConfigInterface;
use Magento\Framework\App\RequestInterface;
use Magento\Framework\Controller\Result\Json;
use Magento\Framework\Controller\Result\JsonFactory;
use Magento\Framework\Exception\NoSuchEntityException;
use Magento\Framework\Exception\NotFoundException;
use Magento\Quote\Api\CartRepositoryInterface;
use Magento\Quote\Model\MaskedQuoteIdToQuoteIdInterface;

class Adopt implements HttpGetActionInterface
{
    private RequestInterface $request;
    private JsonFactory $jsonFactory;
    private MaskedQuoteIdToQuoteIdInterface $maskedQuoteIdToQuoteId;
    private CartRepositoryInterface $cartRepository;
    private CheckoutSession $checkoutSession;
    private ScopeConfigInterface $scopeConfig;

    public function __construct(
        RequestInterface $request,
        JsonFactory $jsonFactory,
        MaskedQuoteIdToQuoteIdInterface $maskedQuoteIdToQuoteId,
        CartRepositoryInterface $cartRepository,
        CheckoutSession $checkoutSession,
        ScopeConfigInterface $scopeConfig
    ) {
        $this->request = $request;
        $this->jsonFactory = $jsonFactory;
        $this->maskedQuoteIdToQuoteId = $maskedQuoteIdToQuoteId;
        $this->cartRepository = $cartRepository;
        $this->checkoutSession = $checkoutSession;
        $this->scopeConfig = $scopeConfig;
    }

    /**
     * @return Json
     * @throws NotFoundException when the fixture flag is off
     */
    public function execute()
    {
        if (!$this->scopeConfig->isSetFlag('cartseed/general/active')) {
            // Behave exactly like a non-existent route on non-test stores.
            throw new NotFoundException(__('Page not found.'));
        }

        $maskedId = (string)$this->request->getParam('id', '');
        if ($maskedId === '') {
            return $this->jsonFactory->create()
                ->setHttpResponseCode(400)
                ->setData(['ok' => false, 'error' => 'Missing required parameter: id']);
        }

        try {
            $quoteId = $this->maskedQuoteIdToQuoteId->execute($maskedId);
            $quote = $this->cartRepository->getActive($quoteId);
        } catch (NoSuchEntityException $e) {
            return $this->jsonFactory->create()
                ->setHttpResponseCode(404)
                ->setData(['ok' => false, 'error' => 'No active quote for the given masked id']);
        }

        // The actual binding: the current session's quote becomes the seeded one.
        $this->checkoutSession->replaceQuote($quote);

        return $this->jsonFactory->create()->setData([
            'ok'        => true,
            'quote_id'  => (int)$quote->getId(),
            'items_qty' => (float)$quote->getItemsQty(),
        ]);
    }
}
