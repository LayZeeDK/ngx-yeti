// @ts-check
import baseConfig, { playwrightConfig } from '../../eslint.config.mjs';

export default [
  playwrightConfig,
  ...baseConfig,
  {
    files: ['**/*.ts', '**/*.js'],
    rules: {
      // Each lane walks its own reader's keys and asserts its own wording.
      'playwright/no-conditional-in-test': 'off',
      'playwright/no-conditional-expect': 'off',
    },
  },
];
