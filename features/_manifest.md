---
version: 1
created: 2026-06-01T00:00Z
project: test-automation-portfolio
type: manifest
language: en-GB
---

# Feature files manifest

Magento checkout test-automation portfolio. These Gherkin feature files are the
specification (outer loop). Under Spec-Driven Development they are committed
BEFORE step definitions, and the commit history should show that ordering.

## Naming exception

Feature files keep their canonical Cucumber names (`*.feature`, kebab-case),
not the `{project}_{content-type}_v{N}_{timestamp}` pattern from CLAUDE.md
section 5. Cucumber discovers specs by filename and a portfolio reviewer expects
standard repo names. This mirrors the "technical terms keep canonical spelling"
exception in the language rules. Version metadata lives here instead.

## Files

| File | Purpose | CI |
|---|---|---|
| `guest-checkout.feature` | Happy-path guest order, cart-total check, Scenario Outline for multiple quantities. | active |
| `cart-management.feature` | Add single/multiple, update quantity, remove item. | active |
| `checkout-validation.feature` | Sad paths: missing shipping details, invalid email. No payment. | active |
| `payment-failure.feature` | Declined-card handling. Tagged `@deferred`, excluded from CI until a Dockerised Magento with a configurable test gateway exists. | deferred |

## Carry-in note

All four files were carried in verbatim from the drafts produced in the prior
specification session (uploaded 01 June 2026). The `@deferred` header comment on
`payment-failure.feature` is preserved intact, per the handover notes.

## Shared step phrasing (one step definition each, many uses)

- `I add "<product>" to my cart`
- `I add "<product>" to my cart with quantity <n>`
- `I have "<product>" in my cart with quantity <n>`
- `my cart should contain <n> item(s)`
- `the cart subtotal should be "<amount>"`
- `I proceed to checkout`
- `I provide valid shipping details`
- `I select a shipping method`

Money is expressed as bare numbers (`"45.00"`), currency-agnostic. Assertions are
on subtotal (price x qty), not grand total, to avoid shipping/tax config fragility.
