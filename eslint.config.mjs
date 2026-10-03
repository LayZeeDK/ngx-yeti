import path from 'node:path';
import eslintComments from '@eslint-community/eslint-plugin-eslint-comments/configs';
import css from '@eslint/css';
import nx from '@nx/eslint-plugin';
import vitest from '@vitest/eslint-plugin';
import angular from 'angular-eslint';
import baselineJs from 'eslint-plugin-baseline-js';
import storybook from 'eslint-plugin-storybook';
import tseslint from 'typescript-eslint';

const typeScriptFiles = ['**/*.ts', '**/*.tsx', '**/*.cts', '**/*.mts'];

// ADR 0002: the browser floor is Baseline 2025, see .browserslistrc.
const baselineYear = 2025;

const moduleBoundaries = {
  enforceBuildableLibDependency: true,
  allow: ['^.*/eslint(\\.base)?\\.config\\.[cm]?[jt]s$'],
  depConstraints: [
    {
      sourceTag: '*',
      onlyDependOnLibsWithTags: ['*'],
    },
  ],
};

// Playwright e2e specs share the *.spec.ts suffix, so only Vitest projects
// spread this.
export const vitestConfig = [
  {
    files: ['**/*.spec.ts'],
    ...vitest.configs.recommended,
    rules: {
      ...vitest.configs.recommended.rules,
      'vitest/consistent-each-for': 'error',
      'vitest/consistent-test-it': 'error',
      'vitest/consistent-vitest-vi': 'error',
      'vitest/hoisted-apis-on-top': 'error',
      'vitest/max-nested-describe': 'error',
      'vitest/no-alias-methods': 'error',
      'vitest/no-conditional-in-test': 'error',
      'vitest/no-conditional-tests': 'error',
      'vitest/no-disabled-tests': 'error',
      'vitest/no-large-snapshots': 'error',
      'vitest/no-test-prefixes': 'error',
      'vitest/no-test-return-statement': 'error',
      'vitest/padding-around-all': 'error',
      'vitest/prefer-comparison-matcher': 'error',
      'vitest/prefer-describe-function-title': 'error',
      'vitest/prefer-each': 'error',
      'vitest/prefer-equality-matcher': 'error',
      'vitest/prefer-expect-resolves': 'error',
      'vitest/prefer-expect-type-of': 'error',
      'vitest/prefer-lowercase-title': 'error',
      'vitest/prefer-mock-promise-shorthand': 'error',
      'vitest/prefer-snapshot-hint': 'error',
      'vitest/prefer-spy-on': 'error',
      'vitest/prefer-strict-boolean-matchers': 'error',
      'vitest/prefer-strict-equal': 'error',
      'vitest/prefer-to-be': 'error',
      'vitest/prefer-to-be-object': 'error',
      'vitest/prefer-to-contain': 'error',
      'vitest/prefer-to-have-been-called-times': 'error',
      'vitest/prefer-to-have-length': 'error',
      'vitest/prefer-todo': 'error',
      'vitest/prefer-vi-mocked': 'error',
      'vitest/require-awaited-expect-poll': 'error',
      'vitest/require-mock-type-parameters': 'error',
      'vitest/require-to-throw-message': 'error',
      'vitest/require-top-level-describe': 'error',
      'vitest/no-hooks': 'error',
      'vitest/valid-title': ['error', { allowArguments: true }],
      'vitest/prefer-expect-assertions': [
        'error',
        { onlyFunctionsWithAsyncKeyword: true },
      ],
      'vitest/max-expects': ['error', { max: 10 }],
      'vitest/consistent-test-filename': [
        'error',
        { pattern: '.*\\.spec\\.[tj]sx?$' },
      ],
      '@typescript-eslint/explicit-function-return-type': 'off',
      // The base rule reports vi.mocked(obj.method) and
      // expect(obj.method).toHaveBeenCalled(), the forms prefer-vi-mocked and
      // prefer-spy-on produce. The vitest variant exempts both.
      '@typescript-eslint/unbound-method': 'off',
      'vitest/unbound-method': 'error',
    },
  },
];

export const angularConfig = [
  ...angular.configs.tsAll.map((config) => ({ ...config, files: ['**/*.ts'] })),
  ...angular.configs.templateAll.map((config) => ({
    ...config,
    files: ['**/*.html'],
  })),
  {
    files: ['**/*.ts'],
    rules: {
      '@angular-eslint/component-class-suffix': 'off',
      '@angular-eslint/directive-class-suffix': 'off',
      '@angular-eslint/require-localize-metadata': 'off',
      '@angular-eslint/runtime-localize': 'off',
      '@typescript-eslint/no-extraneous-class': [
        'error',
        { allowWithDecorator: true },
      ],
    },
  },
  {
    files: ['**/*.html'],
    rules: {
      // Reading a signal is a call expression.
      '@angular-eslint/template/no-call-expression': 'off',
      '@angular-eslint/template/i18n': 'off',
      // Recommends [style.x], which no-inline-styles bans.
      '@angular-eslint/template/prefer-style-binding': 'off',
      // Checks only *ngFor, which prefer-control-flow bans.
      '@angular-eslint/template/use-track-by-function': 'off',
    },
  },
];

export default [
  ...nx.configs['flat/base'],
  ...nx.configs['flat/typescript'],
  ...nx.configs['flat/javascript'],
  ...tseslint.configs.strictTypeChecked.map((config) => ({
    ...config,
    files: typeScriptFiles,
  })),
  ...tseslint.configs.stylisticTypeChecked.map((config) => ({
    ...config,
    files: typeScriptFiles,
  })),
  {
    files: typeScriptFiles,
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  eslintComments.recommended,
  {
    rules: {
      '@eslint-community/eslint-comments/require-description': 'error',
    },
  },
  {
    files: typeScriptFiles,
    rules: {
      '@typescript-eslint/consistent-type-assertions': [
        'error',
        { assertionStyle: 'never' },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/consistent-type-exports': [
        'error',
        { fixMixedExportsWithInlineTypeSpecifier: true },
      ],
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
      // Deprecated; no-empty-object-type covers it.
      '@typescript-eslint/no-empty-interface': 'off',
      '@typescript-eslint/explicit-function-return-type': [
        'error',
        {
          allowExpressions: true,
          allowTypedFunctionExpressions: true,
          allowHigherOrderFunctions: true,
        },
      ],
      // Its fix writes `x!`, which no-non-null-assertion bans, and
      // assertionStyle 'never' already bans the `as` form it targets.
      '@typescript-eslint/non-nullable-type-assertion-style': 'off',
    },
  },
  {
    files: ['**/*.css'],
    language: 'css/css',
    plugins: { css },
    rules: {
      'css/use-baseline': ['error', { available: baselineYear }],
    },
  },
  {
    files: typeScriptFiles,
    plugins: { 'baseline-js': baselineJs },
    rules: {
      'baseline-js/use-baseline': [
        'error',
        {
          available: baselineYear,
          includeWebApis: { preset: 'type-aware' },
          includeJsBuiltins: { preset: 'type-aware' },
        },
      ],
    },
  },
  ...storybook.configs['flat/recommended'],
  ...storybook.configs['flat/csf-strict'],
  {
    files: ['**/.storybook/main.@(js|cjs|mjs|ts)'],
    rules: {
      // Dependencies live in the root package.json, but projects lint from
      // their own root.
      'storybook/no-uninstalled-addons': [
        'error',
        {
          packageJsonLocation: path.join(import.meta.dirname, 'package.json'),
        },
      ],
    },
  },
  {
    ignores: ['**/dist', '**/out-tsc', '**/storybook-static'],
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      '@nx/enforce-module-boundaries': ['error', moduleBoundaries],
    },
  },
  {
    // Specs and stories never ship, so they may import the non-buildable
    // ngx-yeti-testing helpers from a buildable library.
    files: ['**/*.spec.ts', '**/*.stories.ts', '**/.storybook/**/*.ts'],
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        { ...moduleBoundaries, enforceBuildableLibDependency: false },
      ],
    },
  },
  {
    files: [
      '**/*.ts',
      '**/*.tsx',
      '**/*.cts',
      '**/*.mts',
      '**/*.js',
      '**/*.jsx',
      '**/*.cjs',
      '**/*.mjs',
    ],
    // Override or add rules here
    rules: {},
  },
];
