const common = {
  require: [
    'src/serenity.config.ts',
    'src/hooks/**/*.ts',
    'src/step-definitions/**/*.ts'
  ],
  requireModule: [
    'ts-node/register'
  ],
  // The Serenity adapter must be the ONLY formatter targeting stdout. Cucumber
  // allows a single stdout formatter and silently drops the others — with
  // 'progress-bar' listed after the adapter, the adapter was never instantiated,
  // so no Serenity events flowed and no JSON report data was ever written
  // (proven by a minimal probe, 2026-06-11: adapter alone → ConsoleReporter
  // narrative + scenario JSON in docs/reports; adapter + progress → neither).
  // Scenario-by-scenario console output now comes from Serenity's
  // ConsoleReporter (configured in src/serenity.config.ts), which replaces the
  // progress dots with a fuller narrative.
  format: [
    '@serenity-js/cucumber'
  ],
  tags: 'not @deferred',
  strict: true
};

module.exports = {
  default: {
    ...common,
    paths: ['features/**/*.feature']
  },
  // Non-ordering subset (CODEX-03): excludes scenarios that place an order
  // (@placesOrder) and scenarios that depend on the deterministic decline module
  // (@usesDeclineModule). It is NOT read-only and NOT shared-store-safe — the
  // included cart and checkout-validation scenarios still MUTATE state (they add
  // items to the cart and submit the shipping step), so it requires a dedicated,
  // resettable target (the disposable Docker store), not a shared or public
  // storefront. What it guarantees is only that no order is placed and the always-
  // declining fixture is not exercised. Tag-based filtering is used because CLI
  // path/line arguments do not reliably override the default profile's path glob.
  // See backlog #9.
  smoke: {
    ...common,
    paths: ['features/**/*.feature'],
    tags: 'not @deferred and not @placesOrder and not @usesDeclineModule'
  }
};
