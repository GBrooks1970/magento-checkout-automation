# DEFERRED: Requires a controllable payment gateway that can deterministically
# decline a transaction (e.g. a sandbox/test gateway configured to reject a
# known "magic" card number). This is not reliably achievable on the public
# Magento demo sandbox. Enable this feature only once a Dockerised Magento
# instance is implemented with a configurable test payment method.
#
# Tagged @deferred so it is excluded from CI runs until the above is in place
# (e.g. cucumber --tags "not @deferred").

@deferred
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
    And I place the order
    Then the order should not be placed
    And I should see a payment failure message
    And I should remain on the checkout page with my cart intact
