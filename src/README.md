# Source layout

The implementation follows the Screenplay pattern. The layers below map onto the
folders in `src/`. The guiding rule is that each layer speaks at one level of
abstraction, and step definitions stay thin.

## How a step flows through the layers

A Gherkin step lands in a step definition, which is glue and nothing more. The
step definition asks an Actor to perform a Task. The Task is written in domain
language and is composed of smaller Interactions, which use an Ability to act on
the system. Assertions are made by asking the Actor a Question.

```
features/  ->  step-definitions/  ->  tasks/  ->  interactions/  ->  abilities
                                         |
                                     questions/   (for assertions)
```

## Folders

`actors/` holds the cast and the configuration of Abilities. Abilities are what
an Actor can do: `BrowseTheWeb` (Playwright) for the UI, `CallAnApi` for data
setup and teardown. The actor is bound generically, `actorCalled('User')`; no
named personas.

`tasks/` holds the high-level actions an Actor performs, for example `AddToCart`,
`ProceedThroughCheckout`, `ProvideShippingDetails`. Tasks read like the Gherkin
steps that drive them.

`interactions/` holds custom low-level steps where the framework's built-in
Interactions are not enough.

`questions/` holds the things an Actor can ask about the system state, for example
`TheCartTotal`, `TheOrderConfirmation`. Questions feed assertions.

`api/` holds the REST client used for test-data setup and teardown, backing the
`CallAnApi` ability. See ADR 0003.

`step-definitions/` holds the Cucumber glue that maps Gherkin to Tasks. It should
stay thin: parse the step, delegate to a Task, no logic of its own.
