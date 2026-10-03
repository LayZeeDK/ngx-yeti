import playwright from 'eslint-plugin-playwright';
import baseConfig from '../../eslint.config.mjs';

export default [
  playwright.configs['flat/recommended'],
  ...baseConfig,
  {
    files: ['**/*.ts', '**/*.js'],
    rules: {
      // A skip with a condition and a reason (a build or engine without the
      // feature under test) is deliberate; a bare skip still warns.
      'playwright/no-skipped-test': ['warn', { allowConditional: true }],
    },
  },
];
