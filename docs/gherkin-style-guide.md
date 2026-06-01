# Gherkin style guide

The feature files are the specification. They are read by people deciding whether
the behaviour is right, not only by the machine that runs them. This guide sets
the conventions that keep them that way, and shows a bad scenario refactored into
a good one so the reasoning is visible.

Treat the Gherkin as if it were code: atomic, high cohesion, low coupling,
business domain language only.

## Principles

Scenarios are declarative. They describe what the user is trying to achieve, not
which buttons get clicked. UI mechanics belong in the Tasks and Interactions, not
in the feature file.

Steps are reusable and phrased consistently. The same intent is written the same
way every time, so one step definition serves many scenarios. Near-duplicate steps
that say the same thing in slightly different words are a defect.

Background carries setup. Product availability, guest context, and a pre-seeded
cart are arranged in the Background and resolved through the API ability, never by
clicking through the UI.

Money is written as a bare number, "45.00" rather than "£45.00", to stay
currency-agnostic and avoid locale-format fragility. Currency formatting, if it
needs testing, gets its own dedicated scenario.

Assertions are on the subtotal, not the grand total. Subtotal is price times
quantity and is stable. Grand total pulls in shipping and tax, which depend on
store configuration and are fragile. Tax and shipping calculation, if added, get
their own feature with controlled configuration.

## Composite versus granular steps

Use granular checkout steps when the steps themselves are the subject of the test,
for example when validating each stage of checkout. Use the composite step,
`I complete checkout with valid details`, when checkout is just the plumbing
needed to reach an assertion, for example in the quantity Scenario Outline where
the subject is the subtotal, not the checkout flow.

## A bad scenario refactored

> Placeholder for the worked example. The intent is to show a scenario written
> with UI mechanics and incidental detail leaking in, then the same behaviour
> rewritten declaratively, with commentary on each change and why it matters.

```gherkin
# Before (illustrative placeholder)
# Scenario: buy a bag
#   Given I open "https://store.example/push-it-bag"
#   When I click the "#add-to-cart" button
#   And I wait 5 seconds
#   And I click "Proceed to Checkout"
#   ...
```

```gherkin
# After (illustrative placeholder)
# Scenario: Complete a guest order with valid details
#   When I add "Push It Messenger Bag" to my cart
#   And I proceed to checkout
#   ...
```

To be completed alongside the first Tasks, so the example reflects the real step
library rather than an invented one.
