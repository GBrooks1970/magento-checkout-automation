Feature: Guest checkout
  As a guest shopper
  I want to purchase products without registering
  So that I can complete a one-off order quickly

  Background:
    Given a product "Push It Messenger Bag" priced at "45.00" is available
    And I am browsing the storefront as a guest

  @placesOrder
  Scenario: Complete a guest order with valid details
    When I add "Push It Messenger Bag" to my cart
    And I proceed to checkout
    And I provide valid shipping details
    And I select a shipping method
    And I provide valid payment details
    And I place the order
    Then I should see an order confirmation
    And the confirmation should include an order number

  Scenario: Cart reflects the correct total before checkout
    When I add "Push It Messenger Bag" to my cart
    Then my cart should contain 1 item
    And the cart subtotal should be "45.00"

  @placesOrder
  Scenario Outline: Order multiple quantities of a single product
    When I add "Push It Messenger Bag" to my cart with quantity <quantity>
    And I proceed to checkout
    And I provide valid shipping details
    And I select a shipping method
    And I provide valid payment details
    Then the order summary subtotal should be "<subtotal>"
    When I place the order
    Then I should see an order confirmation

    Examples:
      | quantity | subtotal |
      | 1        | 45.00    |
      | 2        | 90.00    |
      | 3        | 135.00   |
