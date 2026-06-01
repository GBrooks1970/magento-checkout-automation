Feature: Checkout validation
  As a guest shopper
  I want to be told when my checkout details are incomplete or invalid
  So that I can correct them before placing an order

  Background:
    Given a product "Push It Messenger Bag" priced at "45.00" is available
    And I have "Push It Messenger Bag" in my cart with quantity 1
    And I am browsing the storefront as a guest

  Scenario: Reject checkout with missing shipping details
    When I proceed to checkout
    And I provide incomplete shipping details
    Then I should not be able to advance to payment
    And I should see a validation message

  Scenario: Reject checkout with an invalid email
    When I proceed to checkout
    And I provide shipping details with email "not-an-email"
    Then I should not be able to advance to payment
    And I should see a validation message
