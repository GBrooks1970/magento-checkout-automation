# Magento Phase 4 WebKit investigation

Authorised 2026-11-09. Baseline main 6882115, run 42683170305: Chromium and Firefox pass, WebKit 0/12. Failures cluster around cart mutations and checkout entry.

Reproduce one failing scenario on the pinned hosted runner and capture browser errors and request status. Compare against the normal storefront contract, repair the demonstrated cause, then validate the full WebKit and required Chromium suites, reporting the existing promotion policy separately. Save the evidence and open a PR for review.
