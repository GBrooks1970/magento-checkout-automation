# ACTIVATED (backlog #2): runs against a deterministic always-declining payment
# method, Portfolio_DeclinePayment (code `declinepayment`), baked into the CI
# store image. It declines every transaction with no real PSP, network call, or
# credentials — so this scenario reliably exercises the storefront's decline
# handling. See docs/adr/0005-deterministic-payment-failure.md. The former
# @deferred quarantine tag has been removed; this now runs in the default profile.

@usesDeclineModule
Feature: Payment failure handling
  As a guest shopper
  I want to be informed when my payment is declined
  So that I can retry with a different payment method

  Background:
    Given a product "Push It Messenger Bag" priced at "45.00" is available
    And I have "Push It Messenger Bag" in my cart with quantity 1
    And I am browsing the storefront as a guest

  Scenario: Declined card payment is reported to the shopper
    When I proceed to checkout
    And I provide valid shipping details
    And I select a shipping method
    And I provide payment details for a card that will be declined
    And I attempt to place the order
    Then the order should not be placed
    And I should see a payment failure message
    And I should remain on the checkout page with my cart intact
