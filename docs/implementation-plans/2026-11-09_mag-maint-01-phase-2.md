---
version: 1
created: 2026-11-09
project: magento-checkout-automation
type: implementation-plan
item: MAG-MAINT-01 Phase 2
status: approved
approved: 2026-11-09, owner instructed continue to phase 2, including its defined merge and acceptance scope
language: en-GB
---

# Implementation plan: Magento Phase 2 acceptance

## Evidence and authority

Phase 1 code and evidence are saved at `0e32cb40de8d7b81f5dfd5c293fda77db470726c` in PR #68. Required PR run 42528936705 passed audit and 12 Chromium scenarios. Paired v23 is saved in support PR #366 at `baf74d72743ca4c06119d1924db2832bb5c6c773`. Both PRs remain open; primary Magento main is clean at `dfa7086`. The owner explicitly authorised Phase 2 on 2026-11-09. This advances the phase gate in the preserved v2 plan; it does not authorise Phases 3 or 4.

## Steps

1. Refresh PR heads and required checks, mark ready and merge the Phase 1 project and support PRs using expected-head guards.
2. Observe exact-main CI and Pages deployment. Capture required audit/Chromium outcomes separately from exploratory Firefox/WebKit. Download the deployed report artefact and compare representative live report bytes with it, retaining run/SHA/hash evidence.
3. Reconcile README, backlog and dependency policy to accepted main evidence, close MAG-MAINT-01 only after acceptance, retain MAG-MAINT-02 and the exploratory-browser limitation, and save an immutable walkthrough/receipt. Submit and merge this bounded documentation reconciliation through a checked PR.
4. In an isolated portfolio-prompts branch, correct Magento's registry lifecycle from historical resting/closed to active maintenance with remaining moderate work; regenerate the README table and run library validation before PR/merge.
5. Save a paired v24 support handover after acceptance, validate metadata/body parity and manifest discovery, and merge its separate PR. Preserve v23 and all unrelated drafts/primary edits.
6. Safely synchronise primary main copies using the Cowork wrapper's adoption flow, preserving dirty changes; record any overlap that prevents safe adoption. Confirm final main CI/publication and clean owned worktrees.

## Gates and stop

Existing required audit and Chromium gates remain unchanged. A failing exploratory leg is recorded honestly and is not repaired or promoted in Phase 2. Validate documentation links, evidence hashes, paired handover generation, registry rendering and staged whitespace. Local Docker is unnecessary; its storage remains E:\_DockerData. No moderate dependency upgrade or WebKit repair. Stop at Phase 2 completion until explicit later-phase authorisation.

## Outcome: accepted repair

PR #68 merged as `9b6dd5f`; support PR #366 merged as `c32f4a9`. Exact-main run 42541336270 passed required audit/Chromium and Pages deployment; Firefox passed and exploratory WebKit failed 12/12. Three published pages matched the Pages artefact. MAG-MAINT-01 is resolved; MAG-MAINT-02 remains open. Registry PR #141 merged as `07b5f1c` with main check 42541663540 passing. The registry primary was synchronised while preserving unrelated edits. Project primary is at the accepted repair; final reconciliation-head acceptance and handover are recorded in paired v24 after this documentation PR. No Phase 3 or 4 work is authorised.
