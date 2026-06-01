Feature: Cart management
  As a guest shopper
  I want to manage the contents of my cart
  So that I order exactly what I intend to buy

  Background:
    Given a product "Push It Messenger Bag" priced at "45.00" is available
    And a product "Fusion Backpack" priced at "59.00" is available
    And I am browsing the storefront as a guest

  Scenario: Add a single product to an empty cart
    When I add "Push It Messenger Bag" to my cart
    Then my cart should contain 1 item

  Scenario: Add multiple distinct products to the cart
    When I add "Push It Messenger Bag" to my cart
    And I add "Fusion Backpack" to my cart
    Then my cart should contain 2 items
    And the cart subtotal should be "104.00"

  Scenario: Update the quantity of an item in the cart
    Given I have "Push It Messenger Bag" in my cart with quantity 1
    When I update the quantity of "Push It Messenger Bag" to 3
    Then my cart should contain 3 items
    And the cart subtotal should be "135.00"

  Scenario: Remove an item from the cart
    Given I have "Push It Messenger Bag" in my cart with quantity 1
    When I remove "Push It Messenger Bag" from my cart
    Then my cart should be empty
