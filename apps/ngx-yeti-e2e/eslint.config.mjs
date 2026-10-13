// @ts-check
import baseConfig, { playwrightConfig } from '../../eslint.config.mjs';

export default [
  playwrightConfig,
  ...baseConfig,
  {
    files: ['**/*.ts', '**/*.js'],
    rules: {
      // A test skips an engine that cannot run it, with the reason.
      'playwright/no-skipped-test': ['warn', { allowConditional: true }],
      // A test narrows a nullable box before it uses it.
      'playwright/no-conditional-in-test': 'off',
    },
  },
];
