const common = {
  require: [
    'src/step-definitions/**/*.ts'
  ],
  requireModule: [
    'ts-node/register'
  ],
  format: [
    '@serenity-js/cucumber',
    'progress-bar'
  ],
  formatOptions: {
    serenityConfig: './src/serenity.config.ts'
  },
  tags: 'not @deferred',
  strict: true
};

module.exports = {
  default: {
    ...common,
    paths: ['features/**/*.feature']
  }
};
