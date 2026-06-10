# Architecture Decision Records

Short records of the significant architectural choices in this repository, with
the reasoning that produced them. Architects justify decisions; this folder is
the evidence of that, rather than the assertion of it.

Each record states the context, the decision, and the consequences, including
the trade-offs accepted. A decision without a named trade-off is not finished.

## Format

ADRs follow the lightweight Nygard format. Status is one of Proposed, Accepted,
Superseded, or Deprecated. Records are numbered and append-only: a reversed
decision gets a new ADR that supersedes the old one, rather than an edit.

## Index

| ADR | Title | Status |
|---|---|---|
| [0001](0001-use-screenplay-over-page-objects.md) | Use the Screenplay pattern over Page Objects | Accepted |
| [0002](0002-use-serenity-js.md) | Use Serenity/JS rather than hand-rolling Screenplay | Accepted |
| [0003](0003-api-driven-test-data-setup.md) | Set up test data through the API, assert through the UI | Accepted |
| [0004](0004-playwright-over-cypress.md) | Use Playwright as the UI driver, over Cypress | Accepted |
| [0005](0005-deterministic-payment-failure.md) | Deterministic payment failure via a custom always-decline module | Accepted |
