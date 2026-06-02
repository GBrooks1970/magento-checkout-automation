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
  }
};
