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
  // Read-only subset: excludes scenarios that place an order (@placesOrder) and
  // scenarios that depend on the deterministic decline module (@usesDeclineModule
  // — payment-failure submits a checkout and so is not read-only / not
  // shared-store-safe), so it is safe to run against a shared or non-resettable
  // storefront (e.g. a public demo). Tag-based filtering is used because CLI
  // path/line arguments do not reliably override the default profile's path glob.
  // See backlog #9.
  smoke: {
    ...common,
    paths: ['features/**/*.feature'],
    tags: 'not @deferred and not @placesOrder and not @usesDeclineModule'
  }
};
