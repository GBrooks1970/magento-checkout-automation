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

Below is the guest-checkout happy path written badly, then the same behaviour as
it actually appears in `features/guest-checkout.feature`. Every change maps to one
of the principles above; the commentary that follows names the principle and the
cost of getting it wrong.

### Before

```gherkin
Feature: Checkout

  Scenario: buy a bag
    Given I open "https://magento.example.com"
    And I click "Bags" in the top menu
    And I click "Push It Messenger Bag"
    When I click the "#product-addtocart-button" button
    And I wait 5 seconds
    And I click ".showcart"
    And I click "Proceed to Checkout"
    And I type "test@example.com" into "#customer-email"
    And I type "Gary" into "#firstname"
    And I type "Brooks" into "#lastname"
    And I type "1 Test Street" into "input[name='street[0]']"
    And I select "United States" from "#country"
    And I wait 3 seconds
    And I select "Michigan" from "#region_id"
    And I click "input.radio[value='flatrate_flatrate']"
    And I click "Next"
    And I click "#checkmo"
    And I click "button.checkout"
    Then the page should contain "£45.00"
    And the grand total should be "£52.43"
```

### After

```gherkin
Feature: Guest checkout
  As a guest shopper
  I want to purchase products without registering
  So that I can complete a one-off order quickly

  Background:
    Given a product "Push It Messenger Bag" priced at "45.00" is available
    And I am browsing the storefront as a guest

  Scenario: Complete a guest order with valid details
    When I add "Push It Messenger Bag" to my cart
    And I proceed to checkout
    And I provide valid shipping details
    And I select a shipping method
    And I provide valid payment details
    And I place the order
    Then I should see an order confirmation
    And the confirmation should include an order number
```

### What changed, and why it matters

**Declarative, not imperative.** The `before` is a click-by-click transcript:
selectors, menu navigation, form-field IDs. A reviewer reading it cannot tell
whether the *behaviour* is correct, only whether the *script* is faithful. The
`after` states intent — `I add "…" to my cart`, `I proceed to checkout` — and the
mechanics (the `#product-addtocart-button` selector, the cart drawer, the menu
path) move into the Tasks and Interactions where they belong. When Magento reskins
a button, only an Interaction changes; the specification does not.

**No hard waits.** `I wait 5 seconds` and `I wait 3 seconds` are the two worst
lines in the `before`. They are simultaneously too slow (most of the time the
element is ready sooner) and too flaky (sometimes Knockout.js re-renders later than
that). They vanish entirely from the `after`: waiting is `Wait.until(element,
isVisible())` inside the Tasks. A feature file should never mention time.

**Setup belongs in Background, resolved through the API.** The `before` reaches the
product by clicking through the menu — incidental detail that has nothing to do
with what is being tested, and that breaks whenever the catalogue or navigation
changes. The `after` declares the precondition once, `a product "…" priced at
"45.00" is available`, and the API ability arranges it. The scenario starts at the
behaviour under test, not three clicks upstream of it.

**Money is a bare number.** `before` asserts on `"£45.00"`. That couples the test
to a currency symbol and a locale's formatting. The `after` works in `"45.00"`
(see the cart and subtotal scenarios), which `includes()`-matches whatever the
store renders and survives a store-view currency change. Currency formatting, if
it ever needs testing, earns its own dedicated scenario.

**Assert the subtotal, never the grand total.** `before` checks `the grand total
should be "£52.43"` — a number that folds in shipping and tax, both of which depend
on store configuration that this test does not control. It will break the first
time a tax rate or shipping rate is touched, for reasons unrelated to checkout. The
guest-checkout scenarios assert on the subtotal (price × quantity), which is
stable. Tax and shipping get their own feature with controlled configuration.

**One name per intent.** `before` mixes `I click the "…" button`, `I click "…"`,
and `I type "…" into "…"` — three phrasings for two underlying actions, each
needing its own step definition. The `after` reuses a small, consistent vocabulary
(`I add … to my cart`, `I proceed to checkout`) that already serves the cart and
validation features. Consistent phrasing is what lets one step definition cover
many scenarios; near-duplicate steps are a defect.

**A title that describes behaviour.** `buy a bag` names an action; `Complete a
guest order with valid details` names the behaviour and its precondition, so the
scenario reads as a sentence in the living documentation.
