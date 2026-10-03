import path from 'node:path';
import nx from '@nx/eslint-plugin';
import angular from 'angular-eslint';
import storybook from 'eslint-plugin-storybook';
import tseslint from 'typescript-eslint';

const typeScriptFiles = ['**/*.ts', '**/*.tsx', '**/*.cts', '**/*.mts'];

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
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: ['^.*/eslint(\\.base)?\\.config\\.[cm]?[jt]s$'],
          depConstraints: [
            {
              sourceTag: '*',
              onlyDependOnLibsWithTags: ['*'],
            },
          ],
        },
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
