const common = {
  require: [
    'src/serenity.config.ts',
    'src/hooks/**/*.ts',
    'src/step-definitions/**/*.ts'
  ],
  requireModule: [
    'ts-node/register'
  ],
  format: [
    '@serenity-js/cucumber',
    'progress-bar'
  ],
  tags: 'not @deferred',
  strict: true
};

module.exports = {
  default: {
    ...common,
    paths: ['features/**/*.feature']
  },
  // Read-only subset: excludes scenarios that place an order, so it is safe to
  // run against a shared or non-resettable storefront (e.g. a public demo).
  // Tag-based filtering is used because CLI path/line arguments do not reliably
  // override the default profile's path glob. See backlog #9.
  smoke: {
    ...common,
    paths: ['features/**/*.feature'],
    tags: 'not @deferred and not @placesOrder'
  }
};
