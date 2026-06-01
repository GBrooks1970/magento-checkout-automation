# 0001. Use the Screenplay pattern over Page Objects

Status: Accepted

## Context

The suite drives a multi-step, state-dependent checkout. Page Objects are the
default pattern for UI automation, but they tend to grow into large classes that
mix locators, navigation, and assertions. As a journey gains steps, Page Objects
accumulate coupling, and the test reads as a sequence of method calls rather than
a description of intent.

The portfolio sets out to demonstrate architecture, not scripting. The pattern
choice is the first place that distinction shows.

## Decision

Use the Screenplay pattern. Actors perform Tasks through Abilities and ask
Questions. Tasks are composed from lower-level Interactions and read like the
Gherkin steps that drive them.

## Consequences

Tests describe what an actor does, in domain language, which keeps the step
definitions thin and the intent legible. Composition replaces inheritance, so
behaviour is reused by assembling small Tasks rather than extending base page
classes.

The trade-off is a steeper initial learning curve and more files for a given
behaviour than a Page Object would need. For a small script this is overhead;
for a journey of this shape, the readability and low coupling pay it back. The
pattern is also less familiar to some reviewers, which is why this record exists.

> Skeleton. Expand with a concrete before/after example once the happy-path
> Tasks exist in `src/tasks/`.
