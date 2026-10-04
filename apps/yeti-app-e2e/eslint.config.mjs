import playwright from 'eslint-plugin-playwright';
import baseConfig from '../../eslint.config.mjs';

export default [
  playwright.configs['flat/recommended'],
  ...baseConfig,
  {
    files: ['**/*.ts', '**/*.js'],
    rules: {
      'playwright/no-skipped-test': ['warn', { allowConditional: true }],
      'playwright/expect-expect': [
        'warn',
        { assertFunctionNames: ['expectHoverLifts', 'expectHydrationFrames'] },
      ],
      // A test narrows a nullable box or attribute before it uses it, and
      // asserts a production-only claim (inlined critical CSS) or records it
      // instead, as the departures table of the ngx-yeti-specs skill says;
      // splitting each such test in two would repeat its whole setup.
      'playwright/no-conditional-in-test': 'off',
      'playwright/no-conditional-expect': 'off',
    },
  },
];
