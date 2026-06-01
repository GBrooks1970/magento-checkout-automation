# 0002. Use Serenity/JS rather than hand-rolling Screenplay

Status: Accepted

## Context

The Screenplay pattern can be implemented from scratch in TypeScript. Doing so
would demonstrate a deep understanding of the pattern. It would also mean
building and maintaining the actor model, the reporting, and the Playwright and
Cucumber integration, none of which is the point this portfolio is trying to
make.

## Decision

Use Serenity/JS. It provides a first-class Screenplay implementation, native
Playwright and Cucumber integration, TypeScript support, and living-documentation
reports out of the box.

## Consequences

The repository gets mature reporting and integration without bespoke
infrastructure, and the code stays focused on test design rather than framework
plumbing. The living documentation is itself a portfolio artifact: a reviewer can
click through narrated, passing scenarios.

The trade-off is a dependency on a third-party framework and its conventions, and
less to show in terms of low-level pattern mechanics. The README notes explicitly
that hand-rolling was understood as an option and declined on purpose. Choosing
not to reinvent the wheel, and being able to say why, is the senior signal here.

> Skeleton. Add version pin and a link to the living-documentation output once
> CI publishes it.
